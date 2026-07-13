import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getSupabaseAdmin } from '@/lib/supabase';
import BlogPostClient from './BlogPostClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const revalidate = 300;

const FULL_PAGE_SCOPE = '.blog-full-page';

/**
 * Prefix every top-level selector in a CSS string with a scope selector so
 * user-uploaded stylesheets can't leak past the article wrapper (a global
 * `* { margin: 0 }` reset or an unscoped `h3 { ... }` rule would otherwise
 * bleed into the site header/footer on that page). Recurses into @media /
 * @supports blocks; leaves @keyframes, @font-face, @import etc. untouched
 * since those aren't selector-based and are safe to keep global.
 */
function scopeCss(css, scope) {
  let result = '';
  let i = 0;
  const len = css.length;

  while (i < len) {
    const braceIndex = css.indexOf('{', i);
    const semiIndex = css.indexOf(';', i);

    if (braceIndex === -1) {
      result += css.slice(i);
      break;
    }
    if (semiIndex !== -1 && semiIndex < braceIndex) {
      // Statement like @import/@charset with no block — copy as-is.
      result += css.slice(i, semiIndex + 1);
      i = semiIndex + 1;
      continue;
    }

    const header = css.slice(i, braceIndex).trim();

    // Find the matching closing brace, respecting nesting.
    let depth = 0;
    let blockEnd = -1;
    for (let k = braceIndex; k < len; k++) {
      if (css[k] === '{') depth++;
      else if (css[k] === '}') {
        depth--;
        if (depth === 0) { blockEnd = k; break; }
      }
    }
    if (blockEnd === -1) {
      result += css.slice(i);
      break;
    }
    const blockContent = css.slice(braceIndex + 1, blockEnd);

    if (header.startsWith('@')) {
      const atName = (header.match(/^@([a-zA-Z-]+)/) || [])[1]?.toLowerCase();
      if (atName === 'media' || atName === 'supports' || atName === 'document' || atName === 'layer') {
        result += `${header} {${scopeCss(blockContent, scope)}}`;
      } else {
        // @keyframes, @font-face, @page, etc. — not selector-based, keep as-is.
        result += `${header} {${blockContent}}`;
      }
    } else {
      const scopedSelectors = header
        .split(',')
        .map((sel) => sel.trim())
        .filter(Boolean)
        .map((sel) => {
          if (sel === '*' || sel === 'html' || sel === 'body' || sel === ':root') return scope;
          if (sel.startsWith('*')) return `${scope} ${sel}`;
          return `${scope} ${sel}`;
        })
        .join(', ');
      result += `${scopedSelectors} {${blockContent}}`;
    }

    i = blockEnd + 1;
  }

  return result;
}

/**
 * Strip head-section noise from user-uploaded full-page HTML so it doesn't
 * fight the canonical/title/meta we set via Next's generateMetadata.
 * Preserves <style> blocks and stylesheet <link>s (the article's design) by
 * lifting them into the body before the head is removed. Style content is
 * scoped to the article wrapper so it can never affect the rest of the site.
 */
