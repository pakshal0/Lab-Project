const http = require('http');

const BASE_URL = 'http://localhost:5001';

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const payload = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        
        // Extract Set-Cookie header if present
        const setCookieHeader = res.headers['set-cookie'];
        let rawCookie = '';
        if (setCookieHeader && setCookieHeader.length > 0) {
          rawCookie = setCookieHeader[0].split(';')[0];
        }

        resolve({
          statusCode: res.statusCode,
          body: parsed,
          cookie: rawCookie
        });
      });
    });

    req.on('error', err => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=============== STARTING E2E API VERIFICATION TESTS ===============\n');
  const testEmail = `testuser_${Date.now()}@gmail.com`;
  let authCookie = '';

  try {
    // Test 1: Health check
    console.log('TEST 1: Health Check GET /');
    const health = await makeRequest('/');
    console.log(`Status: ${health.statusCode} | Response: ${JSON.stringify(health.body)}`);
    console.log(health.statusCode === 200 ? '✅ PASS' : '❌ FAIL', '\n');

    // Test 2: Missing fields registration -> 400
    console.log('TEST 2: Register with missing field (fullName omitted)');
    const regMissing = await makeRequest('/customers/register', 'POST', {
      email: testEmail,
      password: "password123",
      phone: "9876543210"
    });
    console.log(`Status: ${regMissing.statusCode} | Response: ${JSON.stringify(regMissing.body)}`);
    console.log(regMissing.statusCode === 400 ? '✅ PASS (400 Bad Request)' : '❌ FAIL', '\n');

    // Test 3: Short password registration -> 400
    console.log('TEST 3: Register with short password (<6 chars)');
    const regShort = await makeRequest('/customers/register', 'POST', {
      fullName: "Test User",
      email: testEmail,
      password: "123",
      phone: "9876543210"
    });
    console.log(`Status: ${regShort.statusCode} | Response: ${JSON.stringify(regShort.body)}`);
    console.log(regShort.statusCode === 400 ? '✅ PASS (400 Bad Request)' : '❌ FAIL', '\n');

    // Test 4: Successful Registration -> 201
    console.log('TEST 4: Register Customer (Valid Payload)');
    const regSuccess = await makeRequest('/customers/register', 'POST', {
      fullName: "John Doe",
      email: testEmail,
      password: "johnpassword123",
      phone: "9876543210"
    });
    console.log(`Status: ${regSuccess.statusCode} | Response: ${JSON.stringify(regSuccess.body)}`);
    console.log(regSuccess.statusCode === 201 && regSuccess.body.customer && !regSuccess.body.customer.password ? '✅ PASS (201 Created, password excluded)' : '❌ FAIL', '\n');

    // Test 5: Duplicate Email Registration -> 409
    console.log('TEST 5: Register Duplicate Email');
    const regDup = await makeRequest('/customers/register', 'POST', {
      fullName: "John Dup",
      email: testEmail,
      password: "johnpassword123",
      phone: "9876543210"
    });
    console.log(`Status: ${regDup.statusCode} | Response: ${JSON.stringify(regDup.body)}`);
    console.log(regDup.statusCode === 409 ? '✅ PASS (409 Conflict)' : '❌ FAIL', '\n');

    // Test 6: Invalid Login -> 401
    console.log('TEST 6: Login with Wrong Password');
    const loginWrong = await makeRequest('/customers/login', 'POST', {
      email: testEmail,
      password: "wrongpassword"
    });
    console.log(`Status: ${loginWrong.statusCode} | Response: ${JSON.stringify(loginWrong.body)}`);
    console.log(loginWrong.statusCode === 401 ? '✅ PASS (401 Unauthorized Generic Error)' : '❌ FAIL', '\n');

    // Test 7: Successful Login -> 200 & Cookie
    console.log('TEST 7: Login with Valid Credentials');
    const loginSuccess = await makeRequest('/customers/login', 'POST', {
      email: testEmail,
      password: "johnpassword123"
    });
    authCookie = loginSuccess.cookie;
    console.log(`Status: ${loginSuccess.statusCode} | Cookie Received: ${authCookie}`);
    console.log(loginSuccess.statusCode === 200 && authCookie.startsWith('token=') ? '✅ PASS (200 OK & HttpOnly Cookie Set)' : '❌ FAIL', '\n');

    // Test 8: Get Profile without Cookie -> 401
    console.log('TEST 8: GET /customers/me without Cookie');
    const meNoAuth = await makeRequest('/customers/me', 'GET');
    console.log(`Status: ${meNoAuth.statusCode} | Response: ${JSON.stringify(meNoAuth.body)}`);
    console.log(meNoAuth.statusCode === 401 ? '✅ PASS (401 Unauthorized)' : '❌ FAIL', '\n');

    // Test 9: Get Profile with Cookie -> 200
    console.log('TEST 9: GET /customers/me with Valid Cookie');
    const meAuth = await makeRequest('/customers/me', 'GET', null, authCookie);
    console.log(`Status: ${meAuth.statusCode} | Profile: ${JSON.stringify(meAuth.body)}`);
    console.log(meAuth.statusCode === 200 && meAuth.body.email === testEmail ? '✅ PASS (200 OK & Profile Data)' : '❌ FAIL', '\n');

    // Test 10: Logout -> 200
    console.log('TEST 10: POST /customers/logout');
    const logout = await makeRequest('/customers/logout', 'POST', null, authCookie);
    console.log(`Status: ${logout.statusCode} | Response: ${JSON.stringify(logout.body)}`);
    console.log(logout.statusCode === 200 ? '✅ PASS (Logged out & Cookie Cleared)' : '❌ FAIL', '\n');

    console.log('=============== ALL E2E API VERIFICATION TESTS COMPLETED ===============');
  } catch (error) {
    console.error('Test Execution Error:', error.message);
  }
}

runTests();
