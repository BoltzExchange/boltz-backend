module.exports = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['dist'],
  transform: {
    '^.+\\.[tj]s$': [
      '@swc/jest',
      {
        jsc: {
          experimental: {
            plugins: [['@swc-contrib/mut-cjs-exports', {}]],
          },
        },
      },
    ],
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@noble|@scure|micro-packed))',
  ],
};
