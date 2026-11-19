const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../app');

test('protected cart routes reject requests without a token', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/cart`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(body, { message: 'No Token' });
});
