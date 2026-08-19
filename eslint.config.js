const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const fsd = require('eslint-plugin-fsd-lint');
const unicorn = require('eslint-plugin-unicorn').default;
const boundaries = require('eslint-plugin-boundaries');

const fsdLayers = { layers: { pages: { pattern: 'screens' } } };

const filenameCase = (kind, indexName) => ['error', { case: kind, checkDirectories: false, ignore: [indexName] }];

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    ignores: ['ios/', 'android/', 'targets/*/Assets.xcassets/', 'node_modules/', 'references/'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { fsd, boundaries, unicorn },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'screens', pattern: 'src/screens/**' },
        { type: 'entities', pattern: 'src/entities/**' },
        { type: 'shared', pattern: 'src/shared/**' },
      ],
      'boundaries/include': ['src/**/*'],
    },
    rules: {
      'fsd/forbidden-imports': ['error', fsdLayers],
      'fsd/no-cross-slice-dependency': ['error', fsdLayers],
      'fsd/no-public-api-sidestep': ['error', { publicApi: { allowSegmentImports: true, enforceShared: true } }],
      'fsd/no-relative-imports': ['error', { ...fsdLayers, allowSameSlice: true }],
      'fsd/ordered-imports': ['error', fsdLayers],

      'boundaries/no-unknown-files': 'error',

      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],

      'react/jsx-no-leaked-render': 'error',

      'unicorn/no-abusive-eslint-disable': 'error',
    },
  },
  {
    files: ['src/**/*.tsx'],
    plugins: { unicorn },
    rules: { 'unicorn/filename-case': filenameCase('pascalCase', 'index.tsx') },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { unicorn },
    rules: { 'unicorn/filename-case': filenameCase('camelCase', 'index.ts') },
  },
];
