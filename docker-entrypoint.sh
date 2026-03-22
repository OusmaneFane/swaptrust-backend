#!/bin/sh
set -e
cd /app
export NODE_OPTIONS="${NODE_OPTIONS:---experimental-require-module}"
./node_modules/.bin/prisma migrate deploy
exec "$@"
