const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Progress Schema (tracks student progress per subject level)
const ProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: String,
    default: 'Computer Science'
  },
  subject: {
    type: String,
    default: 'DSA'
  },
  level: {
    type: Number,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['locked', 'unlocked', 'completed'],
    default: 'locked'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Question Schema
const QuestionSchema = new mongoose.Schema({
  course: {
    type: String,
    default: 'Computer Science'
  },
  subject: {
    type: String,
    default: 'DSA'
  },
  level: {
    type: Number,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: [opts => opts.length === 4, 'Must have exactly 4 options']
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  }
});

// Compound index to ensure uniqueness of progress per user/course/subject/level
ProgressSchema.index({ user: 1, course: 1, subject: 1, level: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const Progress = mongoose.model('Progress', ProgressSchema);
const Question = mongoose.model('Question', QuestionSchema);

module.exports = {
  User,
  Progress,
  Question
};
