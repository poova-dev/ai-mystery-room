import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('Milestone 2: HTTP Middleware & Health Check', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Start temporary test server on an ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  test('GET /api/health returns HTTP 200 with {"status":"ok"}', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { status: 'ok' });
  });

  test('Security headers from Helmet are present on response', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.ok(res.headers.get('x-content-type-options'));
  });

  test('Rate limit headers are present on /api routes', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.ok(res.headers.get('ratelimit-limit'));
  });

  test('GET /api/unknown-endpoint returns HTTP 404 with SPEC-compliant error JSON', async () => {
    const res = await fetch(`${baseUrl}/api/unknown-endpoint`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.ok(body.error);
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.ok(body.error.message.includes('unknown-endpoint'));
  });
});
