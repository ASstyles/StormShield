#!/bin/sh
set -e

# Default PORT to 80 if not set (Render provides PORT dynamically, e.g. 10000)
export PORT="${PORT:-80}"

echo "[StormShield Nginx] Configuring listen port: ${PORT}"

# Substitute ${PORT} in nginx template and write active configuration
if [ -f /etc/nginx/templates/default.conf.template ]; then
    envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
fi

exec "$@"
