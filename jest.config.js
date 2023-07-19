module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['dist'],
  transform: {
    '^.+\\.spec.ts?$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
};
