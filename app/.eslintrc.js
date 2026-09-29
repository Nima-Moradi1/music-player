module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['android/**', 'ios/**'],
  rules: {'no-void': ['error', {allowAsStatement: true}]},
};