function sanitizeFullHtmlPage(html) {
  if (!html || typeof html !== 'string') return html;
  let out = html;

  // 1. Extract <style>...</style> blocks anywhere (head or body), scope their
  //    CSS to the article wrapper, and preserve them for re-injection.
  const styleBlocks = [];
  out = out.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (m, cssContent) => {
    const scoped = scopeCss(cssContent, FULL_PAGE_SCOPE);
    styleBlocks.push(`<style>${scoped}</style>`);
    return '';
  });

  // 2. Extract stylesheet <link>s (rel=stylesheet) and font/preload links.
  const linkBlocks = [];
  out = out.replace(/<link\b[^>]*>/gi, (m) => {
    const rel = (m.match(/rel\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    const r = rel.toLowerCase();
    if (
      r.includes('stylesheet') ||
      r.includes('preload') ||
      r.includes('preconnect') ||
      r.includes('dns-prefetch')
    ) {
      linkBlocks.push(m);
    }
    // Either way, remove it from its current location – we'll re-insert preserved
    // ones at the top of the body. SEO-relevant links (canonical, alternate,
    // icon, manifest) are dropped intentionally.
    return '';
  });

  // 3. Drop <head>...</head> entirely (its meaningful styles have been hoisted).
  out = out.replace(/<head[\s\S]*?<\/head>/gi, '');

  // 4. Drop stray head-only tags that may appear outside <head>.
  out = out.replace(/<title[\s\S]*?<\/title>/gi, '');
  out = out.replace(/<meta\b[^>]*>/gi, '');
  out = out.replace(/<base\b[^>]*>/gi, '');

  // 5. Unwrap <html> and <body> tags but keep their inner content.
  out = out.replace(/<\/?html\b[^>]*>/gi, '');
  out = out.replace(/<\/?body\b[^>]*>/gi, '');

  // 6. Re-inject preserved styles and stylesheet links at the top so the body
  //    content still renders with its intended design.
  const preserved = [...linkBlocks, ...styleBlocks].join('\n');
  return (preserved + '\n' + out).trim();
}

async function fetchPostBySlug(slug) {
  const clean = String(slug || '').trim();
  if (!clean) return null;
  const supabase = getSupabaseAdmin();

  let { data } = await supabase
    .from('blog_posts')
    .select('*, blog_categories(id, name, slug), related_category:categories!blog_posts_related_category_id_fkey(id, name, slug), related_product:products!blog_posts_related_product_id_fkey(id, name, slug, image_url, price)')
    .eq('slug', clean)
    .eq('status', 'published')
    .maybeSingle();

  if (!data) {
    // Tolerate legacy slugs with different casing.
    const fb = await supabase
      .from('blog_posts')
      .select('*, blog_categories(id, name, slug), related_category:categories!blog_posts_related_category_id_fkey(id, name, slug), related_product:products!blog_posts_related_product_id_fkey(id, name, slug, image_url, price)')
      .ilike('slug', clean)
      .eq('status', 'published')
      .maybeSingle();
    data = fb.data;
  }

  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | Petnic Studio Blog',
      description: 'This blog post could not be found.',
      robots: { index: false, follow: false },
      alternates: { canonical: `${SITE_URL}/blog` },
    };
  }

  const description =
    post.meta_description ||
    post.excerpt ||
    (post.content ? String(post.content).replace(/<[^>]+>/g, '').slice(0, 160) : null) ||
    'Read expert pet care tips and guides from Petnic Studio.';

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const image = post.image_url || `${SITE_URL}/og-blog-default.jpg`;

  return {
    title: `${post.title} | Petnic Studio Blog`,
    description,
    keywords: post.tags?.length ? post.tags.join(', ') : undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      authors: post.author_name ? [post.author_name] : undefined,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) notFound();

  // Sanitize user-uploaded HTML so it can't override our canonical/title/meta.
  const cleanPost = post.full_html_page
    ? { ...post, full_html_page: sanitizeFullHtmlPage(post.full_html_page) }
    : post;

  const description =
    post.meta_description ||
    post.excerpt ||
    (post.content ? String(post.content).replace(/<[^>]+>/g, '').slice(0, 160) : null) ||
    'Read expert pet care tips and guides from Petnic Studio.';
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const image = post.image_url || `${SITE_URL}/og-blog-default.jpg`;
  const faqs = Array.isArray(post.faqs) ? post.faqs.filter(f => f?.question && f?.answer) : [];

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: [image],
    url: canonicalUrl,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      '@type': 'Person',
      name: post.author_name || 'Petnic Studio',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Petnic Studio',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/petnic-logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  return (
    <>
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Script
        id="blog-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <Script
          id="blog-faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <BlogPostClient slug={cleanPost.slug} initialPost={cleanPost} />
    </>
  );
}
