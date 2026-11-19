const test = require('node:test');
const assert = require('node:assert/strict');

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function readPath(value, path) {
  return path.split('.').reduce((current, key) => current?.[key], value);
}

function writePath(value, path, nextValue) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    current[key] ??= {};
    return current[key];
  }, value);
  target[lastKey] = nextValue;
}

class FakeDocumentReference {
  constructor(collection, id) {
    this.collection = collection;
    this.id = id;
  }

  async get() {
    const data = this.collection.records.get(this.id);
    return {
      id: this.id,
      exists: data !== undefined,
      data: () => clone(data)
    };
  }

  async set(data, options = {}) {
    const current = this.collection.records.get(this.id);
    this.collection.records.set(
      this.id,
      options.merge && current ? { ...clone(current), ...clone(data) } : clone(data)
    );
  }

  async update(data) {
    const current = this.collection.records.get(this.id);
    if (current === undefined) throw new Error('Document not found');

    const updated = clone(current);
    for (const [path, value] of Object.entries(data)) writePath(updated, path, clone(value));
    this.collection.records.set(this.id, updated);
  }

  async delete() {
    this.collection.records.delete(this.id);
  }
}

class FakeQuery {
  constructor(collection, filters = [], ordering = null, maxResults = null) {
    this.collection = collection;
    this.filters = filters;
    this.ordering = ordering;
    this.maxResults = maxResults;
  }

  where(field, operator, value) {
    return new FakeQuery(this.collection, [...this.filters, { field, operator, value }], this.ordering, this.maxResults);
  }

  orderBy(field, direction = 'asc') {
    return new FakeQuery(this.collection, this.filters, { field, direction }, this.maxResults);
  }

  limit(maxResults) {
    return new FakeQuery(this.collection, this.filters, this.ordering, maxResults);
  }

  async get() {
    let entries = [...this.collection.records.entries()];

    entries = entries.filter(([, data]) => this.filters.every(({ field, operator, value }) => {
      const actual = readPath(data, field);
      if (operator === '==') return actual === value;
      throw new Error(`Unsupported fake query operator: ${operator}`);
    }));

    if (this.ordering) {
      const { field, direction } = this.ordering;
      entries.sort(([, a], [, b]) => {
        const left = readPath(a, field) ?? '';
        const right = readPath(b, field) ?? '';
        const result = left < right ? -1 : left > right ? 1 : 0;
        return direction === 'desc' ? -result : result;
      });
    }

    if (this.maxResults !== null) entries = entries.slice(0, this.maxResults);

    const docs = entries.map(([id, data]) => ({
      id,
      exists: true,
      data: () => clone(data)
    }));

    return { docs, empty: docs.length === 0, size: docs.length };
  }
}

class FakeCollection extends FakeQuery {
  constructor(name) {
    super(null);
    this.name = name;
    this.records = new Map();
    this.collection = this;
    this.nextId = 1;
  }

  doc(id) {
    return new FakeDocumentReference(this, id);
  }

  async add(data) {
    const id = `${this.name}-${this.nextId++}`;
    await this.doc(id).set(data);
    return this.doc(id);
  }
}

class FakeFirestore {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new FakeCollection(name));
    return this.collections.get(name);
  }
}

const fakeDb = new FakeFirestore();
const dbModulePath = require.resolve('../db');
require.cache[dbModulePath] = {
  id: dbModulePath,
  filename: dbModulePath,
  loaded: true,
  exports: fakeDb
};

const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { hashPassword } = require('../utils/jwtUtils');

function seedProduct(id, overrides = {}) {
  fakeDb.collection('products').records.set(id, {
    name: 'Test Keyboard',
    description: 'A product used in model tests.',
    price: { value: 100, currency: 'EUR' },
    stock: { quantity: 10, reserved: 2 },
    flags: { active: true },
    images: [{ url: 'fallback.png', isPrimary: false }, { url: 'primary.png', isPrimary: true }],
    metadata: { createdAt: '2026-01-01T00:00:00.000Z' },
    ...overrides
  });
}

test('Cart model adds items, calculates totals, updates, removes, and clears carts', async () => {
  seedProduct('product-1');

  const added = await Cart.addItemToCart('user-1', 'product-1', 2);
  assert.equal(added.totals.subtotal, 200);
  assert.equal(added.totals.itemCount, 2);
  assert.equal(added.items[0].image, 'primary.png');

  const updated = await Cart.updateCartItem('user-1', 'product-1', 3);
  assert.equal(updated.totals.total, 300);

  const removed = await Cart.removeItemFromCart('user-1', 'product-1');
  assert.deepEqual(removed.items, []);

  const cleared = await Cart.clearCart('user-1');
  assert.equal(cleared.totals.itemCount, 0);
});

