export const BRANCHES = [
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

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export function academicYearFromSemester(semester) {
  const sem = Number(semester);
  if (!Number.isInteger(sem) || sem < 1 || sem > 8) return null;
  return Math.ceil(sem / 2);
}
