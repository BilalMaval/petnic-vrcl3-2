/**
 * Convert any string to a URL-safe slug.
 * Lowercase, ASCII-letters/digits/dashes only, no leading/trailing/consecutive dashes.
 */
export function slugify(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, '') // drop quotes/apostrophes outright
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
