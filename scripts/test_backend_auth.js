const http = require('http');

const BASE = 'http://localhost:5000';

function doRequest(method, path, body = null, headers = {}){
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(path, BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0,
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', c => d += c);
      res.on('end', () => {
        let parsed = d;
        try { parsed = JSON.parse(d); } catch (e) {}
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', (e) => reject(e));
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const email = `test+${Date.now()}@example.com`;
    const password = 'Password123!';
    console.log('Registering user:', email);
    const reg = await doRequest('POST', '/api/register', { name: 'Temp Tester', email, password });
    console.log('Register response:', reg.status, reg.body);

    console.log('\nLogging in...');
    const login = await doRequest('POST', '/api/login', { email, password });
    console.log('Login response status:', login.status);
    console.log('Login body:', login.body);

    if (!login.body || !login.body.token) {
      console.error('No token returned from login; aborting.');
      process.exit(1);
    }

    const token = login.body.token;
    console.log('\nToken received (first 60 chars):', token.substring(0, 60) + '...');

    console.log('\nCalling GET /profile with token...');
    const profile = await doRequest('GET', '/profile', null, { Authorization: `Bearer ${token}` });
    console.log('/profile status:', profile.status);
    console.log('/profile body:', profile.body);

    console.log('\nCalling POST /location/update with token...');
    const loc = await doRequest('POST', '/location/update', { latitude: 12.3456, longitude: 78.9012 }, { Authorization: `Bearer ${token}` });
    console.log('/location/update status:', loc.status);
    console.log('/location/update body:', loc.body);

    console.log('\nDone. If both protected endpoints returned 200, auth middleware and token issuance are working.');
  } catch (e) {
    console.error('ERROR in test script:', e.message || e);
    process.exit(1);
  }
})();
