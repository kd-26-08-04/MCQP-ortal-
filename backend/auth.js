const jwt = require('jsonwebtoken');
const { academicYearFromSemester } = require('./constants');

const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (isProduction) {
    console.error('FATAL: JWT_SECRET environment variable is required in production.');
    process.exit(1);
  }
  console.warn('WARNING: JWT_SECRET is not set. Using an insecure development default.');
}

const RESOLVED_JWT_SECRET = JWT_SECRET || 'dev-only-insecure-jwt-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      email: user.email
    },
    RESOLVED_JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Access token missing. Please log in.' });
  }

  jwt.verify(token, RESOLVED_JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
    }
    req.user = decodedUser;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
  }
  next();
}

function publicUser(user) {
  const semester = user.semester ?? null;
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    branch: user.branch || null,
    semester,
    year: semester != null ? academicYearFromSemester(semester) : null
  };
}

module.exports = {
  authenticateToken,
  requireAdmin,
  signToken,
  publicUser,
  JWT_SECRET: RESOLVED_JWT_SECRET
};
