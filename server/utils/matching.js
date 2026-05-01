const mongoose = require('mongoose')
const User = mongoose.model('User')
const Project = mongoose.model('Project')

function normalizeSkill(name) {
  return name.toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .trim()
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0)
  const magA = Math.sqrt(vecA.reduce((s, a) => s + a * a, 0))
  const magB = Math.sqrt(vecB.reduce((s, b) => s + b * b, 0))
  if (magA === 0 || magB === 0) return 0
  return dot / (magA * magB)
}

function buildSkillVector(skills, allSkillNames) {
  return allSkillNames.map(name => {
    const found = skills.find(s => normalizeSkill(s.name) === name)
    if (!found) return 0
    // verified skills get 20% boost, capped at 5
    const boost = found.verified ? 1.2 : 1
    return Math.min(found.proficiency * boost, 5)
  })
}

async function matchUsersToProject(projectId) {
  const project = await Project.findById(projectId)
  if (!project) return []

  const allUsers = await User.find({ available: true })

  const allSkillNames = [...new Set([
    ...project.requiredSkills.map(s => normalizeSkill(s.name)),
    ...allUsers.flatMap(u => u.skills.map(s => normalizeSkill(s.name)))
  ])]

  const projectVec = buildSkillVector(project.requiredSkills, allSkillNames)

  const excludeIds = new Set([
    project.owner.toString(),
    ...project.members.map(m => m.toString())
  ])

  return allUsers
    .filter(u => !excludeIds.has(u._id.toString()))
    .map(user => ({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        role: user.role,
        rating: user.rating
      },
      score: parseFloat(cosineSimilarity(
        buildSkillVector(user.skills, allSkillNames), projectVec
      ).toFixed(2))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

module.exports = { matchUsersToProject }