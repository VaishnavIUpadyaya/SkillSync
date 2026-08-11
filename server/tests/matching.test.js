const mongoose = require('mongoose')
const test = require('node:test')
const assert = require('node:assert/strict')

// Ensure dummy mongoose models exist so requiring matching.js doesn't throw
if (!mongoose.models.User) mongoose.model('User', new mongoose.Schema({}, { strict: false }))
if (!mongoose.models.Project) mongoose.model('Project', new mongoose.Schema({}, { strict: false }))

const { getPerSkillCoverage, getTeamCoverage, calculateSkillMatchScore } = require('../utils/matching')

test('calculateSkillMatchScore returns 1.0 for identical single-skill vectors', () => {
  const userSkills = [{ name: 'JS', proficiency: 4 }]
  const projectSkills = [{ name: 'JS', proficiency: 3 }]
  const score = calculateSkillMatchScore(userSkills, projectSkills)
  assert.equal(score, 1)
})

test('getPerSkillCoverage identifies covered and missing skills', () => {
  const project = {
    requiredSkills: [ { name: 'JS', proficiency: 3 }, { name: 'Python', proficiency: 4 } ],
    members: [ { name: 'Alice', skills: [ { name: 'JS', proficiency: 4 } ] } ]
  }

  const details = getPerSkillCoverage(project)
  assert.equal(details.length, 2)

  const js = details.find(d => d.name === 'JS')
  const py = details.find(d => d.name === 'Python')

  assert.equal(js.status, 'covered')
  assert.equal(js.covered, 4)
  assert.equal(js.pct, 100)

  assert.equal(py.status, 'missing')
  assert.equal(py.covered, 0)
  assert.equal(py.pct, 0)
})

test('getTeamCoverage computes expected cosine similarity', () => {
  const project = {
    requiredSkills: [ { name: 'JS', proficiency: 3 }, { name: 'Python', proficiency: 4 } ],
    members: [ { name: 'Alice', skills: [ { name: 'JS', proficiency: 4 } ] } ]
  }

  const cov = getTeamCoverage(project)
  // Expect cosine similarity = (4*3 + 0*4) / (sqrt(4^2) * sqrt(3^2+4^2)) = 12 / (4 * 5) = 0.6
  assert.equal(Number(cov.toFixed(2)), 0.6)
})
