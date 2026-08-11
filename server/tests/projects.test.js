const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { setupTestDb, teardownTestDb, clearTestDb } = require('./setup');
const Project = require('../models/project');

let mongoServer;
let userToken;
let user2Token;
let userId;
let user2Id;

before(async () => {
  mongoServer = await setupTestDb();
});

after(async () => {
  await teardownTestDb(mongoServer);
});

beforeEach(async () => {
  await clearTestDb();

  // Create User 1
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Owner User', email: 'owner@example.com', password: 'password123' });
  userToken = res1.body.token;
  userId = res1.body.user._id;

  // Create User 2
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Member User', email: 'member@example.com', password: 'password123' });
  user2Token = res2.body.token;
  user2Id = res2.body.user._id;
});

test('POST /api/projects - fails when unauthenticated', async () => {
  const res = await request(app)
    .post('/api/projects')
    .send({ title: 'Awesome App', description: 'Building something great' });

  assert.equal(res.status, 401);
});

test('POST /api/projects - fails with invalid body payload', async () => {
  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ title: '', description: '' });

  assert.equal(res.status, 400);
});

test('POST /api/projects - creates project successfully', async () => {
  const payload = {
    title: 'AI Code Assistant',
    description: 'An AI-powered pair programmer for developers',
    teamSize: 4,
    requiredSkills: [{ name: 'JavaScript', proficiency: 4 }]
  };

  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${userToken}`)
    .send(payload);

  assert.equal(res.status, 200);
  assert.equal(res.body.title, 'AI Code Assistant');
  assert.equal(res.body.owner, userId);
  assert.ok(res.body._id);
});

test('GET /api/projects - retrieves project list', async () => {
  await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ title: 'Project 1', description: 'Desc 1' });

  const res = await request(app)
    .get('/api/projects')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].title, 'Project 1');
});

test('GET /api/projects/:id - returns project details or 404', async () => {
  const createRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ title: 'Project Detail Test', description: 'Detailed desc' });

  const projectId = createRes.body._id;

  const res = await request(app)
    .get(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.title, 'Project Detail Test');

  const fakeId = '507f1f77bcf86cd799439011';
  const notFoundRes = await request(app)
    .get(`/api/projects/${fakeId}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(notFoundRes.status, 404);
});

test('PUT /api/projects/:id - owner updates project, non-owner gets 403', async () => {
  const createRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ title: 'Original Title', description: 'Original description' });

  const projectId = createRes.body._id;

  // Non-owner update attempt
  const forbiddenRes = await request(app)
    .put(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${user2Token}`)
    .send({ title: 'Hacked Title' });

  assert.equal(forbiddenRes.status, 403);

  // Owner update
  const updatedRes = await request(app)
    .put(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ title: 'Updated Title' });

  assert.equal(updatedRes.status, 200);
  assert.equal(updatedRes.body.title, 'Updated Title');
});

test('DELETE /api/projects/:id - owner deletes project, non-owner gets 403', async () => {
  const createRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ title: 'To Be Deleted', description: 'Will be deleted' });

  const projectId = createRes.body._id;

  // Non-owner delete attempt
  const forbiddenRes = await request(app)
    .delete(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${user2Token}`);

  assert.equal(forbiddenRes.status, 403);

  // Owner delete
  const deleteRes = await request(app)
    .delete(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(deleteRes.status, 200);

  const checkRes = await request(app)
    .get(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(checkRes.status, 404);
});
