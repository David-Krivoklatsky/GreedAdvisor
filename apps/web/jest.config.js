module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@greed-advisor/db$': '<rootDir>/../../packages/db',
    '^@greed-advisor/crypto$': '<rootDir>/../../packages/crypto',
    '^@greed-advisor/auth$': '<rootDir>/../../packages/auth',
    '^@greed-advisor/utils$': '<rootDir>/../../packages/utils',
    '^@greed-advisor/validations$': '<rootDir>/../../packages/validations',
    '^@greed-advisor/rate-limit$': '<rootDir>/../../packages/rate-limit',
    '^@greed-advisor/middleware$': '<rootDir>/../../packages/middleware',
    '^@greed-advisor/alpaca$': '<rootDir>/../../packages/alpaca',
    '^@greed-advisor/trading$': '<rootDir>/../../packages/trading',
    '^@greed-advisor/engine$': '<rootDir>/../../packages/engine',
    '^@greed-advisor/engine/src/(.*)$': '<rootDir>/../../packages/engine/src/$1',
    '^@greed-advisor/ai$': '<rootDir>/../../packages/ai',
    '^@greed-advisor/market-data$': '<rootDir>/../../packages/market-data',
    '^@greed-advisor/trading212$': '<rootDir>/../../packages/trading212'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/']
};
