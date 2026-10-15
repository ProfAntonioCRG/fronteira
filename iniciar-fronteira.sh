#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Instale o Node.js LTS uma vez em https://nodejs.org e tente novamente."
  exit 1
fi
exec node tools/servidor-local.mjs --open