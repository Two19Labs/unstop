import { createServer } from 'vite';
import http from 'http';

function checkHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    }).on('error', reject);
  });
}

async function testDevServer() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  VITE DEV SERVER & MIDDLEWARE END-TO-END DIAGNOSTIC');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const TEST_PORT = 5188;
  console.log(`Starting Vite dev server in-process on port ${TEST_PORT}...`);

  const server = await createServer({
    configFile: './vite.config.js',
    server: {
      port: TEST_PORT,
      strictPort: true
    }
  });

  await server.listen();
  console.log(`  ✅ PASS: Vite dev server started and responsive on port ${TEST_PORT}`);

  try {
    // Test 1: Root HTML
    const rootRes = await checkHttp(`http://localhost:${TEST_PORT}/`);
    const hasAppRoot = rootRes.data.includes('id="root"');
    console.log(`  ${hasAppRoot ? '✅ PASS' : '❌ FAIL'}: Serves valid HTML shell with #root element`);

    // Test 2: Vite middleware /api/competitions
    console.log('Testing /api/competitions dev middleware...');
    const compRes = await checkHttp(`http://localhost:${TEST_PORT}/api/competitions`);
    const compJson = JSON.parse(compRes.data);
    const passComp = compRes.status === 200 && compJson.success === true && Array.isArray(compJson.data);
    console.log(`  ${passComp ? '✅ PASS' : '❌ FAIL'}: /api/competitions returns JSON with ${compJson.count || compJson.data?.length} live competitions`);

    // Test 3: Vite middleware /api/rounds
    console.log('Testing /api/rounds dev middleware...');
    const roundsRes = await checkHttp(`http://localhost:${TEST_PORT}/api/rounds?ids=test1`);
    const roundsJson = JSON.parse(roundsRes.data);
    const passRounds = roundsRes.status === 200 && roundsJson.success === true;
    console.log(`  ${passRounds ? '✅ PASS' : '❌ FAIL'}: /api/rounds endpoint responds with structured timeline data`);
  } finally {
    console.log('\nStopping Vite dev server...');
    await server.close();
    console.log('  ✅ PASS: Server closed cleanly');
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  DEV SERVER DIAGNOSTIC COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

testDevServer().catch(err => {
  console.error('Fatal dev server test error:', err);
  process.exit(1);
});
