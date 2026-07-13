const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return EMAIL_RE.test(normalizeEmail(email));
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
  if (!isValidEmail(cleanEmail)) {
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

/**
 * Login accepts a normal email OR an admin bootstrap identifier
 * (e.g. admin@2026) that matches ADMIN_USERNAME exactly after normalize.
 */
function validateLoginInput({ email, password }, adminUsername = '') {
  const errors = [];
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || '');
  const normalizedAdmin = normalizeEmail(adminUsername);

  if (!cleanEmail) {
    errors.push('Email or admin ID is required.');
  } else if (!isValidEmail(cleanEmail) && cleanEmail !== normalizedAdmin) {
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

function validateQuestionPayload(body) {
  const errors = [];
  const level = Number.parseInt(body?.level, 10);
  const questionText = String(body?.questionText || '').trim();
  const options = Array.isArray(body?.options) ? body.options.map((o) => String(o || '').trim()) : [];
  const correctOptionIndex = Number.parseInt(body?.correctOptionIndex, 10);

  if (!Number.isInteger(level) || level < 1 || level > 10) {
    errors.push('Level must be between 1 and 10.');
  }
  if (!questionText || questionText.length > 2000) {
    errors.push('Question text is required (max 2000 characters).');
  }
  if (options.length !== 4 || options.some((o) => !o)) {
    errors.push('Exactly 4 non-empty options are required.');
  }
  if (!Number.isInteger(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex > 3) {
    errors.push('correctOptionIndex must be 0–3.');
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      course: 'Computer Science',
      subject: 'DSA',
      level,
      questionText,
      options,
      correctOptionIndex
    }
  };
}

/** Canonical storage email when ADMIN_USERNAME is not a real email (e.g. admin@2026). */
function resolveAdminStorageEmail(adminUsername) {
  const normalized = normalizeEmail(adminUsername);
  if (isValidEmail(normalized)) return normalized;
  return 'admin@eistatech.local';
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  parseLevelId,
  normalizeAnswers,
  normalizeEmail,
  isValidEmail,
  validateQuestionPayload,
  resolveAdminStorageEmail,
  EMAIL_RE
};
