module.exports = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['dist'],
  transform: {
    '^.+\\.[tj]s$': [
      '@swc/jest',
      {
        // @scure/bip39 ships `//# sourceMappingURL=` comments but no .map files,
        // which trips SWC's input source map resolver
        inputSourceMap: false,
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
