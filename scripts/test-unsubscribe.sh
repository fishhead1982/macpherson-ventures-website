#!/usr/bin/env bash
# Local checks for the unsubscribe page, API and email logo assets.
set -euo pipefail

BASE="${1:-http://127.0.0.1:8787}"
TOKEN="${OPTOUT_API_TOKEN:-}"
if [[ -z "$TOKEN" && -f .dev.vars ]]; then
  TOKEN="$(awk -F= '/^OPTOUT_API_TOKEN=/{print substr($0, index($0,$2))}' .dev.vars | tr -d '[:space:]')"
fi
if [[ -z "$TOKEN" && -f /workspace/secrets/macpherson-ventures-optout-api-token ]]; then
  TOKEN="$(tr -d '[:space:]' < /workspace/secrets/macpherson-ventures-optout-api-token)"
fi
if [[ -z "$TOKEN" ]]; then
  echo "No OPTOUT_API_TOKEN found. Set it, or add it to .dev.vars."
  exit 1
fi
EMAIL="optout-test-$(date +%s)@example.com"
ENC_EMAIL="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$EMAIL")"
FAIL=0

ok() { printf 'OK  %s\n' "$1"; }
bad() { printf 'FAIL  %s\n' "$1"; FAIL=1; }

code="$(curl -sS -o /tmp/unsub.html -w '%{http_code}' "$BASE/unsubscribe?e=$ENC_EMAIL")"
if [[ "$code" == "200" ]] && grep -q 'name="robots" content="noindex, nofollow"' /tmp/unsub.html && grep -q "value=\"${EMAIL}\"" /tmp/unsub.html; then
  ok "GET /unsubscribe prefills the email and has noindex"
else
  bad "GET /unsubscribe (status $code)"
fi

# Form POST should redirect to the confirmation page
code="$(curl -sS -o /tmp/unsub-post.txt -w '%{http_code}' -D /tmp/unsub-post.hdr -X POST "$BASE/unsubscribe" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "email=$EMAIL")"
location="$(rg -i '^location:' /tmp/unsub-post.hdr | awk '{print $2}' | tr -d '\r')"
if [[ "$code" == "303" && "$location" == *done=1* ]]; then
  ok "POST /unsubscribe form returns 303 to confirmation"
else
  bad "POST /unsubscribe form (status $code, location $location)"
fi

# Follow the confirmation
code="$(curl -sS -o /tmp/unsub-done.html -w '%{http_code}' "$BASE$location")"
if [[ "$code" == "200" ]] && grep -q "You've been unsubscribed" /tmp/unsub-done.html && grep -q "$EMAIL" /tmp/unsub-done.html; then
  ok "confirmation page shows the address"
else
  bad "confirmation page (status $code)"
fi

# Idempotent: posting again still succeeds
code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$BASE/unsubscribe" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "email=$EMAIL")"
if [[ "$code" == "303" ]]; then
  ok "second POST is still a success"
else
  bad "second POST (status $code)"
fi

# RFC 8058 one-click for a second address
EMAIL2="oneclick-test-$(date +%s)@example.com"
ENC2="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$EMAIL2")"
code="$(curl -sS -o /tmp/oneclick.txt -w '%{http_code}' -X POST "$BASE/unsubscribe?e=$ENC2" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'List-Unsubscribe=One-Click')"
if [[ "$code" == "200" ]] && grep -q 'OK' /tmp/oneclick.txt; then
  ok "RFC 8058 POST /unsubscribe returns 200 OK"
else
  bad "RFC 8058 POST (status $code, body $(cat /tmp/oneclick.txt))"
fi

# API is not public
code="$(curl -sS -o /tmp/api-unauth.json -w '%{http_code}' "$BASE/api/optouts")"
if [[ "$code" == "401" ]]; then
  ok "GET /api/optouts without a token is 401"
else
  bad "unauthorised API (status $code)"
fi

# Full list
code="$(curl -sS -o /tmp/api-list.json -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE/api/optouts")"
if [[ "$code" == "200" ]] && grep -q "$EMAIL" /tmp/api-list.json && grep -q "$EMAIL2" /tmp/api-list.json; then
  ok "GET /api/optouts returns both opt-outs as JSON"
else
  bad "list API (status $code, body $(cat /tmp/api-list.json))"
fi

# Single check
code="$(curl -sS -o /tmp/api-one.json -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE/api/optouts?e=$ENC_EMAIL")"
if [[ "$code" == "200" ]] && grep -q '"optedOut":true' /tmp/api-one.json; then
  ok "GET /api/optouts?e= reports optedOut true"
else
  bad "single check (status $code, body $(cat /tmp/api-one.json))"
fi

code="$(curl -sS -o /tmp/api-miss.json -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$BASE/api/optouts?e=nobody%40example.com")"
if [[ "$code" == "200" ]] && grep -q '"optedOut":false' /tmp/api-miss.json; then
  ok "GET /api/optouts?e= reports optedOut false for an unknown address"
else
  bad "missing check (status $code, body $(cat /tmp/api-miss.json))"
fi

# Existing routes still work
for path in / /privacy /about; do
  code="$(curl -sS -o /tmp/route-body -w '%{http_code}' -D /tmp/route.hdr "$BASE$path")"
  if [[ "$path" == "/about" ]]; then
    loc="$(rg -i '^location:' /tmp/route.hdr | awk '{print $2}' | tr -d '\r')"
    if [[ "$code" =~ ^30[12378]$ && "$loc" == *#about* ]]; then
      ok "GET $path redirects to $loc"
    else
      bad "GET $path (status $code, location $loc)"
    fi
  elif [[ "$code" == "200" ]]; then
    ok "GET $path returns 200"
  else
    bad "GET $path (status $code)"
  fi
done

# Email logos
for name in mv-logo-full-320.png mv-logo-full-reversed-320.png; do
  code="$(curl -sS -o /tmp/$name -w '%{http_code}' -D /tmp/$name.hdr "$BASE/assets/email/$name")"
  ctype="$(rg -i '^content-type:' /tmp/$name.hdr | awk '{print $2}' | tr -d '\r')"
  cache="$(rg -i '^cache-control:' /tmp/$name.hdr | cut -d' ' -f2- | tr -d '\r')"
  acao="$(rg -i '^access-control-allow-origin:' /tmp/$name.hdr | awk '{print $2}' | tr -d '\r')"
  sig="$(od -An -N8 -tx1 /tmp/$name | tr -d ' \n')"
  if [[ "$code" == "200" && "$ctype" == *image/png* && "$cache" == *max-age=31536000* && "$acao" == "*" && "$sig" == "89504e470d0a1a0a" ]]; then
    ok "GET /assets/email/$name is PNG, cached, and allows cross-origin use ($ctype; $cache)"
  else
    bad "GET /assets/email/$name (status $code, type $ctype, cache $cache, acao $acao, sig $sig)"
    echo "----- headers -----"
    cat /tmp/$name.hdr
  fi
done

# Privacy mentions immediate action
if grep -q "act on unsubscribe requests immediately" /tmp/route-body || curl -sS "$BASE/privacy" | grep -q "act on unsubscribe requests immediately"; then
  ok "privacy policy mentions immediate action"
else
  # /privacy was last non-logo route? the last path in the loop was /about.
  curl -sS "$BASE/privacy" -o /tmp/privacy.html
  if grep -q "act on unsubscribe requests immediately" /tmp/privacy.html; then
    ok "privacy policy mentions immediate action"
  else
    bad "privacy policy missing immediate-action wording"
  fi
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "Some checks failed."
  exit 1
fi
echo "All checks passed."
