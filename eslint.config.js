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
        { type: 'app', pattern: 'src/app' },
        { type: 'shared', pattern: 'src/shared/*' },
        { type: 'segment', pattern: 'src/{screens,widgets,features,entities}/*/*' },
      ],
      'boundaries/include': ['src/**/*'],
      'boundaries/files': [{ pattern: 'src/{screens,widgets,features,entities}/*/index.{ts,tsx}', category: 'slice-api' }],
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
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 3 }],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }],
      'no-restricted-syntax': ['error', { selector: 'TSEnumDeclaration', message: 'enum 대신 `as const` 객체와 유니온 타입을 쓴다' }],
      'prefer-const': 'error',
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'prefer-arrow-callback': 'error',
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
