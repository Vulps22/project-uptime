/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    // Allow TypeScript source files to be imported with .js extensions
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
