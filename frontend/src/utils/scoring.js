/** Scale a level raw score to marks out of 10. */
export function scaleLevelScore(score, totalQuestions = 10) {
  const total = totalQuestions > 0 ? totalQuestions : 10;
  return (score / total) * 10;
}

export function totalScaledMarks(levels) {
  return levels.reduce((sum, level) => {
    if (level.status !== 'completed') return sum;
    return sum + scaleLevelScore(level.score, level.totalQuestions);
  }, 0);
}

export function passThreshold(totalQuestions) {
  return Math.ceil(totalQuestions / 2);
}
