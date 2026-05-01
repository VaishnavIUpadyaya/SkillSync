const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Roadmap = require('../models/roadmap')
const Project = require('../models/project')
const User = require('../models/user')

// Helper: calculate number of weeks from now to deadline
function getWeekCount(deadline) {
  if (!deadline) return 4
  const now = new Date()
  const end = new Date(deadline)
  const diffMs = end - now
  const weeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7))
  return Math.max(2, Math.min(weeks, 12)) // between 2 and 12 weeks
}

// Helper: match member by name from AI response
function findMemberByName(members, name) {
  if (!name) return null
  const lower = name.toLowerCase()
  return members.find(m => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase().split(' ')[0].toLowerCase()))
}

// POST /api/roadmap/:projectId/generate — owner only
router.post('/:projectId/generate', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members', 'name skills role')
    if (!project) return res.status(404).json({ msg: 'Project not found' })
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the project owner can generate a roadmap' })
    }

    const weekCount = getWeekCount(project.deadline)
    const deadlineStr = project.deadline
      ? new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : `${weekCount} weeks from now`

    const memberList = project.members.map(m => ({
      name: m.name,
      role: m.role || 'Developer',
      skills: (m.skills || []).map(s => s.name).join(', ') || 'General'
    }))

    const prompt = `You are a smart project manager AI. Generate a detailed week-by-week roadmap for the following student software project.

Project Title: ${project.title}
Description: ${project.description}
Deadline: ${deadlineStr}
Duration: ${weekCount} weeks
Team Size: ${project.members.length} members
Required Skills: ${project.requiredSkills.map(s => s.name).join(', ')}

Team Members:
${memberList.map(m => `- ${m.name} (${m.role}): Skills: ${m.skills}`).join('\n')}

Generate exactly ${weekCount} weeks. For each week, assign 3-5 specific tasks. Assign each task to the most suitable team member by name based on their skills.

Rules:
- Distribute tasks fairly across all team members
- Week 1 should cover setup, planning, and architecture
- Last week should cover testing, polish, and deployment
- Each task must name one specific team member as assignee
- Keep task titles short (max 8 words)
- Keep task descriptions to 1-2 sentences

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "weeks": [
    {
      "week": 1,
      "title": "Week 1: Setup & Architecture",
      "milestone": "Project foundation ready",
      "tasks": [
        {
          "title": "Initialize repository and project structure",
          "description": "Set up Git repo, folder structure, and base dependencies.",
          "assigneeName": "Member Name Here",
          "skill": "Git"
        }
      ]
    }
  ]
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json'
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API Error:', data)
      const status = response.status === 401 ? 502 : response.status
      return res.status(status).json({ msg: data.error?.message || 'Error from Gemini API' })
    }

    const text = data.candidates[0].content.parts[0].text
    const parsed = JSON.parse(text)

    // Map assignee names to member IDs
    const weeks = parsed.weeks.map(w => ({
      ...w,
      tasks: w.tasks.map(t => {
        const member = findMemberByName(project.members, t.assigneeName)
        return {
          ...t,
          assigneeId: member?._id || null,
          assigneeName: member?.name || t.assigneeName || '',
          done: false
        }
      })
    }))

    // Upsert roadmap (replace if exists)
    const roadmap = await Roadmap.findOneAndUpdate(
      { project: project._id },
      { project: project._id, generatedAt: new Date(), weeks },
      { upsert: true, new: true }
    )

    res.json(roadmap)
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: err.message })
  }
})

// GET /api/roadmap/:projectId — members only
router.get('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
    if (!project) return res.status(404).json({ msg: 'Project not found' })

    const isMember = project.members.map(m => m.toString()).includes(req.user.id)
    const isOwner = project.owner.toString() === req.user.id
    if (!isMember && !isOwner) {
      return res.status(403).json({ msg: 'Access denied' })
    }

    const roadmap = await Roadmap.findOne({ project: req.params.projectId })
    if (!roadmap) return res.status(404).json({ msg: 'No roadmap yet' })

    res.json(roadmap)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

// PATCH /api/roadmap/:projectId/tasks/:taskId — toggle done, members only
router.patch('/:projectId/tasks/:taskId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
    if (!project) return res.status(404).json({ msg: 'Project not found' })

    const isMember = project.members.map(m => m.toString()).includes(req.user.id)
    const isOwner = project.owner.toString() === req.user.id
    if (!isMember && !isOwner) {
      return res.status(403).json({ msg: 'Access denied' })
    }

    const roadmap = await Roadmap.findOne({ project: req.params.projectId })
    if (!roadmap) return res.status(404).json({ msg: 'No roadmap found' })

    // Find the task in any week
    let found = false
    for (const week of roadmap.weeks) {
      const task = week.tasks.id(req.params.taskId)
      if (task) {
        task.done = !task.done
        task.completedBy = task.done ? req.user.name : ''
        task.completedAt = task.done ? new Date() : null
        found = true
        break
      }
    }

    if (!found) return res.status(404).json({ msg: 'Task not found' })

    await roadmap.save()
    res.json(roadmap)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router
