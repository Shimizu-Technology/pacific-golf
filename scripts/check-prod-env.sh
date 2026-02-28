#!/usr/bin/env bash
set -euo pipefail

RENDER_SERVICE_ID="${RENDER_SERVICE_ID:-srv-d6gk5jrh46gs73dlf4h0}"
NETLIFY_SITE_ID="${NETLIFY_SITE_ID:-69931fa2-398e-4cd0-8e6a-e34a400c051b}"

if [[ -z "${RENDER_API_KEY:-}" ]]; then
  echo "❌ Missing RENDER_API_KEY"
  exit 1
fi

if [[ -z "${NETLIFY_AUTH_TOKEN:-}" ]]; then
  echo "❌ Missing NETLIFY_AUTH_TOKEN"
  exit 1
fi

echo "🔎 Checking Render env vars..."
render_required=(
  DATABASE_URL
  RAILS_MASTER_KEY
  SECRET_KEY_BASE
  FRONTEND_URL
  CLERK_JWKS_URL
  RESEND_API_KEY
  STRIPE_SECRET_KEY
)

render_keys_json=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars")

for key in "${render_required[@]}"; do
  if ! echo "$render_keys_json" | python3 -c "import json,sys; arr=json.load(sys.stdin); keys={(x.get('key') or (x.get('envVar') or {}).get('key')) for x in arr}; sys.exit(0 if '$key' in keys else 1)"; then
    echo "❌ Render missing: $key"
    exit 1
  fi
  echo "✅ Render: $key"
done

echo "🔎 Checking Netlify env vars..."
netlify_required=(
  VITE_API_URL
  VITE_WS_URL
  VITE_CLERK_PUBLISHABLE_KEY
  VITE_CLERK_JWT_TEMPLATE
  VITE_STRIPE_PUBLISHABLE_KEY
)

for key in "${netlify_required[@]}"; do
  val=$(cd "$(dirname "$0")/../web" && NETLIFY_AUTH_TOKEN="$NETLIFY_AUTH_TOKEN" netlify env:get "$key" 2>/dev/null || true)
  if [[ -z "$val" || "$val" == *"No value set"* ]]; then
    echo "❌ Netlify missing: $key"
    exit 1
  fi
  echo "✅ Netlify: $key"
done

echo ""
echo "✅ Production env check passed"
