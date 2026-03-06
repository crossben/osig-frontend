#!/bin/sh
# Inject runtime environment variables into static JS files
find /app/.next -type f -name "*.js" -exec sed -i "s|__NEXT_PUBLIC_API_URL__|${NEXT_PUBLIC_API_URL:-http://localhost:8000/api/v1}|g" {} \;
exec node server.js
