require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');

const { User, Progress, Question } = require('./models');
const { authenticateToken, requireAdmin, signToken, publicUser } = require('./auth');
const { generateStudentReport } = require('./pdfGenerator');
const { totalScaledMarks, hasPassed, sanitizeFilename } = require('./utils/scoring');
const { academicYearFromSemester, BRANCHES } = require('./constants');
const {
  validateRegisterInput,
  validateLoginInput,
  parseLevelId,
  normalizeAnswers,
  normalizeEmail,
  isValidEmail,
  validateQuestionPayload,
  resolveAdminStorageEmail
} = require('./validators');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mcq_test';
const isProduction = process.env.NODE_ENV === 'production';
const BCRYPT_ROUNDS = 12;

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Local Vite / preview
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  // Vercel preview + production deployments
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) return true;
  // If no FRONTEND_URL configured, keep previous open-CORS behavior so live sites do not break
  if (allowedOrigins.length === 0) return true;
  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '32kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
});

app.use('/api/', apiLimiter);

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB database.'))
  .catch((err) => {
    console.error('MongoDB database connection error:', err);
    if (isProduction) process.exit(1);
  });

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function ensureDsaProgress(userId) {
  const bulkOps = [];
  for (let lvl = 1; lvl <= 10; lvl++) {
    bulkOps.push({
      updateOne: {
        filter: {
          user: userId,
          course: 'Computer Science',
          subject: 'DSA',
          level: lvl
        },
        update: {
          $setOnInsert: {
            user: userId,
            course: 'Computer Science',
            subject: 'DSA',
            level: lvl,
            score: 0,
            totalQuestions: 10,
            status: lvl === 1 ? 'unlocked' : 'locked',
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    });
  }

  await Progress.bulkWrite(bulkOps, { ordered: false });
  return Progress.find({ user: userId, subject: 'DSA' }).sort({ level: 1 });
}

async function ensureAdminUser(adminLoginId, adminPassword) {
  const storageEmail = resolveAdminStorageEmail(adminLoginId);
  let adminUser = await User.findOne({
    $or: [{ email: storageEmail }, { email: normalizeEmail(adminLoginId) }]
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
    adminUser = await User.create({
      username: 'admin',
      email: storageEmail,
      password: hashedPassword,
      role: 'admin'
    });
    return adminUser;
  }

  if (adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    await adminUser.save();
  }

  return adminUser;
}

// ---------------- AUTH ROUTES ----------------

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const validation = validateRegisterInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
    }

    const { username, email, password, branch, semester } = validation.value;

    const adminLoginId = normalizeEmail(process.env.ADMIN_USERNAME || '');
    const reservedEmails = new Set(
      [adminLoginId, resolveAdminStorageEmail(adminLoginId || 'admin@eistatech.local')]
        .filter(Boolean)
    );

    if (reservedEmails.has(email)) {
      return res.status(400).json({ message: 'This email is reserved for system administration.' });
    }

    // Never accept role from the client — registration is students only
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'student',
      branch,
      semester
    });

    const token = signToken(newUser);
    res.status(201).json({ token, user: publicUser(newUser) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const adminLoginId = normalizeEmail(process.env.ADMIN_USERNAME || '');
    const adminPassword = process.env.ADMIN_PASSWORD || '';

    const validation = validateLoginInput(req.body, adminLoginId);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
    }

    const { email, password } = validation.value;

    // Env-based admin bootstrap (supports non-standard IDs like admin@2026)
    if (adminLoginId && adminPassword && email === adminLoginId && password === adminPassword) {
      const adminUser = await ensureAdminUser(adminLoginId, adminPassword);
      const token = signToken(adminUser);
      return res.json({ token, user: publicUser(adminUser) });
    }

    if (!isValidEmail(email)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
    }
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ message: 'Server error validating session' });
  }
});

// ---------------- STUDENT DATA & DASHBOARD ROUTES ----------------

