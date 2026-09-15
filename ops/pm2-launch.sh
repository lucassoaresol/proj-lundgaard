#!/bin/sh
set -eu

umask 077

config_file=/etc/lundgaard/runtime.env
node_bin=/root/.nvm/versions/node/v25.8.2/bin/node
runtime_root=/root/lundgaard/prod/current

if [ ! -r "$config_file" ]; then
  echo "Lundgaard runtime config is not readable: $config_file" >&2
  exit 1
fi

# runtime.env is root-owned (0600). Only the variables explicitly forwarded to
# env -i below reach the Node.js process.
set -a
. "$config_file"
set +a

: "${AUTH_NOTION:?AUTH_NOTION is required}"
: "${PORT:=5016}"
: "${ENV_TYPE:=linux}"

case "$PORT" in
  *[!0-9]* | "")
    echo "PORT must be numeric" >&2
    exit 1
    ;;
esac

case "$ENV_TYPE" in
  linux | windows) ;;
  *)
    echo "ENV_TYPE must be linux or windows" >&2
    exit 1
    ;;
esac

case "${1:-}" in
  api) entrypoint="$runtime_root/dist/api/index.js" ;;
  worker) entrypoint="$runtime_root/dist/worker/index.js" ;;
  cron) entrypoint="$runtime_root/dist/cron/index.js" ;;
  *)
    echo "Usage: $0 api|worker|cron" >&2
    exit 64
    ;;
esac

if [ ! -x "$node_bin" ] || [ ! -r "$entrypoint" ]; then
  echo "Runtime entrypoint or Node.js interpreter is unavailable" >&2
  exit 1
fi

exec /usr/bin/env -i \
  HOME=/root \
  LANG=C.UTF-8 \
  PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  NODE_ENV=production \
  PORT="$PORT" \
  ENV_TYPE="$ENV_TYPE" \
  AUTH_NOTION="$AUTH_NOTION" \
  "$node_bin" "$entrypoint"
