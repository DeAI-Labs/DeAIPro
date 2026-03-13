#!/bin/bash

# Test Login Quick Reference Script
# Usage: ./test-login-quickstart.sh [user]
# Example: ./test-login-quickstart.sh test_admin

# Colors
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# API URL (default to localhost)
API_URL="${1:-http://localhost:8000}"
TEST_USER="${2:-test_basic}"

# Function to print colored output
print_header() {
    echo -e "\\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠️  jq is not installed. Install it to format JSON output nicely.${NC}"
        echo "   Ubuntu/Debian: sudo apt-get install jq"
        echo "   macOS: brew install jq"
        echo ""
        return 1
    fi
    return 0
}

# Test connection
test_connection() {
    print_header "Testing Connection"
    
    if curl -s "${API_URL}/api/health" > /dev/null 2>&1; then
        print_success "Connected to ${API_URL}"
    else
        echo -e "${YELLOW}⚠️  Could not connect to ${API_URL}${NC}"
        echo "   Make sure the backend server is running"
        exit 1
    fi
}

# Get test token
get_test_token() {
    print_header "Generating Test Token"
    print_info "User: ${TEST_USER}"
    
    local response=$(curl -s -X POST "${API_URL}/api/test-login" \\
        -H "Content-Type: application/json" \\
        -d "{\"test_user\": \"${TEST_USER}\"}")
    
    if check_jq; then
        echo "$response" | jq '.'
    else
        echo "$response"
    fi
    
    # Extract token
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}⚠️  Failed to extract token${NC}"
        exit 1
    fi
    
    print_success "Token generated successfully!"
}

# Store token
store_token() {
    print_header "Storing Token"
    
    # Create a .test-token file
    echo "$TOKEN" > .test-token
    chmod 600 .test-token
    
    print_success "Token saved to .test-token"
    print_info "To use: export TOKEN=\\$(cat .test-token)"
}

# Display usage
show_usage() {
    echo "$TOKEN"
}

# Verify token
verify_token() {
    print_header "Verifying Token"
    
    local response=$(curl -s -X POST "${API_URL}/api/verify-token" \\
        -H "Authorization: Bearer ${TOKEN}")
    
    if check_jq; then
        echo "$response" | jq '.'
    else
        echo "$response"
    fi
}

# Test API call
test_api_call() {
    print_header "Testing API Call"
    print_info "Endpoint: ${API_URL}/api/subnets"
    
    local response=$(curl -s -X GET "${API_URL}/api/subnets" \\
        -H "Authorization: Bearer ${TOKEN}" \\
        -H "Content-Type: application/json" \\
        -w "\\n%{http_code}")
    
    # Extract status code
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" == "200" ]; then
        print_success "API call successful (HTTP $http_code)"
        if check_jq; then
            echo "$body" | jq '.' | head -n 20
            echo "..."
        else
            echo "$body" | head -n 20
        fi
    else
        echo -e "${YELLOW}⚠️  API call failed (HTTP $http_code)${NC}"
        echo "$body"
    fi
}

# Main menu
show_menu() {
    print_header "Test Login Quick Reference"
    echo "Available commands:"
    echo "  1. Get token"
    echo "  2. Verify token"
    echo "  3. Test API call"
    echo "  4. Show token"
    echo "  5. Exit"
    echo ""
}

# Main script
main() {
    print_header "DeAIPro Test Login Manager"
    print_info "API URL: ${API_URL}"
    print_info "Test User: ${TEST_USER}"
    
    test_connection
    get_test_token
    store_token
    verify_token
    
    echo ""
    print_header "Token Information"
    echo -e "Token: ${GREEN}${TOKEN}${NC}"
    echo ""
    echo "Usage in curl:"
    echo -e "  ${BLUE}curl -H 'Authorization: Bearer ${TOKEN}' http://localhost:8000/api/subnets${NC}"
    echo ""
    echo "Usage in JavaScript:"
    echo -e "  ${BLUE}fetch('http://localhost:8000/api/subnets', {${NC}"
    echo -e "    ${BLUE}headers: { 'Authorization': 'Bearer ${TOKEN}' }${NC}"
    echo -e "  ${BLUE}})${NC}"
    echo ""
    
    print_header "Quick Links"
    echo "📚 Documentation:"
    echo "   - TEST_LOGINS.md - Full test login documentation"
    echo "   - INTEGRATION.md - Integration guide"
    echo ""
    echo "🔍 Test API endpoints:"
    echo "   - POST   /api/test-login       - Generate test token"
    echo "   - POST   /api/verify-token     - Verify token"
    echo "   - POST   /api/revoke-temporary - Revoke token"
    echo ""
}

# Run main
main
