require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User, Progress, Question } = require('./models');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('./auth');
const { generateStudentReport } = require('./pdfGenerator');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mcq_test';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB database.'))
  .catch(err => console.error('MongoDB database connection error:', err));

// Shuffle array utility (Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ---------------- AUTH ROUTES ----------------

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'student'
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ---------------- STUDENT DATA & DASHBOARD ROUTES ----------------

// Get available courses & subjects
app.get('/api/courses', (req, res) => {
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

// Get levels list & completion status for DSA
app.get('/api/levels/dsa', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch existing progress
    let progresses = await Progress.find({ user: userId, subject: 'DSA' });

    // Initialize levels if they don't exist in progress db
    const initializedProgress = [];
    
    for (let lvl = 1; lvl <= 10; lvl++) {
      let lvlProgress = progresses.find(p => p.level === lvl);
      
      if (!lvlProgress) {
        // Level 1 starts unlocked, others locked
        const defaultStatus = lvl === 1 ? 'unlocked' : 'locked';
        lvlProgress = new Progress({
          user: userId,
          course: 'Computer Science',
          subject: 'DSA',
          level: lvl,
          score: 0,
          status: defaultStatus
        });
        await lvlProgress.save();
      }
      initializedProgress.push(lvlProgress);
    }

    // Sort by level ascending
    initializedProgress.sort((a, b) => a.level - b.level);
    res.json(initializedProgress);
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ message: 'Server error fetching levels' });
  }
});

// Get test questions for a specific DSA level
app.get('/api/levels/dsa/:levelId/test', authenticateToken, async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    if (isNaN(levelId) || levelId < 1 || levelId > 10) {
      return res.status(400).json({ message: 'Invalid level parameter' });
    }

    // Check if user is allowed to access this level
    const progress = await Progress.findOne({
      user: req.user.id,
      subject: 'DSA',
      level: levelId
    });

    if (!progress || progress.status === 'locked') {
      return res.status(403).json({ message: 'This level is locked. Complete previous levels first.' });
    }

    // Fetch questions
    let questions = await Question.find({ subject: 'DSA', level: levelId });

    // If level is 1 and no questions exist (e.g. not seeded), seed them dynamically
    if (questions.length === 0 && levelId === 1) {
      // Let's seed dynamically as fallback
      // Wait, we have a seed script, but seeding dynamically here makes it robust too
      return res.status(404).json({ message: 'Questions for Level 1 not found. Please run the seed script first.' });
    }

    // If level is > 1 and we don't have questions yet, provide a mock set of questions (dynamic mock generator for testing subsequent levels)
    if (questions.length === 0) {
      const mockQuestions = Array.from({ length: 20 }, (_, idx) => ({
        course: 'Computer Science',
        subject: 'DSA',
        level: levelId,
        questionText: `Mock DSA Level ${levelId} Question ${idx + 1}: Select the correct answer option.`,
        options: [
          `Incorrect Answer A`,
          `Correct Answer Option`,
          `Incorrect Answer B`,
          `Incorrect Answer C`
        ],
        correctOptionIndex: 1
      }));
      
      // Save them so we can fetch them
      await Question.insertMany(mockQuestions);
      questions = await Question.find({ subject: 'DSA', level: levelId });
    }

    // Map questions to remove correct answers before sending to student client
    const clientQuestions = questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      level: q.level
    }));

    // Shuffle questions so students do not get them in the same arrangement
    const randomizedQuestions = shuffleArray(clientQuestions);

    res.json({
      level: levelId,
      timeLimitMinutes: 20, // 20 minutes for the test
      questions: randomizedQuestions
    });
  } catch (error) {
    console.error('Error fetching test questions:', error);
    res.status(500).json({ message: 'Server error fetching test questions' });
  }
});

