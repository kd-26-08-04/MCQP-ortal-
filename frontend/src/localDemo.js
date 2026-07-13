/**
 * TEMPORARY LOCAL DEMO AUTH — remove before production handoff.
 * Only active on localhost / 127.0.0.1. Does not require MongoDB or the API.
 */

export const LOCAL_DEMO_ENABLED =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const LOCAL_DEMO_TOKEN_PREFIX = 'local-demo:';

/** Temporary accounts — delete this file when done. */
export const LOCAL_DEMO_ACCOUNTS = [
  {
    email: 'student@local.dev',
    password: 'student123',
    user: {
      id: 'local-student-1',
      username: 'demo_student',
      email: 'student@local.dev',
      role: 'student'
    }
  },
  {
    email: 'admin@local.dev',
    password: 'admin123',
    user: {
      id: 'local-admin-1',
      username: 'demo_admin',
      email: 'admin@local.dev',
      role: 'admin'
    }
  }
];

const DEMO_QUESTIONS = [
  {
    _id: 'lq1',
    questionText: 'What is a Data Structure?',
    options: [
      'A programming language',
      'A way of organizing and storing data',
      'A computer hardware',
      'An operating system'
    ],
    correctOptionIndex: 1,
    level: 1
  },
  {
    _id: 'lq2',
    questionText: 'Which of the following is a Linear Data Structure?',
    options: ['Tree', 'Graph', 'Array', 'Heap'],
    correctOptionIndex: 2,
    level: 1
  },
  {
    _id: 'lq3',
    questionText: 'What does Big O notation represent?',
    options: ['Memory size', 'Algorithm efficiency', 'Variable size', 'File size'],
    correctOptionIndex: 1,
    level: 1
  },
  {
    _id: 'lq4',
    questionText: 'Which has the best (fastest) time complexity?',
    options: ['O(n²)', 'O(n)', 'O(log n)', 'O(1)'],
    correctOptionIndex: 3,
    level: 1
  },
  {
    _id: 'lq5',
    questionText: 'Which is a Non-Linear Data Structure?',
    options: ['Stack', 'Queue', 'Array', 'Tree'],
    correctOptionIndex: 3,
    level: 1
  },
  {
    _id: 'lq6',
    questionText: 'What does Traversing mean?',
    options: [
      'Adding a new element',
      'Removing an element',
      'Visiting each element of a data structure',
      'Sorting the elements'
    ],
    correctOptionIndex: 2,
    level: 1
  },
  {
    _id: 'lq7',
    questionText: 'Insertion in an array means:',
    options: [
      'Searching an element',
      'Adding a new element',
      'Swapping two elements',
      'Printing the array'
    ],
    correctOptionIndex: 1,
    level: 1
  },
  {
    _id: 'lq8',
    questionText: 'Deletion in an array means:',
    options: [
      'Removing an element',
      'Copying an element',
      'Sorting the array',
      'Reversing the array'
    ],
    correctOptionIndex: 0,
    level: 1
  },
  {
    _id: 'lq9',
    questionText: 'Time complexity of a single loop from 0 to n-1 is:',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctOptionIndex: 2,
    level: 1
  },
  {
    _id: 'lq10',
    questionText: 'Time complexity of nested loops both 0..n-1 is:',
    options: ['O(1)', 'O(n)', 'O(n log n)', 'O(n²)'],
    correctOptionIndex: 3,
    level: 1
  }
];

function progressStoreKey(userId) {
  return `local-demo-progress:${userId}`;
}

function defaultLevels() {
  return Array.from({ length: 10 }, (_, i) => {
    const level = i + 1;
    return {
      _id: `prog-${level}`,
      level,
      course: 'Computer Science',
      subject: 'DSA',
      score: 0,
      totalQuestions: 10,
      status: level === 1 ? 'unlocked' : 'locked',
      updatedAt: new Date().toISOString()
    };
  });
}

function loadProgress(userId) {
  try {
    const raw = localStorage.getItem(progressStoreKey(userId));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const levels = defaultLevels();
  saveProgress(userId, levels);
  return levels;
}

function saveProgress(userId, levels) {
  localStorage.setItem(progressStoreKey(userId), JSON.stringify(levels));
}

export function isLocalDemoToken(token) {
  return typeof token === 'string' && token.startsWith(LOCAL_DEMO_TOKEN_PREFIX);
}

export function getLocalDemoUserFromToken(token) {
  if (!isLocalDemoToken(token)) return null;
  const role = token.slice(LOCAL_DEMO_TOKEN_PREFIX.length);
  const account = LOCAL_DEMO_ACCOUNTS.find((a) => a.user.role === role);
  return account ? { ...account.user } : null;
}

export function tryLocalDemoLogin(email, password) {
  if (!LOCAL_DEMO_ENABLED) return null;

  const account = LOCAL_DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === String(email || '').trim().toLowerCase() && a.password === password
  );

  if (!account) return null;

  return {
    token: `${LOCAL_DEMO_TOKEN_PREFIX}${account.user.role}`,
    user: { ...account.user }
  };
}

