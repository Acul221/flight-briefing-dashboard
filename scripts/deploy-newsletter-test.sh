#!/bin/bash
set -e

# --- Load environment variables ---
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
elif [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# --- Mode pilih local atau prod ---
MODE=${1:-prod}

if [ "$MODE" == "local" ]; then
  BASE_URL="http://localhost:8888/.netlify/functions"
  echo "🌐 Running in LOCAL mode: $BASE_URL"
else
  # pakai www supaya tidak kena redirect 301
  BASE_URL="https://www.skydeckpro.id/.netlify/functions"
  echo "🌐 Running in PRODUCTION mode: $BASE_URL"
fi

# --- Config ---
CAMPAIGN_ID="11111111-2222-3333-4444-555555555555"
SUBJECT="Automated Test Campaign and Newsletter "
USER1="<UUID_USER_1>"
USER2="<UUID_USER_2>"
EMAIL1="hasrullahazis@gmail.com"
EMAIL2="skydeckpro@gmail.com"

SUPABASE_URL="${SUPABASE_URL:-$VITE_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE}"

# --- Step 1: Register campaign ---
echo ""
echo "🔹 Registering campaign..."
curl -s -L -X POST "$BASE_URL/register-campaign" \
  -H "Content-Type: application/json" \
  -d "{\"campaignId\":\"$CAMPAIGN_ID\",\"subject\":\"$SUBJECT\"}" | jq .

# --- Step 2: Send newsletter ---
echo ""
echo "🔹 Sending newsletter..."
curl -s -L -X POST "$BASE_URL/send-newsletter" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaignId\":\"$CAMPAIGN_ID\",
    \"subject\":\"$SUBJECT\",
    \"html\":\"<h1>Hello Test!</h1><p>This is automated newsletter 🚀</p>\",
    \"recipients\":[
      {\"id\":\"$USER1\",\"email\":\"$EMAIL1\"},
      {\"id\":\"$USER2\",\"email\":\"$EMAIL2\"}
    ]
  }" | jq .

# --- Step 3: Simulate open/click/unsub ---
echo ""
echo "🔹 Simulating open tracking for USER1..."
curl -s -L "$BASE_URL/track-open?c=$CAMPAIGN_ID&u=$USER1" --output /dev/null
echo "Done ✅"

echo "🔹 Simulating click tracking for USER1..."
curl -s -i -L "$BASE_URL/track-click?c=$CAMPAIGN_ID&u=$USER1&url=https://skydeckpro.id" | head -n 5

echo ""
echo "🔹 Simulating unsubscribe for USER2..."
curl -s -L "$BASE_URL/track-unsub?c=$CAMPAIGN_ID&u=$USER2" | head -n 10

# --- Step 4: Fetch campaign report from Supabase ---
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
  echo ""
  echo "📊 Fetching campaign report from Supabase (newsletter_logs)..."

  curl -s -L "$SUPABASE_URL/rest/v1/newsletter_logs?campaign_id=eq.$CAMPAIGN_ID" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    | jq 'group_by(.campaign_id)[] | {
        campaign_id: .[0].campaign_id,
        sent: map(select(.status=="success")) | length,
        opened: map(select(.opened==true)) | length,
        clicked: map(select(.clicked==true)) | length,
        unsubscribed: map(select(.unsubscribed==true)) | length
      }'

  echo ""
  echo "📊 Fetching campaign summary from Supabase (newsletter_summary)..."

  curl -s -L "$SUPABASE_URL/rest/v1/newsletter_summary?campaign_id=eq.$CAMPAIGN_ID" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    | jq .
else
  echo ""
  echo "⚠️ Supabase report skipped: SUPABASE_URL / SUPABASE_SERVICE_ROLE not set"
fi
