#!/bin/bash
# docker-entrypoint.sh
# Railway injects PORT env var; Apache must listen on that port.

PORT="${PORT:-80}"

# Update Apache to listen on the PORT provided by Railway
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/:80>/:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Start Apache in foreground
exec apache2-foreground
