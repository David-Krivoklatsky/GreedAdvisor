module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  arrowParens: 'avoid',
  endOfLine: 'crlf',
  overrides: [
    {
      files: ['*.json'],
      options: {
        printWidth: 200,
      },
    },
  ],
};
