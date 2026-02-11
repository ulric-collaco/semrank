#!/bin/bash

# ========================================
# SemRank API Test Script (bash)
# Tests all API endpoints
# ========================================

API_URL="${1:-http://localhost:8787}"

echo "🧪 SemRank API Test Suite"
echo "========================="
echo "Base URL: $API_URL"
echo ""

declare -a endpoints=(
    "API Documentation|$API_URL/api"
    "Health Check|$API_URL/api/health"
    "Get All Students|$API_URL/api/students"
    "Get Student by Roll|$API_URL/api/students/roll/10578"
    "Search Students|$API_URL/api/students/search?q=John"
    "Leaderboard CGPA|$API_URL/api/leaderboard/cgpa?limit=10&class=all"
    "Leaderboard Attendance|$API_URL/api/leaderboard/attendance?limit=10&class=all"
    "Class Rankings|$API_URL/api/leaderboard/classes"
    "Today's Birthdays|$API_URL/api/birthdays/today"
    "Random Pair|$API_URL/api/game/random-pair"
)

passed=0
failed=0

for endpoint in "${endpoints[@]}"; do
    IFS='|' read -r name url <<< "$endpoint"
    
    echo "🧪 Testing: $name"
    echo "   URL: $url"
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo "   ✅ Status: $http_code"
        echo "   📊 Response: ${body:0:150}..."
        ((passed++))
    else
        echo "   ❌ Status: $http_code"
        echo "   Error: $body"
        ((failed++))
    fi
    
    echo ""
    sleep 0.2
done

echo ""
echo "📊 Test Summary"
echo "==============="
echo "✅ Passed: $passed"
echo "❌ Failed: $failed"

total=$((passed + failed))
success_rate=$(awk "BEGIN {printf \"%.1f\", ($passed/$total)*100}")
echo "📈 Success Rate: $success_rate%"

if [ $failed -gt 0 ]; then
    echo ""
    echo "⚠️  Some tests failed. Check the output above for details."
    exit 1
else
    echo ""
    echo "🎉 All tests passed!"
    exit 0
fi
