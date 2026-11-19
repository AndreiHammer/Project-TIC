const test = require('node:test');
const assert = require('node:assert/strict');
const { validationResult } = require('express-validator');

const { authValidation, registerValidation } = require('../validators/authValidator');
const { productValidation } = require('../validators/productValidator');
const { createOrderValidation } = require('../validators/orderValidator');

async function validate(rules, body) {
  const req = { body };

  for (const rule of rules) {
    await new Promise((resolve, reject) => {
      rule(req, {}, (error) => (error ? reject(error) : resolve()));
    });
  }

  return validationResult(req).array();
}

test('accepts a valid registration payload and normalizes the email', async () => {
  const body = {
    email: '  USER@Example.COM ',
    password: 'StrongPass1!',
    confirmPassword: 'StrongPass1!',
    username: 'valid_user'
  };

  const errors = await validate(registerValidation, body);

  assert.deepEqual(errors, []);
  assert.equal(body.email, 'user@example.com');
});

test('rejects weak passwords with field-specific validation errors', async () => {
  const errors = await validate(authValidation, {
    email: 'not-an-email',
    password: 'weak'
  });

  assert.ok(errors.some((error) => error.path === 'email'));
  assert.ok(errors.some((error) => error.path === 'password'));
});

test('rejects a product with invalid price and negative stock', async () => {
  const errors = await validate(productValidation, {
    name: 'Keyboard',
    description: 'A mechanical keyboard for testing.',
    price: { value: 0 },
    stock: { quantity: -1 }
  });

  assert.deepEqual(
    errors.map((error) => error.path).sort(),
    ['price.value', 'stock.quantity']
  );
});

test('rejects orders with invalid item, shipping, and payment data', async () => {
  const errors = await validate(createOrderValidation, {
    items: [],
    shipping: { name: 'A', address: 'x', city: 'B', postalCode: '1', country: 'C' },
    payment: { method: 'bitcoin' }
  });

  const paths = errors.map((error) => error.path);
  assert.ok(paths.includes('items'));
  assert.ok(paths.includes('shipping.name'));
  assert.ok(paths.includes('shipping.address'));
  assert.ok(paths.includes('payment.method'));
});
