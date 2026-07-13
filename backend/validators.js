const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateRegisterInput({ username, email, password }) {
  const errors = [];
  const cleanUsername = String(username || '').trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || '');

  if (cleanUsername.length < 3 || cleanUsername.length > 40) {
    errors.push('Username must be between 3 and 40 characters.');
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
    errors.push('Username may only contain letters, numbers, dots, underscores, and hyphens.');
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    errors.push('A valid email address is required.');
  }
  if (cleanPassword.length < 8 || cleanPassword.length > 128) {
    errors.push('Password must be between 8 and 128 characters.');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      username: cleanUsername,
      email: cleanEmail,
      password: cleanPassword
    }
  };
}

function validateLoginInput({ email, password }) {
  const errors = [];
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || '');

  if (!EMAIL_RE.test(cleanEmail)) {
    errors.push('A valid email address is required.');
  }
  if (!cleanPassword) {
    errors.push('Password is required.');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: { email: cleanEmail, password: cleanPassword }
  };
}

function parseLevelId(raw) {
  const levelId = Number.parseInt(raw, 10);
  if (!Number.isInteger(levelId) || levelId < 1 || levelId > 10) {
    return null;
  }
  return levelId;
}

function normalizeAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return null;
  }

  const normalized = {};
  for (const [questionId, value] of Object.entries(answers)) {
    if (!/^[a-fA-F0-9]{24}$/.test(questionId)) {
      continue;
    }
    const idx = Number.parseInt(value, 10);
    if (Number.isInteger(idx) && idx >= 0 && idx <= 3) {
      normalized[questionId] = idx;
    }
  }
  return normalized;
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  parseLevelId,
  normalizeAnswers,
  normalizeEmail
};
