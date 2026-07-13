/** Scale a level raw score to marks out of 10. */
function scaleLevelScore(score, totalQuestions) {
  const total = totalQuestions > 0 ? totalQuestions : 10;
  return (score / total) * 10;
}

/** Aggregate completed-level marks (max 100 across 10 levels). */
function totalScaledMarks(progressList) {
  let total = 0;
  for (const p of progressList) {
    if (p.status === 'completed') {
      total += scaleLevelScore(p.score, p.totalQuestions);
    }
  }
  return total;
}

function hasPassed(score, totalQuestions) {
  return score >= Math.ceil(totalQuestions / 2);
}

function sanitizeFilename(name) {
  return String(name || 'student')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 64);
}

module.exports = {
  scaleLevelScore,
  totalScaledMarks,
  hasPassed,
  sanitizeFilename
};
