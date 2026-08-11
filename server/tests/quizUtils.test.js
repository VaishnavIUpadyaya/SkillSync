const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeSkillName, buildQuizEvaluation } = require('../utils/quizUtils')

test('normalizeSkillName trims and lowercases a skill name', () => {
  assert.equal(normalizeSkillName(' React '), 'react')
  assert.equal(normalizeSkillName('NODE.JS'), 'node.js')
})

test('buildQuizEvaluation returns per-question results and a pass threshold', () => {
  const quiz = {
    questions: [
      { question: 'Q1', correctIndex: 1, explanation: 'Because option 2 is correct.' },
      { question: 'Q2', correctIndex: 3, explanation: 'Because option 4 is correct.' },
      { question: 'Q3', correctIndex: 0, explanation: 'Because option 1 is correct.' },
      { question: 'Q4', correctIndex: 2, explanation: 'Because option 3 is correct.' },
      { question: 'Q5', correctIndex: 1, explanation: 'Because option 2 is correct.' }
    ]
  }

  const result = buildQuizEvaluation(quiz, [1, 0, 0, 2, 2])

  assert.equal(result.correctCount, 3)
  assert.equal(result.score, 60)
  assert.equal(result.passed, false)
  assert.equal(result.results[1].isCorrect, false)
  assert.equal(result.results[1].explanation, 'Because option 4 is correct.')
  assert.equal(result.results[2].isCorrect, true)
})