test('Cart model rejects missing products and quantities above available stock', async () => {
  await assert.rejects(() => Cart.addItemToCart('user-2', 'missing', 1), { message: 'Product not found' });

  seedProduct('low-stock', { stock: { quantity: 2, reserved: 1 } });
  await assert.rejects(
    () => Cart.addItemToCart('user-2', 'low-stock', 2),
    { message: 'Only 1 items available in stock' }
  );
});

test('Product model supports filtering, pagination, CRUD, and stock updates', async () => {
  seedProduct('cheap', { name: 'Cheap Mouse', price: { value: 20 }, metadata: { createdAt: '2026-02-01' } });
  seedProduct('expensive', { name: 'Expensive Monitor', price: { value: 300 }, metadata: { createdAt: '2026-03-01' } });

  const result = await Product.getAllProductsFromDb(0, 1, {
    minPrice: 10,
    maxPrice: 50,
    search: 'mouse',
    sortBy: 'price',
    sortOrder: 'asc'
  });
  assert.equal(result.totalProducts, 1);
  assert.equal(result.products[0].id, 'cheap');

  const created = await Product.createProductInDb({ name: 'New Product' });
  assert.equal((await Product.getProductByIdFromDb(created.id)).name, 'New Product');

  await Product.updateProductInDb(created.id, { description: 'Updated' });
  assert.equal((await Product.getProductByIdFromDb(created.id)).description, 'Updated');

  const stock = await Product.updateProductStockInDb('cheap', -5, 3);
  assert.deepEqual(stock.stock, { quantity: 5, reserved: 5 });

  await Product.deleteProductInDb(created.id);
  assert.equal(await Product.getProductByIdFromDb(created.id), null);
});

test('Order model creates, queries, updates, and reserves/finalizes stock', async () => {
  seedProduct('order-product', { stock: { quantity: 10, reserved: 1 } });
  const created = await Order.createOrderInDb({
    userId: 'user-3',
    status: 'pending',
    metadata: { createdAt: '2026-04-01T00:00:00.000Z' }
  });

  assert.equal((await Order.getOrderByIdFromDb(created.id)).userId, 'user-3');
  assert.equal((await Order.getOrdersByUserIdFromDb('user-3')).length, 1);

  const updated = await Order.updateOrderStatusInDb(created.id, 'confirmed', 'admin-1', 'completed');
  assert.equal(updated.status, 'confirmed');
  assert.equal(updated.metadata.updatedBy, 'admin-1');
  assert.equal(updated.payment.status, 'completed');

  const products = await Order.validateAndReserveStock([{ productId: 'order-product', quantity: 3 }]);
  assert.equal(products[0].id, 'order-product');
  assert.equal((await Product.getProductByIdFromDb('order-product')).stock.reserved, 4);

  await Order.finalizeStockForOrder([{ productId: 'order-product', quantity: 3 }]);
  assert.deepEqual((await Product.getProductByIdFromDb('order-product')).stock, { quantity: 7, reserved: 1 });
});

test('Order model reports missing and insufficient stock', async () => {
  seedProduct('inactive', { flags: { active: false } });

  await assert.rejects(
    () => Order.validateAndReserveStock([
      { productId: 'missing-order-product', quantity: 1 },
      { productId: 'inactive', quantity: 1 }
    ]),
    (error) => error.name === 'StockValidationError' && error.errors.length === 2
  );
});

test('User model finds users, updates login metadata, counts customers, and verifies passwords', async () => {
  const password = await hashPassword('StrongPass1!');
  const userRef = await User.addNewUser({
    email: 'user@example.com',
    username: 'test_user',
    password,
    admin: false,
    metadata: {}
  });
  await User.addNewUser({ email: 'admin@example.com', username: 'admin', admin: true, metadata: {} });

  assert.equal((await User.findUserByEmail('user@example.com')).id, userRef.id);
  assert.equal((await User.findUserByUsername('test_user')).email, 'user@example.com');
  assert.equal(await User.findUserById(userRef.id).then((user) => user.username), 'test_user');
  assert.equal(await User.findUserByEmail('missing@example.com'), null);
  assert.equal(await User.getUsersCountFromDb(), 1);
  assert.equal(await User.verifyPassword('StrongPass1!', password), true);
  assert.equal(await User.verifyPassword('WrongPass1!', password), false);

  const lastLogin = await User.updateLastLogin(userRef.id);
  assert.match(lastLogin, /^20\d\d-/);
  assert.equal((await User.findUserById(userRef.id)).metadata.lastLogin, lastLogin);
});
