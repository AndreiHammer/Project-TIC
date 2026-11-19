const test = require('node:test');
const assert = require('node:assert/strict');

const {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
} = require('../utils/jwtUtils');

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    }
  };
}

test('hashes passwords and compares only the original password', async () => {
  const hash = await hashPassword('StrongPass1!');

  assert.notEqual(hash, 'StrongPass1!');
  assert.equal(await comparePassword('StrongPass1!', hash), true);
  assert.equal(await comparePassword('WrongPass1!', hash), false);
});

test('verifyToken attaches the decoded user to the request', () => {
  const token = generateToken({ id: 'user-1', username: 'alice', email: 'alice@example.com' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = responseRecorder();
  let nextCalled = false;

  verifyToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'user-1');
  assert.equal(req.user.email, 'alice@example.com');
});

test('verifyToken rejects missing and invalid tokens', () => {
  const missingResponse = responseRecorder();
  verifyToken({ headers: {} }, missingResponse, () => {});
  assert.equal(missingResponse.statusCode, 401);
  assert.deepEqual(missingResponse.body, { message: 'No Token' });

  const invalidResponse = responseRecorder();
  verifyToken({ headers: { authorization: 'Bearer invalid-token' } }, invalidResponse, () => {});
  assert.equal(invalidResponse.statusCode, 401);
  assert.deepEqual(invalidResponse.body, { message: 'Invalid Token' });
});
