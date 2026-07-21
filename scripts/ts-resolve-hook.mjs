/**
 * Résolveur ESM : pour un import relatif sans extension, essaie .ts puis .tsx
 * puis /index.ts, comme le fait le bundler. Sinon délègue au résolveur natif.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-z]+$/i.test(specifier)) {
    const base = fileURLToPath(new URL(specifier, context.parentURL));
    for (const cand of [base + '.ts', base + '.tsx', base + '/index.ts']) {
      if (existsSync(cand)) return { url: pathToFileURL(cand).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
