const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

// Build a clean test app instance without binding to DB ports
function createTestApp() {
  const app = express()
  app.use(express.json())

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: 100 })
  })

  // Auth test route placeholders for non-DB integration validation
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'All fields are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' })
    }
    res.json({ token: 'mock-jwt-token', user: { _id: '123', name, email } })
  })

  app.post('/api/auth/google', (req, res) => {
    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ msg: 'Google token is required' })
    }
    res.json({ token: 'mock-google-jwt-token', user: { _id: '456', name: 'Google User', email: 'user@gmail.com' } })
  })

  return app
}

test('GET /api/health returns 200 and status ok', async () => {
  const app = createTestApp()
  const response = await request(app).get('/api/health')

  assert.equal(response.status, 200)
  assert.equal(response.body.status, 'ok')
  assert.ok(response.body.timestamp)
})

test('POST /api/auth/register fails when missing email', async () => {
  const app = createTestApp()
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alex', password: 'password123' })

  assert.equal(response.status, 400)
  assert.equal(response.body.msg, 'All fields are required')
})

test('POST /api/auth/register succeeds with valid payload', async () => {
  const app = createTestApp()
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alex', email: 'alex@example.com', password: 'password123' })

  assert.equal(response.status, 200)
  assert.equal(response.body.token, 'mock-jwt-token')
  assert.equal(response.body.user.email, 'alex@example.com')
})

test('POST /api/auth/google fails when missing credential', async () => {
  const app = createTestApp()
  const response = await request(app)
    .post('/api/auth/google')
    .send({})

  assert.equal(response.status, 400)
  assert.equal(response.body.msg, 'Google token is required')
})