// Submit MCQ Test answers
app.post('/api/levels/dsa/:levelId/submit', authenticateToken, async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const { answers } = req.body; // Map: { questionId: selectedIndex }

    if (isNaN(levelId) || levelId < 1 || levelId > 10 || !answers) {
      return res.status(400).json({ message: 'Invalid test submission' });
    }

    // Fetch original questions with answers
    const questions = await Question.find({ subject: 'DSA', level: levelId });
    if (questions.length === 0) {
      return res.status(404).json({ message: 'Test questions not found.' });
    }

    let correctCount = 0;
    const details = [];

    questions.forEach(q => {
      const studentAnswer = answers[q._id.toString()];
      const isCorrect = studentAnswer !== undefined && parseInt(studentAnswer) === q.correctOptionIndex;
      
      if (isCorrect) {
        correctCount++;
      }

      details.push({
        questionId: q._id,
        studentAnswer,
        correctAnswer: q.correctOptionIndex,
        isCorrect
      });
    });

    // Save Progress for current level
    let currentProgress = await Progress.findOne({
      user: req.user.id,
      subject: 'DSA',
      level: levelId
    });

    if (!currentProgress) {
      currentProgress = new Progress({
        user: req.user.id,
        level: levelId,
        subject: 'DSA'
      });
    }

    // Update if new score is higher
    if (correctCount > currentProgress.score || currentProgress.status !== 'completed') {
      currentProgress.score = correctCount;
    }
    
    currentProgress.totalQuestions = questions.length; // store the question length
    currentProgress.status = 'completed';
    currentProgress.updatedAt = new Date();
    await currentProgress.save();

    // Check if they passed (minimum 50% correct answers)
    // If they pass and there's a next level, unlock the next level
    const passed = correctCount >= Math.ceil(questions.length / 2);
    let nextLevelUnlocked = false;

    if (passed && levelId < 10) {
      const nextLevelId = levelId + 1;
      let nextProgress = await Progress.findOne({
        user: req.user.id,
        subject: 'DSA',
        level: nextLevelId
      });

      if (!nextProgress) {
        nextProgress = new Progress({
          user: req.user.id,
          level: nextLevelId,
          subject: 'DSA',
          status: 'unlocked'
        });
        await nextProgress.save();
        nextLevelUnlocked = true;
      } else if (nextProgress.status === 'locked') {
        nextProgress.status = 'unlocked';
        await nextProgress.save();
        nextLevelUnlocked = true;
      }
    }

    res.json({
      score: correctCount,
      totalQuestions: questions.length,
      passed,
      nextLevelUnlocked,
      details
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Server error submitting test results' });
  }
});

// ---------------- ADMIN PANEL ROUTES ----------------

// Get admin statistics dashboard
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Get all students
    const students = await User.find({ role: 'student' }).select('-password');
    
    // 2. Fetch progress for all students
    const allProgress = await Progress.find({ subject: 'DSA' });

    // 3. Map students to performance details
    const studentPerformance = students.map(student => {
      const studentProgress = allProgress.filter(p => p.user.toString() === student._id.toString());
      
      const completedCount = studentProgress.filter(p => p.status === 'completed').length;
      
      let totalScoreScaled = 0;
      studentProgress.forEach(p => {
        if (p.status === 'completed') {
          const totalQ = p.totalQuestions || 10; // default fallback
          totalScoreScaled += (p.score / totalQ) * 10; // Scale to 10 marks per level
        }
      });

      return {
        id: student._id,
        username: student.username,
        email: student.email,
        levelsCompleted: completedCount,
        totalMarks: totalScoreScaled,
        progress: studentProgress
      };
    });

    res.json({
      totalStudents: students.length,
      totalSubjects: 1, // Only DSA currently
      students: studentPerformance
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ message: 'Server error fetching admin statistics' });
  }
});

// Download PDF Report for a student
app.get('/api/admin/reports/:userId/pdf', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find Student
    const student = await User.findById(userId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Find Student Progress
    const progresses = await Progress.find({ user: userId, subject: 'DSA' }).sort({ level: 1 });

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_${student.username}.pdf`);

    // Stream PDF
    generateStudentReport(student, progresses, res);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error generating PDF report' });
    }
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express server is running on http://localhost:${PORT}`);
});
