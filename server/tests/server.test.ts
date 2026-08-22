import app from '../../server';
import http from 'http';

async function runTests() {
  console.log('--- Running Node / Express Backend Tests ---');

  const server = http.createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Could not determine test server address');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);

    if (!healthRes.ok) {
      throw new Error(`GET /api/health failed: ${healthRes.status}`);
    }

    const healthData = await healthRes.json();

    if (healthData.status !== 'ok') {
      throw new Error('Health endpoint returned an invalid status');
    }

    console.log('✔ GET /api/health: PASSED');

    // 2. Incidents list
    const incidentsRes = await fetch(`${baseUrl}/api/incidents`);

    if (!incidentsRes.ok) {
      throw new Error(
        `GET /api/incidents failed: ${incidentsRes.status}`
      );
    }

    const incidentsData = await incidentsRes.json();

    if (!Array.isArray(incidentsData)) {
      throw new Error('GET /api/incidents did not return an array');
    }

    console.log('✔ GET /api/incidents: PASSED');

    // 3. Create incident
    const createRes = await fetch(`${baseUrl}/api/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Node Integration Test Incident',
        category: 'Scam',
        summary: 'Testing incident creation API',
        risk_level: 'HIGH',
        threat_type: 'Scam',
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(
        `POST /api/incidents failed: ${createRes.status} ${errorText}`
      );
    }

    const createData = await createRes.json();

    if (!createData.incident_id) {
      throw new Error('Incident was created but no incident_id was returned');
    }

    console.log('✔ POST /api/incidents: PASSED');

    const incidentId = createData.incident_id;

    // 4. Add Evidence
    const evRes = await fetch(
      `${baseUrl}/api/incidents/${incidentId}/evidence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
          title: 'Test Evidence Record',
          content: 'Suspicious sms text',
        }),
      }
    );

    if (!evRes.ok) {
      const errorText = await evRes.text();
      throw new Error(
        `POST evidence failed: ${evRes.status} ${errorText}`
      );
    }

    const evData = await evRes.json();

    if (!evData.sha256_hash) {
      throw new Error('Evidence response does not contain sha256_hash');
    }

    console.log(
      '✔ POST /api/incidents/:id/evidence (SHA256): PASSED'
    );

    // 5. Analytics Summary
    const analyticsRes = await fetch(
      `${baseUrl}/api/analytics/summary`
    );

    if (!analyticsRes.ok) {
      throw new Error(
        `GET /api/analytics/summary failed: ${analyticsRes.status}`
      );
    }

    const analyticsData = await analyticsRes.json();

    if (typeof analyticsData.total_incidents !== 'number') {
      throw new Error(
        'Analytics response does not contain numeric total_incidents'
      );
    }

    console.log(
      '✔ GET /api/analytics/summary: PASSED'
    );

    console.log('');
    console.log('--- ALL NODE EXPRESS TESTS PASSED ---');
  } catch (err) {
    console.error('');
    console.error('❌ TEST FAILED');
    console.error(err);

    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();