app.get('/api/courses', authenticateToken, (_req, res) => {
  res.json([
    {
      id: 'computer-science',
      name: 'Computer Science',
      subjects: [
        { id: 'dsa', name: 'Data Structures & Algorithms (DSA)', code: 'DSA' }
      ]
    }
  ]);
});

app.get('/api/levels/dsa', authenticateToken, async (req, res) => {
  try {
    const initializedProgress = await ensureDsaProgress(req.user.id);
    res.json(initializedProgress);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ message: 'Server error fetching levels' });
  }
});

app.get('/api/levels/dsa/:levelId/test', authenticateToken, async (req, res) => {
  try {
    const levelId = parseLevelId(req.params.levelId);
    if (levelId === null) {
      return res.status(400).json({ message: 'Invalid level parameter' });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      subject: 'DSA',
      level: levelId
    });

    if (!progress || progress.status === 'locked') {
      return res.status(403).json({ message: 'This level is locked. Complete previous levels first.' });
    }

    const questions = await Question.find({ subject: 'DSA', level: levelId });
    if (questions.length === 0) {
      return res.status(404).json({
        message: `Questions for Level ${levelId} are not available yet. Please contact an administrator.`
      });
    }

    // Shuffle question order only. Option order stays fixed so submitted indices
    // still map to correctOptionIndex without server-side session state.
    const clientQuestions = shuffleArray(questions).map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      level: q.level
    }));

    res.json({
      level: levelId,
      timeLimitMinutes: Number(process.env.TEST_TIME_LIMIT_MINUTES) || 20,
      questions: clientQuestions
    });
  } catch (error) {
    console.error('Error fetching test questions:', error);
    res.status(500).json({ message: 'Server error fetching test questions' });
  }
});

app.post('/api/levels/dsa/:levelId/submit', authenticateToken, async (req, res) => {
  try {
    const levelId = parseLevelId(req.params.levelId);
    const answers = normalizeAnswers(req.body?.answers);

    if (levelId === null || !answers) {
      return res.status(400).json({ message: 'Invalid test submission' });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      subject: 'DSA',
      level: levelId
    });

    if (!progress || progress.status === 'locked') {
      return res.status(403).json({ message: 'This level is locked. Complete previous levels first.' });
    }

    const questions = await Question.find({ subject: 'DSA', level: levelId });
    if (questions.length === 0) {
      return res.status(404).json({ message: 'Test questions not found.' });
    }

    let correctCount = 0;
    const details = [];

    for (const q of questions) {
      const studentAnswer = answers[q._id.toString()];
      const isCorrect = studentAnswer !== undefined && studentAnswer === q.correctOptionIndex;
      if (isCorrect) correctCount += 1;

      details.push({
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        studentAnswer: studentAnswer === undefined ? null : studentAnswer,
        correctAnswer: q.correctOptionIndex,
        isCorrect
      });
    }

    const passed = hasPassed(correctCount, questions.length);

    progress.score = Math.max(progress.score || 0, correctCount);
    progress.totalQuestions = questions.length;
    progress.status = 'completed';
    progress.updatedAt = new Date();
    await progress.save();

    let nextLevelUnlocked = false;
    if (passed && levelId < 10) {
      const nextLevelId = levelId + 1;
      const existingNext = await Progress.findOne({
        user: req.user.id,
        subject: 'DSA',
        level: nextLevelId
      });

      if (!existingNext) {
        await Progress.create({
          user: req.user.id,
          course: 'Computer Science',
          subject: 'DSA',
          level: nextLevelId,
          score: 0,
          totalQuestions: 10,
          status: 'unlocked'
        });
        nextLevelUnlocked = true;
      } else if (existingNext.status === 'locked') {
        existingNext.status = 'unlocked';
        existingNext.updatedAt = new Date();
        await existingNext.save();
        nextLevelUnlocked = true;
      }
    }

    // Answer keys only returned after submit for learning review
    res.json({
      score: correctCount,
      totalQuestions: questions.length,
      passed,
      nextLevelUnlocked,
      bestScore: progress.score,
      details
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Server error submitting test results' });
  }
});

// ---------------- ADMIN PANEL ROUTES ----------------

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').lean();
    const allProgress = await Progress.find({ subject: 'DSA' }).lean();

    const progressByUser = new Map();
    for (const p of allProgress) {
      const key = p.user.toString();
      if (!progressByUser.has(key)) progressByUser.set(key, []);
      progressByUser.get(key).push(p);
    }

    const studentPerformance = students.map((student) => {
      const studentProgress = progressByUser.get(student._id.toString()) || [];
      const completedCount = studentProgress.filter((p) => p.status === 'completed').length;
      const semester = student.semester ?? null;

      return {
        id: student._id,
        username: student.username,
        email: student.email,
        branch: student.branch || null,
        semester,
        year: semester != null ? academicYearFromSemester(semester) : null,
        levelsCompleted: completedCount,
        totalMarks: totalScaledMarks(studentProgress),
        progress: studentProgress
      };
    });

    res.json({
      totalStudents: students.length,
      totalSubjects: 1,
      branches: BRANCHES,
      students: studentPerformance
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ message: 'Server error fetching admin statistics' });
  }
});

