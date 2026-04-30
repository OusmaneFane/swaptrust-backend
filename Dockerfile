# syntax=docker/dockerfile:1

# bookworm (buildpack-deps) : curl + OpenSSL déjà présents → pas d’apt-get pendant le build
# (moins d’écritures disque ; évite souvent les erreurs RO/I-O sur Docker Desktop saturé)
FROM node:22-bookworm AS builder
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
ENV PNPM_VERSION=9.15.9
# pnpm refuse de s’exécuter sans SHELL défini (Docker RUN minimal)
ENV SHELL=/bin/bash

RUN mkdir -p "${PNPM_HOME}" \
  && curl -fsSL https://get.pnpm.io/install.sh | sh - \
  && pnpm --version

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts nest-cli.json tsconfig.json tsconfig.build.json ./

ARG DATABASE_URL=mysql://swaptrust:password@127.0.0.1:3306/swaptrust
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_OPTIONS=--experimental-require-module

RUN pnpm install --frozen-lockfile

COPY src ./src/
COPY docs ./docs/

RUN pnpm exec prisma generate \
  && pnpm run build \
  && test -f dist/main.js

FROM node:22-bookworm AS runner
WORKDIR /app

RUN groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nestjs

ENV NODE_ENV=production
ENV NODE_OPTIONS=--experimental-require-module

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
