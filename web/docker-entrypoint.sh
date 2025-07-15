#!/bin/sh
set -e

# Replace environment variables in config.js
envsubst < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g 'daemon off;'