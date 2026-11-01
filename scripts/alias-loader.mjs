// Lets plain Node resolve the project's "@/..." imports so test scripts can
// call library code (lib/*.js) directly. Used only by scripts/test-*.mjs.
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const base = path.join(root, specifier.slice(2));
    for (const candidate of [base, `${base}.js`, `${base}.jsx`, path.join(base, 'index.js')]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
