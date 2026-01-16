#!/bin/bash

# ===========================================
# Parallax Deployment Verification Script
# Quickly verify both frontend and backend are working
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_URL="${1:-http://localhost:3001}"
FRONTEND_URL="${2:-http://localhost:5173}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Parallax Deployment Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local name=$1
  local url=$2
  local expected_code=${3:-200}
  
  echo -n "Testing $name... "
  
  response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "000")
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" -eq "$expected_code" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} (HTTP $http_code, expected $expected_code)"
    ((FAILED++))
    return 1
  fi
}

# Backend Tests
echo -e "${YELLOW}Backend Tests:${NC}"
test_endpoint "Health Check" "$BACKEND_URL/health" 200
test_endpoint "Root Endpoint" "$BACKEND_URL/" 200
test_endpoint "404 Handler" "$BACKEND_URL/nonexistent" 404
echo ""

# Frontend Tests
echo -e "${YELLOW}Frontend Tests:${NC}"
test_endpoint "Frontend Root" "$FRONTEND_URL/" 200
test_endpoint "Frontend Assets" "$FRONTEND_URL/vite.svg" 200
echo ""

# CORS Test
echo -e "${YELLOW}CORS Test:${NC}"
echo -n "Testing CORS headers... "
cors_header=$(curl -s -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/health" | grep -i "access-control-allow-origin" || echo "")
if [ -n "$cors_header" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  echo "  $cors_header"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} (No CORS headers found)"
  ((FAILED++))
fi
echo ""

# SSL Test (if HTTPS)
if [[ $BACKEND_URL == https://* ]]; then
  echo -e "${YELLOW}SSL Test:${NC}"
  echo -n "Testing SSL certificate... "
  ssl_info=$(curl -s -I "$BACKEND_URL/health" 2>&1 | grep -i "SSL certificate" || echo "valid")
  if [[ $ssl_info != *"problem"* ]]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}"
    echo "  $ssl_info"
    ((FAILED++))
  fi
  echo ""
fi

# Database Connection Test
echo -e "${YELLOW}Database Test:${NC}"
echo -n "Testing database connection... "
health_response=$(curl -s "$BACKEND_URL/health")
db_status=$(echo "$health_response" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
if [ "$db_status" = "connected" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} (Database: $db_status)"
  ((FAILED++))
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo -e "${GREEN}Deployment is ready for demo.${NC}"
  echo -e "${GREEN}========================================${NC}"
  exit 0
else
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}❌ Some tests failed${NC}"
  echo -e "${RED}Please fix issues before demo.${NC}"
  echo -e "${RED}========================================${NC}"
  exit 1
fi
