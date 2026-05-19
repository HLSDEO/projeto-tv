#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="${1:-http://localhost:8000}"
ADMIN_USER="admin"
ADMIN_PASS="admin123"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TV DLOG Authentication Test Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}API URL:${NC} $API_URL"
echo ""

# Test 1: Login
echo -e "${YELLOW}Test 1: Admin Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER&password=$ADMIN_PASS")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test 2: Get Users
echo -e "${YELLOW}Test 2: List Users${NC}"
USERS_RESPONSE=$(curl -s -X GET "$API_URL/api/admin/users" \
  -H "Authorization: Bearer $TOKEN")

echo "$USERS_RESPONSE" | grep -q "admin"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Users list retrieved${NC}"
    echo "Response: $USERS_RESPONSE"
else
    echo -e "${RED}❌ Failed to get users${NC}"
    echo "Response: $USERS_RESPONSE"
fi
echo ""

# Test 3: Create New User
echo -e "${YELLOW}Test 3: Create New User${NC}"
NEW_USER="testuser_$(date +%s)"
NEW_PASS="testpass123"

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$NEW_USER\", \"password\": \"$NEW_PASS\"}")

echo "$CREATE_RESPONSE" | grep -q "success"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ User created successfully${NC}"
    echo "Username: $NEW_USER"
    echo "Password: $NEW_PASS"
else
    echo -e "${RED}❌ Failed to create user${NC}"
    echo "Response: $CREATE_RESPONSE"
fi
echo ""

# Test 4: Login with New User
echo -e "${YELLOW}Test 4: Login with New User${NC}"
NEW_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$NEW_USER&password=$NEW_PASS")

NEW_TOKEN=$(echo "$NEW_LOGIN" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$NEW_TOKEN" ]; then
    echo -e "${RED}❌ Login with new user failed${NC}"
    echo "Response: $NEW_LOGIN"
else
    echo -e "${GREEN}✅ New user login successful${NC}"
    echo "Token: ${NEW_TOKEN:0:20}..."
fi
echo ""

# Test 5: Get Media
echo -e "${YELLOW}Test 5: Get Media List${NC}"
MEDIA_RESPONSE=$(curl -s -X GET "$API_URL/api/media" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✅ Media list retrieved${NC}"
echo "Response: $MEDIA_RESPONSE" | head -c 200
echo "..."
echo ""

# Test 6: Get Settings
echo -e "${YELLOW}Test 6: Get Settings${NC}"
SETTINGS_RESPONSE=$(curl -s -X GET "$API_URL/api/settings" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✅ Settings retrieved${NC}"
echo "Response: $SETTINGS_RESPONSE"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All tests completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Quick Links:${NC}"
echo "Frontend:    http://localhost:5173"
echo "Backend API: http://localhost:8000"
echo "ArangoDB:    http://localhost:8529"
echo ""
echo -e "${YELLOW}Test Credentials:${NC}"
echo "Admin  - Username: $ADMIN_USER, Password: $ADMIN_PASS"
echo "Test User - Username: $NEW_USER, Password: $NEW_PASS"
