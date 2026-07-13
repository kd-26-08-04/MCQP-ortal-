require('dotenv').config();
const mongoose = require('mongoose');
const { Question } = require('./models');
const { dsaQuestions } = require('./questionsData');

async function seedDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mcq_test';

  try {
    console.log('Connecting to MongoDB database at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    console.log('Replacing all DSA questions (levels 1–10)...');
    await Question.deleteMany({ subject: 'DSA' });

    console.log(`Seeding ${dsaQuestions.length} questions...`);
    await Question.insertMany(dsaQuestions);

    const counts = await Question.aggregate([
      { $match: { subject: 'DSA' } },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('Questions per level:', counts.map((c) => `L${c._id}:${c.count}`).join(', '));
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedDatabase();
