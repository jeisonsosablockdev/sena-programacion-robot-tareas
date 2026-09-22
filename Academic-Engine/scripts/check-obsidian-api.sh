#!/usr/bin/env bash
set -euo pipefail

PORT="27124"
API_KEY="a70389780bb0163f07d92119aef78bb49ac6521d5d6117ffdff509c2f204c08f"
BASE_URL="https://127.0.0.1:${PORT}"

echo "================================================"
echo "🧪 Obsidian Local REST API Smoketest"
echo "================================================"
echo "Connecting to ${BASE_URL}..."

# 1. Health check & manifest
STATUS_RESPONSE=$(curl -k -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer ${API_KEY}" \
  "${BASE_URL}/" || true)

HTTP_STATUS=$(echo "$STATUS_RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY=$(echo "$STATUS_RESPONSE" | sed '/HTTP_STATUS:/d')

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo "❌ Error: Could not connect to Local REST API (HTTP Status: ${HTTP_STATUS:-unreachable})"
  echo "Make sure Obsidian is running with the 'Local REST API with MCP' plugin enabled."
  exit 1
fi

echo "✅ Connection successful! (HTTP 200 OK)"
echo "$BODY" | grep -E '"service"|"status"|"version"|"authenticated"' || echo "$BODY"

echo ""
echo "📁 Listing vault contents..."
curl -k -s \
  -H "Authorization: Bearer ${API_KEY}" \
  "${BASE_URL}/vault/"

echo ""
echo "================================================"
echo "✨ Smoketest passed successfully!"
echo "================================================"
