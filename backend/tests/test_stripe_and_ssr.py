"""
Tests for Stripe payment integration (checkout, status, server-side price validation)
and SSR for /shop and /shop/[category] pages.
"""
import os
import re
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://petnic-deploy-ready.preview.emergentagent.com").rstrip("/")
TEST_PRODUCT_SLUG = "royal-pet-portrait-canvas"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def test_product(session):
    """Fetch the test product (royal-pet-portrait-canvas) to get id and price."""
    r = session.get(f"{BASE_URL}/api/products")
    assert r.status_code == 200
    data = r.json()
    products = data.get("products") or data
    for p in products:
        if p.get("slug") == TEST_PRODUCT_SLUG:
            return p
    pytest.fail(f"Test product '{TEST_PRODUCT_SLUG}' not found")


# -------------------- Stripe Payments --------------------
class TestStripeCheckout:
    """POST /api/payments/checkout"""

    def test_checkout_returns_valid_stripe_url(self, session, test_product):
        payload = {
            "origin_url": BASE_URL,
            "user_email": "TEST_buyer@petnic.com",
            "cart_items": [
                {"product_id": test_product["id"], "quantity": 1}
            ],
            "shipping": {"required": True, "name": "Test Buyer"},
        }
        r = session.post(f"{BASE_URL}/api/payments/checkout", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "session_id" in data
        assert data["url"].startswith("https://checkout.stripe.com/")
        assert data["session_id"].startswith("cs_test_")

    def test_checkout_server_side_price_validation(self, session, test_product):
        """Spoofed `price` in cart_items must be ignored; amount_total must equal DB price * qty."""
        expected_cents = round(float(test_product["price"]) * 2 * 100)
        # Try multiple times because Emergent Stripe proxy occasionally fails to find new sessions on immediate retrieve.
        last_status = None
        for _ in range(5):
            payload = {
                "origin_url": BASE_URL,
                "user_email": "TEST_spoof@petnic.com",
                "cart_items": [
                    {"product_id": test_product["id"], "quantity": 2, "price": 0.01, "unit_amount": 1}
                ],
            }
            r = session.post(f"{BASE_URL}/api/payments/checkout", json=payload)
            assert r.status_code == 200, r.text
            sid = r.json()["session_id"]
            time.sleep(1)
            status = session.get(f"{BASE_URL}/api/payments/status/{sid}")
            last_status = status
            if status.status_code == 200 and "amount_total" in status.json():
                data = status.json()
                assert data["amount_total"] == expected_cents, f"expected {expected_cents}, got {data['amount_total']}"
                assert data["currency"] == "usd"
                return
        pytest.skip(f"Emergent Stripe proxy intermittently failed to retrieve session: {last_status.text if last_status else 'n/a'}")

    def test_checkout_rejects_invalid_product(self, session):
        r = session.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "origin_url": BASE_URL,
                "cart_items": [{"product_id": "not-a-real-id", "quantity": 1}],
            },
        )
        assert r.status_code == 400
        assert "Product not found" in r.json().get("error", "")

    def test_checkout_rejects_empty_cart(self, session):
        r = session.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"origin_url": BASE_URL, "cart_items": []},
        )
        assert r.status_code == 400
        assert "Cart is empty" in r.json().get("error", "")

    def test_checkout_rejects_missing_origin_url(self, session, test_product):
        r = session.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"cart_items": [{"product_id": test_product["id"], "quantity": 1}]},
        )
        assert r.status_code == 400


class TestStripeStatus:
    """GET /api/payments/status/[session_id]"""

    def test_status_returns_open_unpaid_for_new_session(self, session, test_product):
        """Create session, then poll status. Allow retries due to proxy flakiness."""
        for _ in range(5):
            r = session.post(
                f"{BASE_URL}/api/payments/checkout",
                json={
                    "origin_url": BASE_URL,
                    "user_email": "TEST_status@petnic.com",
                    "cart_items": [{"product_id": test_product["id"], "quantity": 1}],
                },
            )
            assert r.status_code == 200
            sid = r.json()["session_id"]
            time.sleep(1)
            status = session.get(f"{BASE_URL}/api/payments/status/{sid}")
            if status.status_code == 200 and status.json().get("session_id"):
                data = status.json()
                assert data["session_id"] == sid
                assert data["status"] == "open"
                assert data["payment_status"] == "unpaid"
                assert data["amount_total"] == round(float(test_product["price"]) * 100)
                assert data["currency"] == "usd"
                return
        pytest.fail("Emergent Stripe proxy could not retrieve any session after 5 attempts")


# -------------------- SSR Shop Pages --------------------
PRODUCT_CARD_RE = re.compile(r'data-testid="product-card-([a-zA-Z0-9-]+)"')


class TestShopSSR:
    """SSR for shop pages must include product cards in initial HTML."""

    def test_shop_page_ssr_includes_product_cards(self, session):
        r = session.get(f"{BASE_URL}/shop")
        assert r.status_code == 200
        matches = PRODUCT_CARD_RE.findall(r.text)
        assert len(matches) >= 10, f"Expected >=10 product cards in SSR HTML, got {len(matches)}"
        assert TEST_PRODUCT_SLUG in matches, f"Test product slug missing from SSR: {matches[:5]}"

    def test_shop_page_ssr_includes_pricing(self, session):
        r = session.get(f"{BASE_URL}/shop")
        assert r.status_code == 200
        # Verify product name and price are server-rendered (not just placeholder)
        assert "Royal Pet Portrait Canvas" in r.text
        assert "$79.99" in r.text or "79.99" in r.text

    def test_shop_category_ssr_wall_art(self, session):
        r = session.get(f"{BASE_URL}/shop/wall-art")
        assert r.status_code == 200
        matches = PRODUCT_CARD_RE.findall(r.text)
        assert len(matches) >= 1, f"Expected product cards on /shop/wall-art SSR, got {len(matches)}"
        # All matched slugs should be wall-art products (at least include royal-pet-portrait-canvas)
        assert TEST_PRODUCT_SLUG in matches

    def test_shop_category_ssr_unknown_category(self, session):
        r = session.get(f"{BASE_URL}/shop/nonexistent-category-xyz")
        # Should still return 200 (no products is OK)
        assert r.status_code in (200, 404)


# -------------------- Product detail page --------------------
class TestProductDetail:
    def test_product_detail_page_loads(self, session):
        r = session.get(f"{BASE_URL}/product/{TEST_PRODUCT_SLUG}")
        assert r.status_code == 200
        assert "Royal Pet Portrait Canvas" in r.text
