"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Prisma 7 + pnpm : le CLI charge `zeptomatch` (ESM) via `require()`, ce qui
 * provoque ERR_REQUIRE_ESM (ex. Node 22.7). Ne pas utiliser `pnpm exec prisma` :
 * utiliser `pnpm run prisma -- <commande>` (ex. `pnpm run prisma -- migrate dev --name init`)
 * ou les raccourcis `pnpm prisma:migrate`, etc. (voir scripts du package.json).
 */
require("dotenv/config");
var config_1 = require("prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
    },
    datasource: {
        url: (0, config_1.env)('DATABASE_URL'),
    },
});