function jsonOk(data) {
  return { response: { ok: true, status: 200 }, data };
}

export async function handleLocalDemoRequest(path, { token, method = 'GET', body } = {}) {
  const user = getLocalDemoUserFromToken(token);
  if (!user && path !== '/api/auth/login') {
    const error = new Error('Invalid local demo session');
    error.status = 401;
    throw error;
  }

  const verb = method.toUpperCase();

  if (path === '/api/auth/me' && verb === 'GET') {
    return jsonOk({ user });
  }

  if (path === '/api/courses' && verb === 'GET') {
    return jsonOk([
      {
        id: 'computer-science',
        name: 'Computer Science',
        subjects: [{ id: 'dsa', name: 'Data Structures & Algorithms (DSA)', code: 'DSA' }]
      }
    ]);
  }

  if (path === '/api/levels/dsa' && verb === 'GET') {
    return jsonOk(loadProgress(user.id));
  }

  const testMatch = path.match(/^\/api\/levels\/dsa\/(\d+)\/test$/);
  if (testMatch && verb === 'GET') {
    const levelId = Number(testMatch[1]);
    const levels = loadProgress(user.id);
    const progress = levels.find((l) => l.level === levelId);
    if (!progress || progress.status === 'locked') {
      const error = new Error('This level is locked. Complete previous levels first.');
      error.status = 403;
      throw error;
    }
    if (levelId !== 1) {
      const error = new Error('Local demo only includes Level 1 questions.');
      error.status = 404;
      throw error;
    }
    return jsonOk({
      level: levelId,
      timeLimitMinutes: 20,
      questions: DEMO_QUESTIONS.map(({ correctOptionIndex: _correct, ...q }) => q)
    });
  }

  const submitMatch = path.match(/^\/api\/levels\/dsa\/(\d+)\/submit$/);
  if (submitMatch && verb === 'POST') {
    const levelId = Number(submitMatch[1]);
    const payload = typeof body === 'string' ? JSON.parse(body) : body || {};
    const answers = payload.answers || {};
    let correctCount = 0;
    for (const q of DEMO_QUESTIONS) {
      if (Number(answers[q._id]) === q.correctOptionIndex) correctCount += 1;
    }
    const totalQuestions = DEMO_QUESTIONS.length;
    const passed = correctCount >= Math.ceil(totalQuestions / 2);

    const levels = loadProgress(user.id);
    const current = levels.find((l) => l.level === levelId);
    if (!current || current.status === 'locked') {
      const error = new Error('This level is locked. Complete previous levels first.');
      error.status = 403;
      throw error;
    }

    current.score = Math.max(current.score || 0, correctCount);
    current.totalQuestions = totalQuestions;
    current.status = 'completed';
    current.updatedAt = new Date().toISOString();

    let nextLevelUnlocked = false;
    if (passed && levelId < 10) {
      const next = levels.find((l) => l.level === levelId + 1);
      if (next && next.status === 'locked') {
        next.status = 'unlocked';
        nextLevelUnlocked = true;
      }
    }
    saveProgress(user.id, levels);

    return jsonOk({
      score: correctCount,
      totalQuestions,
      passed,
      nextLevelUnlocked,
      bestScore: current.score
    });
  }

  if (path === '/api/admin/stats' && verb === 'GET') {
    if (user.role !== 'admin') {
      const error = new Error('Forbidden. Admin privileges required.');
      error.status = 403;
      throw error;
    }
    const studentProgress = loadProgress('local-student-1');
    const completedCount = studentProgress.filter((p) => p.status === 'completed').length;
    let totalMarks = 0;
    studentProgress.forEach((p) => {
      if (p.status === 'completed') {
        totalMarks += (p.score / (p.totalQuestions || 10)) * 10;
      }
    });

    return jsonOk({
      totalStudents: 1,
      totalSubjects: 1,
      students: [
        {
          id: 'local-student-1',
          username: 'demo_student',
          email: 'student@local.dev',
          levelsCompleted: completedCount,
          totalMarks,
          progress: studentProgress
        }
      ]
    });
  }

  if (path.startsWith('/api/admin/reports/') && path.endsWith('/pdf') && verb === 'GET') {
    const error = new Error('PDF export is disabled in local demo mode (no backend).');
    error.status = 501;
    throw error;
  }

  const error = new Error(`Local demo does not support ${verb} ${path}`);
  error.status = 404;
  throw error;
}
