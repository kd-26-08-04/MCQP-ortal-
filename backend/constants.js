/** Shared academic options for student registration / admin filters. */

const BRANCHES = [
  'CSE',
  'IT',
  'ECE',
  'EEE',
  'ME',
  'CE',
  'AIML',
  'DS',
  'Other'
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Academic year from semester (1–2 → Year 1, …, 7–8 → Year 4). */
function academicYearFromSemester(semester) {
  const sem = Number(semester);
  if (!Number.isInteger(sem) || sem < 1 || sem > 8) return null;
  return Math.ceil(sem / 2);
}

module.exports = {
  BRANCHES,
  SEMESTERS,
  academicYearFromSemester
};
