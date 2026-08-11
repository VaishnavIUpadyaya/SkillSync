const mongoose = require('mongoose')
const User = mongoose.model('User')
const Project = mongoose.model('Project')

function normalizeSkill(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .trim()
}

function getTeamCoverage(project = {}) {
  const projectSkills = project.requiredSkills || []
  const members = Array.isArray(project.members) ? project.members : []

  const allSkillNames = [...new Set([
    ...projectSkills.map(s => normalizeSkill(s.name)),
    ...members.flatMap(m => (m.skills || []).map(s => normalizeSkill(s.name)))
  ])]

  const projectVec = buildSkillVector(projectSkills, allSkillNames)

  const teamVec = allSkillNames.map(name => {
    let best = 0
    members.forEach(m => {
      const found = (m.skills || []).find(s => normalizeSkill(s.name) === name)
      if (found) {
        const boost = found.verified ? 1.2 : 1
        best = Math.max(best, Math.min(found.proficiency * boost, 5))
      }
    })
    return best
  })

  return parseFloat(cosineSimilarity(teamVec, projectVec).toFixed(2))
}

function getPerSkillCoverage(project = {}) {
  const projectSkills = project.requiredSkills || []
  const members = Array.isArray(project.members) ? project.members : []

  return (projectSkills || []).map(req => {
    const required = req.proficiency || 1
    let best = 0
    members.forEach(m => {
      const found = (m.skills || []).find(s => normalizeSkill(s.name) === normalizeSkill(req.name))
      if (found) {
        const boost = found.verified ? 1.2 : 1
        best = Math.max(best, Math.min(found.proficiency * boost, 5))
      }
    })

    const pct = required > 0 ? Math.round(Math.min((best / required) * 100, 100)) : 0
    const status = best === 0 ? 'missing' : (best < required ? 'partial' : 'covered')

    return {
      name: req.name,
      required,
      covered: best,
      pct,
      status
    }
  })
}
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0)
  const magA = Math.sqrt(vecA.reduce((s, a) => s + a * a, 0))
  const magB = Math.sqrt(vecB.reduce((s, b) => s + b * b, 0))
  if (magA === 0 || magB === 0) return 0
  return dot / (magA * magB)
}

function buildSkillVector(skills = [], allSkillNames = []) {
  return allSkillNames.map(name => {
    const found = (skills || []).find(s => normalizeSkill(s.name) === name)
    if (!found) return 0
    const boost = found.verified ? 1.2 : 1
    return Math.min(found.proficiency * boost, 5)
  })
}

function calculateSkillMatchScore(userSkills = [], projectSkills = []) {
  const allSkillNames = [...new Set([
    ...projectSkills.map(s => normalizeSkill(s.name)),
    ...userSkills.map(s => normalizeSkill(s.name))
  ])]

  const userVec = buildSkillVector(userSkills, allSkillNames)
  const projectVec = buildSkillVector(projectSkills, allSkillNames)

  return parseFloat(cosineSimilarity(userVec, projectVec).toFixed(2))
}

function getMatchingSkillNames(userSkills = [], projectSkills = []) {
  const normalizedUserSkills = new Set((userSkills || []).map(s => normalizeSkill(s.name)))
  return (projectSkills || [])
    .filter(skill => normalizedUserSkills.has(normalizeSkill(skill.name)))
    .map(skill => skill.name)
}

function getProjectRecommendations(user, projects = [], options = {}) {
  const threshold = options.threshold ?? 0.6
  const limit = options.limit ?? 3

  if (!user || !Array.isArray(projects)) return []

  const userId = user._id?.toString?.() || user.id?.toString?.()
  const userSkills = Array.isArray(user.skills) ? user.skills : []

  return projects
    .map(project => project && project.toObject ? project.toObject() : project)
    .filter(project => {
      if (!project || project.status !== 'open') return false
      if (!project.requiredSkills || project.requiredSkills.length === 0) return false

      const ownerId = project.owner?._id?.toString?.() || project.owner?.toString?.()
      if (ownerId && ownerId === userId) return false

      const members = Array.isArray(project.members) ? project.members : []
      if (userId && members.some(member => member?.toString?.() === userId)) return false

      return true
    })
    .map(project => ({
      ...project,
      score: calculateSkillMatchScore(userSkills, project.requiredSkills || []),
      matchedSkills: getMatchingSkillNames(userSkills, project.requiredSkills || [])
    }))
    .filter(project => project.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

async function matchUsersToProject(projectId, skillFilter) {
  const project = await Project.findById(projectId).lean()
  if (!project) return []

  const excludeIds = new Set([
    project.owner.toString(),
    ...project.members.map(m => m.toString())
  ])

  let query = { _id: { $nin: Array.from(excludeIds) } }
  if (skillFilter && skillFilter.trim()) {
    query['skills.name'] = new RegExp(skillFilter.trim(), 'i')
  }

  const candidates = await User.find(query)
    .select('name email skills role rating profilePic')
    .limit(100)
    .lean()

  return candidates
    .map(user => ({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        role: user.role,
        rating: user.rating,
        profilePic: user.profilePic
      },
      score: calculateSkillMatchScore(user.skills, project.requiredSkills)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

module.exports = {
  normalizeSkill,
  cosineSimilarity,
  buildSkillVector,
  calculateSkillMatchScore,
  getMatchingSkillNames,
  getProjectRecommendations,
  getTeamCoverage,
  getPerSkillCoverage,
  matchUsersToProject
}