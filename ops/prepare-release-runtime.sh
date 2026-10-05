#!/bin/sh
set -eu

umask 077

release_root=${1:-}
runtime_config=/etc/lundgaard/pg-utils.json

if [ -z "$release_root" ] || [ ! -d "$release_root" ] || [ ! -f "$release_root/package.json" ]; then
  echo "Invalid Lundgaard release root" >&2
  exit 64
fi

if [ ! -f "$runtime_config" ] || [ ! -r "$runtime_config" ]; then
  echo "Lundgaard PostgreSQL runtime configuration is unavailable" >&2
  exit 1
fi

link="$release_root/pg-utils.json"
if [ -e "$link" ] && [ ! -L "$link" ]; then
  echo "Release pg-utils.json must be a symlink" >&2
  exit 1
fi

if [ -L "$link" ] && [ "$(readlink "$link")" != "$runtime_config" ]; then
  rm -f "$link"
fi
[ -L "$link" ] || ln -s "$runtime_config" "$link"

if [ "$(readlink -f "$link")" != "$runtime_config" ]; then
  echo "Release pg-utils.json target is invalid" >&2
  exit 1
fi

echo "pg-utils runtime link ready: $link"
