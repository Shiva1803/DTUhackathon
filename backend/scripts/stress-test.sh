#!/bin/bash

# ===========================================
# Parallax Backend Stress Test
# Tests 3 simultaneous audio uploads
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${1:-http://localhost:3001}"
TOKEN="${2}"

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Usage: $0 <API_URL> <JWT_TOKEN>${NC}"
  echo "Example: $0 http://localhost:3001 eyJhbGc..."
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Parallax Backend Stress Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "API URL: $API_URL"
echo "Testing 3 simultaneous uploads..."
echo ""

# Create test audio files (1 second of silence)
echo -e "${YELLOW}Creating test audio files...${NC}"
for i in 1 2 3; do
  # Create a simple WAV file (1 second, 16kHz, mono)
  ffmpeg -f lavfi -i "sine=frequency=440:duration=1" -ar 16000 -ac 1 "/tmp/test_audio_$i.wav" -y 2>/dev/null || {
    echo -e "${YELLOW}ffmpeg not found, using dd to create dummy files${NC}"
    dd if=/dev/zero of="/tmp/test_audio_$i.wav" bs=1024 count=100 2>/dev/null
  }
done

echo -e "${GREEN}✅ Test files created${NC}"
echo ""

# Function to upload audio
upload_audio() {
  local id=$1
  local start_time=$(date +%s%N)
  
  echo -e "${YELLOW}[Upload $id] Starting...${NC}"
  
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -F "audio=@/tmp/test_audio_$id.wav" \
    -F "title=Stress Test $id" \
    "$API_URL/api/log")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  local end_time=$(date +%s%N)
  local duration=$(( (end_time - start_time) / 1000000 ))
  
  if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}[Upload $id] ✅ Success (${duration}ms) - HTTP $http_code${NC}"
    echo "$body" | jq -r '.data.id // .id // "unknown"' > "/tmp/upload_$id.id"
  else
    echo -e "${RED}[Upload $id] ❌ Failed (${duration}ms) - HTTP $http_code${NC}"
    echo "$body"
  fi
}

# Run 3 simultaneous uploads
echo -e "${BLUE}Starting 3 simultaneous uploads...${NC}"
echo ""

start_total=$(date +%s)

upload_audio 1 &
PID1=$!
upload_audio 2 &
PID2=$!
upload_audio 3 &
PID3=$!

# Wait for all uploads to complete
wait $PID1
wait $PID2
wait $PID3

end_total=$(date +%s)
total_duration=$((end_total - start_total))

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Results${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Total time: ${total_duration}s"
echo ""

# Check results
success_count=0
for i in 1 2 3; do
  if [ -f "/tmp/upload_$i.id" ]; then
    id=$(cat "/tmp/upload_$i.id")
    if [ "$id" != "unknown" ] && [ -n "$id" ]; then
      echo -e "${GREEN}✅ Upload $i: Success (ID: $id)${NC}"
      ((success_count++))
    else
      echo -e "${RED}❌ Upload $i: Failed${NC}"
    fi
  else
    echo -e "${RED}❌ Upload $i: Failed${NC}"
  fi
done

echo ""
echo -e "${BLUE}Success Rate: $success_count/3${NC}"

# Cleanup
rm -f /tmp/test_audio_*.wav /tmp/upload_*.id

if [ $success_count -eq 3 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 0
else
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}❌ Some tests failed${NC}"
  echo -e "${RED}========================================${NC}"
  exit 1
fi
