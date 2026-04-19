/**
 * Prisma 7 + pnpm : le CLI charge `zeptomatch` (ESM) via `require()`, ce qui
 * provoque ERR_REQUIRE_ESM (ex. Node 22.7). Ne pas utiliser `pnpm exec prisma` :
 * utiliser `pnpm run prisma -- <commande>` (ex. `pnpm run prisma -- migrate dev --name init`)
 * ou les raccourcis `pnpm prisma:migrate`, etc. (voir scripts du package.json).
 *
 * Ne pas générer/committer `prisma.config.js` à la racine : il est chargé avant ce
 * fichier et l’interop CommonJS ajoute `__esModule` à l’export, ce qui fait échouer
 * le validateur (« Failed to parse syntax of config file »).
 */
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node ./node_modules/ts-node/dist/bin.js --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
