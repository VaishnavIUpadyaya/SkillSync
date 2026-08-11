function normalizeSkillName(skill = '') {
  return String(skill).trim().toLowerCase()
}

function buildQuizEvaluation(quiz, selectedIndexes = []) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : []
  const results = questions.map((question, index) => {
    const selectedIndex = selectedIndexes[index]
    const isCorrect = Number(selectedIndex) === Number(question.correctIndex)

    return {
      question: question.question,
      selectedIndex: selectedIndex ?? null,
      correctIndex: question.correctIndex,
      isCorrect,
      explanation: question.explanation || 'Review the concept and try again.'
    }
  })

  const correctCount = results.filter((item) => item.isCorrect).length
  const score = Math.round((correctCount / Math.max(questions.length, 1)) * 100)
  const passed = score >= 70

  return { results, correctCount, score, passed }
}

module.exports = {
  normalizeSkillName,
  buildQuizEvaluation
}
