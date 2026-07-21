/**
 * Hook de résolution pour exécuter le code applicatif TypeScript avec le
 * type-stripping natif de Node (les tests importent app/lib/*.ts directement).
 * Ajoute la résolution des specifiers sans extension (« ./brands » → « ./brands.ts »)
 * que Next/webpack fait nativement mais que l'ESM de Node ne fait pas.
 *
 * Usage : node --import ./scripts/ts-resolve.mjs scripts/test-*.mjs
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('./ts-resolve-hook.mjs', pathToFileURL(import.meta.dirname + '/'));
