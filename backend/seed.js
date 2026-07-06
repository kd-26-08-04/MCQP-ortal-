require('dotenv').config();
const mongoose = require('mongoose');
const { Question } = require('./models');

const dsaLevel1Questions = [
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'What is a Data Structure?',
    options: [
      'A programming language',
      'A way of organizing and storing data',
      'A computer hardware',
      'An operating system'
    ],
    correctOptionIndex: 1
  },
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'Which of the following is a Linear Data Structure?',
    options: [
      'Tree',
      'Graph',
      'Array',
      'Heap'
    ],
    correctOptionIndex: 2
  },
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'Which of the following is a Non-Linear Data Structure?',
    options: [
      'Stack',
      'Queue',
      'Array',
      'Tree'
    ],
    correctOptionIndex: 3
  },
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'What does Traversing mean?',
    options: [
      'Adding a new element',
      'Removing an element',
      'Visiting each element of a data structure',
      'Sorting the elements'
    ],
    correctOptionIndex: 2
  },
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'Insertion in an array means:',
    options: [
      'Searching an element',
      'Adding a new element',
      'Swapping two elements',
      'Printing the array'
    ],
    correctOptionIndex: 1
  },
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'Deletion in an array means:',
    options: [
      'Removing an element',
      'Copying an element',
      'Sorting the array',
      'Reversing the array'
    ],
    correctOptionIndex: 0
  },
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'What does Big O notation represent?',
    options: [
      'Memory size',
      'Algorithm efficiency',
      'Variable size',
      'File size'
    ],
    correctOptionIndex: 1
  },
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'Which of the following has the best (fastest) time complexity?',
    options: [
      'O(n²)',
      'O(n)',
      'O(log n)',
      'O(1)'
    ],
    correctOptionIndex: 3
  },
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'Find the Time Complexity of the following code:\n\nfor(int i = 0; i < n; i++)\n{\n    cout << i;\n}',
    options: [
      'O(1)',
      'O(log n)',
      'O(n)',
      'O(n²)'
    ],
    correctOptionIndex: 2
  },
  {
    course: 'Computer Science',
    subject: 'DSA',
    level: 1,
    questionText: 'Find the Time Complexity of the following code:\n\nfor(int i = 0; i < n; i++)\n{\n    for(int j = 0; j < n; j++)\n    {\n        cout << i << j;\n    }\n}',
    options: [
      'O(1)',
      'O(n)',
      'O(n log n)',
      'O(n²)'
    ],
    correctOptionIndex: 3
  }
];

async function seedDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mcq_test';
  
  try {
    console.log('Connecting to MongoDB database at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear existing questions for DSA Level 1
    console.log('Deleting existing questions for DSA Level 1...');
    await Question.deleteMany({ subject: 'DSA', level: 1 });

    // Insert new questions
    console.log(`Seeding ${dsaLevel1Questions.length} DSA Level 1 questions...`);
    await Question.insertMany(dsaLevel1Questions);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedDatabase();
