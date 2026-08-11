const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const SkillQuiz = mongoose.model('SkillQuiz')
const { normalizeSkillName, buildQuizEvaluation } = require('../utils/quizUtils')

const QUIZ_TTL_MS = 7 * 24 * 60 * 60 * 1000
const RETRY_COOLDOWN_MS = 60 * 60 * 1000

async function getOrCreateQuiz(skill, proficiency) {
  const normalizedSkill = normalizeSkillName(skill)
  const levelLabel = ['', 'Beginner', 'Familiar', 'Intermediate', 'Advanced', 'Expert'][proficiency] || 'Intermediate'

  const existingQuiz = await SkillQuiz.findOne({ skill: normalizedSkill, refreshedAt: { $gte: new Date(Date.now() - QUIZ_TTL_MS) } }).lean()
  if (existingQuiz) return existingQuiz

  const prompt = `You are a technical skill evaluator. Generate 5 multiple-choice questions for a student who claims to be at ${levelLabel} level in ${skill}.

Each question must:
- Be specific to ${skill} at ${levelLabel} level
- Have exactly 4 options labeled A-D
- Include a single correct answer index from 0 to 3
- Include a short explanation for why the chosen option is correct

Respond in this exact JSON format with no markdown:
{
  "questions": [
    {
      "question": "question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "one sentence explanation"
    }
  ]
}`

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4000, responseMimeType: 'application/json' }
    })
  })

  const data = await response.json()
  if (!response.ok) {
    console.error('Gemini API Error:', data)
    const status = response.status === 401 ? 502 : response.status
    throw new Error(data.error?.message || 'Error from Gemini API')
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  const clean = text.replace(/```json|```/g, '').trim()
  let parsed = { questions: [] }
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    console.error('Failed to parse quiz JSON from Gemini:', text)
    throw new Error('AI generated invalid quiz response. Please try again.')
  }

  const quizDocument = await SkillQuiz.findOneAndUpdate(
    { skill: normalizedSkill },
    {
      skill: normalizedSkill,
      questions: parsed.questions || [],
      refreshedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return quizDocument.toObject()
}

router.post('/challenge', auth, async (req, res) => {
  try {
    const { skill, proficiency } = req.body
    const quiz = await getOrCreateQuiz(skill, proficiency)
    const user = await User.findById(req.user.id)
    const skillEntry = user?.skills?.find((entry) => entry.name?.toLowerCase() === normalizeSkillName(skill))
    const canRetry = !skillEntry?.verificationCooldownUntil || new Date(skillEntry.verificationCooldownUntil) <= new Date()

    res.json({
      quiz,
      canRetry,
      retryCooldownMs: RETRY_COOLDOWN_MS,
      skillEntry: skillEntry ? {
        verified: skillEntry.verified,
        verificationCooldownUntil: skillEntry.verificationCooldownUntil
      } : null
    })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.post('/evaluate', auth, async (req, res) => {
  try {
    const { skill, proficiency, selectedIndexes, quiz } = req.body
    const normalizedSkill = normalizeSkillName(skill)

    if (!Array.isArray(selectedIndexes) || selectedIndexes.length !== 5) {
      return res.status(400).json({ msg: 'Please answer all questions' })
    }

    const user = await User.findById(req.user.id)
    const skillEntry = user?.skills?.find((entry) => entry.name?.toLowerCase() === normalizedSkill)
    const now = new Date()
    const canRetry = !skillEntry?.verificationCooldownUntil || new Date(skillEntry.verificationCooldownUntil) <= now

    if (!canRetry) {
      return res.status(429).json({ msg: 'Please wait before trying again.' })
    }

    const evaluation = buildQuizEvaluation(quiz, selectedIndexes)
    const result = {
      passed: evaluation.passed,
      score: evaluation.score,
      feedback: evaluation.passed
        ? 'You answered enough questions correctly to earn a verified badge.'
        : 'You are close, but a few answers need more review before the skill can be verified.',
      strongPoints: evaluation.correctCount >= 3 ? ['You understand the core concepts well.', 'Your responses showed solid familiarity with the topic.'] : ['You selected several relevant ideas.', 'You demonstrated effort in the quiz.'],
      improvements: evaluation.correctCount < 3 ? ['Review the concepts behind the missed questions.', 'Try again after the cooldown to strengthen your understanding.'] : ['Revisit the concepts behind any missed questions.', 'Practice the weaker areas before retrying.'],
      results: evaluation.results
    }

    if (result.passed) {
      await User.findOneAndUpdate(
        { _id: req.user.id, 'skills.name': { $regex: new RegExp(`^${normalizedSkill}$`, 'i') } },
        {
          $set: {
            'skills.$.verified': true,
            'skills.$.verifiedAt': new Date(),
            'skills.$.verificationCooldownUntil': null
          }
        }
      )
    } else {
      await User.findOneAndUpdate(
        { _id: req.user.id, 'skills.name': { $regex: new RegExp(`^${normalizedSkill}$`, 'i') } },
        {
          $set: {
            'skills.$.verificationCooldownUntil': new Date(Date.now() + RETRY_COOLDOWN_MS)
          }
        }
      )
    }

    res.json(result)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router