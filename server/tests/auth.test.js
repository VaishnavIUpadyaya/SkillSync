const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { setupTestDb, teardownTestDb, clearTestDb } = require('./setup');
const User = require('../models/user');

let mongoServer;

before(async () => {
  mongoServer = await setupTestDb();
});

after(async () => {
  await teardownTestDb(mongoServer);
});

beforeEach(async () => {
  await clearTestDb();
});

test('POST /api/auth/register - fails when missing required fields', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: '', email: 'invalid', password: '123' });

  assert.equal(res.status, 400);
  assert.ok(res.body.msg);
});

test('POST /api/auth/register - successfully registers new user', async () => {
  const payload = {
    name: 'Alice Developer',
    email: 'alice@example.com',
    password: 'password123'
  };

  const res = await request(app)
    .post('/api/auth/register')
    .send(payload);

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, 'alice@example.com');
  assert.equal(res.body.user.name, 'Alice Developer');

  const userInDb = await User.findOne({ email: 'alice@example.com' });
  assert.ok(userInDb);
  assert.equal(userInDb.name, 'Alice Developer');
});

test('POST /api/auth/register - fails when email already registered', async () => {
  const payload = {
    name: 'Alice Developer',
    email: 'alice@example.com',
    password: 'password123'
  };

  await request(app).post('/api/auth/register').send(payload);
  const res = await request(app).post('/api/auth/register').send(payload);

  assert.equal(res.status, 400);
  assert.equal(res.body.msg, 'Email already registered');
});

test('POST /api/auth/login - fails with invalid credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });

  assert.equal(res.status, 400);
  assert.equal(res.body.msg, 'Invalid credentials');
});

test('POST /api/auth/login - succeeds with correct credentials', async () => {
  const payload = {
    name: 'Bob Builder',
    email: 'bob@example.com',
    password: 'securepassword123'
  };

  await request(app).post('/api/auth/register').send(payload);

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'bob@example.com', password: 'securepassword123' });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, 'bob@example.com');
});

test('POST /api/auth/google - fails when missing credential payload', async () => {
  const res = await request(app)
    .post('/api/auth/google')
    .send({});

  assert.equal(res.status, 400);
  assert.equal(res.body.msg, 'Google token is required');
});
