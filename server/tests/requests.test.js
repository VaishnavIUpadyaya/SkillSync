const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { setupTestDb, teardownTestDb, clearTestDb } = require('./setup');
const Project = require('../models/project');

let mongoServer;
let ownerToken;
let ownerId;
let applicantToken;
let applicantId;
let projectId;

before(async () => {
  mongoServer = await setupTestDb();
});

after(async () => {
  await teardownTestDb(mongoServer);
});

beforeEach(async () => {
  await clearTestDb();

  // Create Owner
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Project Owner', email: 'owner@example.com', password: 'password123' });
  ownerToken = res1.body.token;
  ownerId = res1.body.user._id;

  // Create Applicant
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Applicant Dev', email: 'applicant@example.com', password: 'password123' });
  applicantToken = res2.body.token;
  applicantId = res2.body.user._id;

  // Create Project owned by Owner
  const projRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ title: 'Join Request Test Project', description: 'Testing join requests' });

  projectId = projRes.body._id;
});

test('POST /api/requests - creates join request successfully', async () => {
  const res = await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({ projectId });

  assert.equal(res.status, 200);
  assert.equal(res.body.project, projectId);
  assert.equal(res.body.sender, applicantId);
  assert.equal(res.body.status, 'pending');
});

test('POST /api/requests - prevents duplicate pending join requests', async () => {
  await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({ projectId });

  const res = await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({ projectId });

  assert.equal(res.status, 400);
  assert.equal(res.body.msg, 'Request already sent');
});

test('GET /api/requests/status/:projectId - returns correct request status', async () => {
  // Before request sent
  const initialRes = await request(app)
    .get(`/api/requests/status/${projectId}`)
    .set('Authorization', `Bearer ${applicantToken}`);

  assert.equal(initialRes.status, 200);
  assert.equal(initialRes.body.status, 'none');

  // Send request
  await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({ projectId });

  // After request sent
  const pendingRes = await request(app)
    .get(`/api/requests/status/${projectId}`)
    .set('Authorization', `Bearer ${applicantToken}`);

  assert.equal(pendingRes.status, 200);
  assert.equal(pendingRes.body.status, 'pending');
});

test('GET /api/requests/mine - retrieves pending requests for project owner', async () => {
  await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({ projectId });

  const res = await request(app)
    .get('/api/requests/mine')
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].sender._id, applicantId);
});

test('PUT /api/requests/:id - owner accepts request and adds user to project members', async () => {
  const reqRes = await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({ projectId });

  const requestId = reqRes.body._id;

  const acceptRes = await request(app)
    .put(`/api/requests/${requestId}`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ status: 'accepted' });

  assert.equal(acceptRes.status, 200);
  assert.equal(acceptRes.body.status, 'accepted');

  const updatedProject = await Project.findById(projectId);
  const isMember = updatedProject.members.some(m => m.toString() === applicantId);
  assert.ok(isMember);
});

test('DELETE /api/requests/:id/withdraw - allows applicant to withdraw pending request', async () => {
  const reqRes = await request(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({ projectId });

  const requestId = reqRes.body._id;

  const withdrawRes = await request(app)
    .delete(`/api/requests/${requestId}/withdraw`)
    .set('Authorization', `Bearer ${applicantToken}`);

  assert.equal(withdrawRes.status, 200);
  assert.equal(withdrawRes.body.msg, 'Request withdrawn');

  const statusRes = await request(app)
    .get(`/api/requests/status/${projectId}`)
    .set('Authorization', `Bearer ${applicantToken}`);

  assert.equal(statusRes.body.status, 'none');
});
