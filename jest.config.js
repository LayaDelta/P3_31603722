process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test', override: true });

module.exports = {
  testEnvironment: 'node',
  verbose: true,
  setupFilesAfterEnv: ['./Test/setup.js'],
};
