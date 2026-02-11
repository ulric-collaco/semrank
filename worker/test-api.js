/**
 * Test script for Cloudflare D1 API endpoints
 * Usage: node test-api.js [worker-url]
 * Example: node test-api.js https://semrank-api.YOUR-SUBDOMAIN.workers.dev
 */

const API_BASE = process.argv[2] || 'http://localhost:8787';

async function testEndpoint(name, url) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Response:`, JSON.stringify(data).substring(0, 200) + '...');
      return { success: true, data };
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   Error:`, data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🎈 SemRank API Test Suite');
  console.log('=========================');
  console.log(`Base URL: ${API_BASE}`);
  
  const tests = [
    {
      name: 'API Documentation',
      url: `${API_BASE}/api`,
    },
    {
      name: 'Health Check',
      url: `${API_BASE}/api/health`,
    },
    {
      name: 'Get All Students',
      url: `${API_BASE}/api/students`,
    },
    {
      name: 'Get Student by Roll Number (10578)',
      url: `${API_BASE}/api/students/roll/10578`,
    },
    {
      name: 'Get Student by Enrollment ID',
      url: `${API_BASE}/api/students/enrollment/MU0341120240233041`,
    },
    {
      name: 'Search Students (query: "John")',
      url: `${API_BASE}/api/students/search?q=John`,
    },
    {
      name: 'Leaderboard - Top 10 by CGPA',
      url: `${API_BASE}/api/leaderboard/cgpa?limit=10&class=all`,
    },
    {
      name: 'Leaderboard - Top 5 COMPS_A by Attendance',
      url: `${API_BASE}/api/leaderboard/attendance?limit=5&class=COMPS_A`,
    },
    {
      name: 'Class Rankings',
      url: `${API_BASE}/api/leaderboard/classes`,
    },
    {
      name: 'Today\'s Birthdays',
      url: `${API_BASE}/api/birthdays/today`,
    },
    {
      name: 'Random Pair for Game',
      url: `${API_BASE}/api/game/random-pair`,
    },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url);
    results.push({ ...test, ...result });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n\n📊 Test Summary');
  console.log('===============');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}`);
    });
  }
  
  console.log('\n✨ Testing complete!');
  
  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