app.get('/api/admin/reports/:userId/pdf', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid student id.' });
    }

    const student = await User.findById(userId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const progresses = await Progress.find({ user: userId, subject: 'DSA' }).sort({ level: 1 });
    const safeName = sanitizeFilename(student.username);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${safeName}.pdf"`);

    generateStudentReport(student, progresses, res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error generating PDF report' });
    }
  }
});

// Admin question bank
app.get('/api/admin/questions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const level = req.query.level ? parseLevelId(req.query.level) : null;
    if (req.query.level && level === null) {
      return res.status(400).json({ message: 'Invalid level parameter' });
    }

    const filter = { subject: 'DSA' };
    if (level !== null) filter.level = level;

    const questions = await Question.find(filter).sort({ level: 1, _id: 1 });
    res.json({ questions, total: questions.length });
  } catch (error) {
    console.error('Error listing questions:', error);
    res.status(500).json({ message: 'Server error listing questions' });
  }
});

app.post('/api/admin/questions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validation = validateQuestionPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
    }

    const question = await Question.create(validation.value);
    res.status(201).json({ question });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Server error creating question' });
  }
});

app.put('/api/admin/questions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid question id.' });
    }

    const validation = validateQuestionPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: validation.value },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    res.json({ question });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Server error updating question' });
  }
});

app.delete('/api/admin/questions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid question id.' });
    }

    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    res.json({ message: 'Question deleted.' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Server error deleting question' });
  }
});

// Reset student DSA progress (all levels or one level)
app.post('/api/admin/students/:userId/reset-progress', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid student id.' });
    }

    const student = await User.findById(userId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const level = req.body?.level != null ? parseLevelId(req.body.level) : null;
    if (req.body?.level != null && level === null) {
      return res.status(400).json({ message: 'Invalid level parameter' });
    }

    if (level !== null) {
      await Progress.findOneAndUpdate(
        { user: userId, subject: 'DSA', level },
        {
          $set: {
            score: 0,
            totalQuestions: 10,
            status: level === 1 ? 'unlocked' : 'locked',
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      // If resetting a mid level, re-lock later completed levels only when full reset — single level keeps others
      return res.json({ message: `Level ${level} progress reset.`, level });
    }

    await Progress.deleteMany({ user: userId, subject: 'DSA' });
    await ensureDsaProgress(userId);
    res.json({ message: 'All DSA progress reset for student.' });
  } catch (error) {
    console.error('Error resetting progress:', error);
    res.status(500).json({ message: 'Server error resetting progress' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use((err, _req, res, _next) => {
  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS origin not allowed' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Express server is running on http://localhost:${PORT}`);
});
