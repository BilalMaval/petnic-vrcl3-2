import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import BlogPostClient from './BlogPostClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.petnicstudio.com';

export const revalidate = 300;

/**
 * Strip head-section noise from user-uploaded full-page HTML so it doesn't
 * fight the canonical/title/meta we set via Next's generateMetadata.
 * Preserves <style> blocks and stylesheet <link>s (the article's design) by
 * lifting them into the body before the head is removed.
 */
function sanitizeFullHtmlPage(html) {
  if (!html || typeof html !== 'string') return html;
  let out = html;

  // 1. Extract <style>...</style> blocks anywhere (head or body) to preserve them.
  const styleBlocks = [];
  out = out.replace(/<style\b[\s\S]*?<\/style>/gi, (m) => {
    styleBlocks.push(m);
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
    .select('*, blog_categories(id, name, slug)')
    .eq('slug', clean)
    .eq('status', 'published')
    .maybeSingle();

  if (!data) {
    // Tolerate legacy slugs with different casing.
    const fb = await supabase
      .from('blog_posts')
      .select('*, blog_categories(id, name, slug)')
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
    post.excerpt ||
    (post.content ? String(post.content).replace(/<[^>]+>/g, '').slice(0, 160) : null) ||
    'Read expert pet care tips and guides from Petnic Studio.';

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const image = post.image_url || `${SITE_URL}/og-blog-default.jpg`;

  return {
    title: `${post.title} | Petnic Studio Blog`,
    description,
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

  return <BlogPostClient slug={cleanPost.slug} initialPost={cleanPost} />;
}
