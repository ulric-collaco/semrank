# ========================================
# SemRank API Test Script (PowerShell)
# Tests all API endpoints
# ========================================

param(
    [string]$ApiUrl = "http://localhost:8787"
)

Write-Host "🧪 SemRank API Test Suite" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Base URL: $ApiUrl" -ForegroundColor White
Write-Host ""

$endpoints = @(
    @{
        Name = "API Documentation"
        Url = "$ApiUrl/api"
    },
    @{
        Name = "Health Check"
        Url = "$ApiUrl/api/health"
    },
    @{
        Name = "Get All Students"
        Url = "$ApiUrl/api/students"
    },
    @{
        Name = "Get Student by Roll (10578)"
        Url = "$ApiUrl/api/students/roll/10578"
    },
    @{
        Name = "Search Students"
        Url = "$ApiUrl/api/students/search?q=John"
    },
    @{
        Name = "Leaderboard CGPA"
        Url = "$ApiUrl/api/leaderboard/cgpa?limit=10&class=all"
    },
    @{
        Name = "Leaderboard Attendance"
        Url = "$ApiUrl/api/leaderboard/attendance?limit=10&class=all"
    },
    @{
        Name = "Class Rankings"
        Url = "$ApiUrl/api/leaderboard/classes"
    },
    @{
        Name = "Today's Birthdays"
        Url = "$ApiUrl/api/birthdays/today"
    },
    @{
        Name = "Random Pair"
        Url = "$ApiUrl/api/game/random-pair"
    }
)

$passed = 0
$failed = 0

foreach ($endpoint in $endpoints) {
    Write-Host "🧪 Testing: $($endpoint.Name)" -ForegroundColor Yellow
    Write-Host "   URL: $($endpoint.Url)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -Method Get -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
            $content = $response.Content.Substring(0, [Math]::Min(150, $response.Content.Length))
            Write-Host "   📊 Response: $content..." -ForegroundColor Gray
            $passed++
        } else {
            Write-Host "   ⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
            $failed++
        }
    }
    catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red

$successRate = [math]::Round(($passed / ($passed + $failed)) * 100, 1)
Write-Host "📈 Success Rate: $successRate%" -ForegroundColor White

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some tests failed. Check the output above for details." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host ""
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
}
