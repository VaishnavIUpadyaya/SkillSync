const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const User = require('mongoose').model('User')

// POST /api/verify/challenge — generate a challenge
router.post('/challenge', auth, async (req, res) => {
  try {
    const { skill, proficiency } = req.body

    const levelLabel = ['', 'Beginner', 'Familiar', 'Intermediate', 'Advanced', 'Expert'][proficiency] || 'Intermediate'

    const prompt = `You are a technical skill evaluator. Generate a short skill verification challenge for a student who claims to be at ${levelLabel} level in ${skill}.

The challenge must:
- Be answerable in 3-5 sentences or a short code snippet (max 10 lines)
- Be specific to ${skill} at ${levelLabel} level
- Have a clear correct answer you can evaluate
- Not require running code — just written explanation or pseudocode

Respond in this exact JSON format with no markdown:
{
  "question": "the challenge question here",
  "hint": "a small hint to help them",
  "expectedTopics": ["topic1", "topic2", "topic3"]
}`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000, responseMimeType: 'application/json' }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API Error:', data)
      const status = response.status === 401 ? 502 : response.status
      return res.status(status).json({ msg: data.error?.message || 'Error from Gemini API' })
    }

    const text = data.candidates[0].content.parts[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

// POST /api/verify/evaluate — evaluate the answer
router.post('/evaluate', auth, async (req, res) => {
  try {
    const { skill, proficiency, question, answer, expectedTopics } = req.body

    if (!answer || answer.trim().length < 10) {
      return res.status(400).json({ msg: 'Answer too short' })
    }

    const levelLabel = ['', 'Beginner', 'Familiar', 'Intermediate', 'Advanced', 'Expert'][proficiency] || 'Intermediate'

    const prompt = `You are a technical skill evaluator. A student claims to be at ${levelLabel} level in ${skill}.

Challenge question: ${question}

Expected topics to cover: ${expectedTopics.join(', ')}

Student's answer: ${answer}

Evaluate if this answer demonstrates ${levelLabel} level knowledge of ${skill}.

Respond in this exact JSON format with no markdown:
{
  "passed": true or false,
  "score": a number from 0 to 100,
  "feedback": "2-3 sentences of specific feedback on their answer",
  "strongPoints": ["point1", "point2"],
  "improvements": ["area1", "area2"]
}`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000, responseMimeType: 'application/json' }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API Error:', data)
      const status = response.status === 401 ? 502 : response.status
      return res.status(status).json({ msg: data.error?.message || 'Error from Gemini API' })
    }

    const text = data.candidates[0].content.parts[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    if (result.passed) {
      await User.findOneAndUpdate(
        { _id: req.user.id, 'skills.name': skill },
        { 
          $set: { 
            'skills.$.verified': true,
            'skills.$.verifiedAt': new Date()
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