const mongoose = require('mongoose');
const { BRANCHES } = require('./constants');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 40
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  branch: {
    type: String,
    enum: BRANCHES,
    trim: true,
    default: undefined
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    default: undefined
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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
    required: true,
    min: 1,
    max: 10
  },
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  totalQuestions: {
    type: Number,
    default: 10,
    min: 1
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
    required: true,
    min: 1,
    max: 10
  },
  questionText: {
    type: String,
    required: true,
    maxlength: 2000
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (opts) => Array.isArray(opts) && opts.length === 4 && opts.every((o) => typeof o === 'string' && o.trim().length > 0),
      message: 'Must have exactly 4 non-empty options'
    }
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  }
});

ProgressSchema.index({ user: 1, course: 1, subject: 1, level: 1 }, { unique: true });
QuestionSchema.index({ subject: 1, level: 1 });

const User = mongoose.model('User', UserSchema);
const Progress = mongoose.model('Progress', ProgressSchema);
const Question = mongoose.model('Question', QuestionSchema);

module.exports = {
  User,
  Progress,
  Question
};
