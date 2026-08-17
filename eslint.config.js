const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const fsd = require('eslint-plugin-fsd-lint');

const fsdLayers = { layers: { pages: { pattern: 'screens' } } };

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    ignores: ['ios/', 'android/', 'targets/*/Assets.xcassets/', 'node_modules/'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { fsd },
    rules: {
      'fsd/forbidden-imports': ['error', fsdLayers],
      'fsd/no-cross-slice-dependency': ['error', fsdLayers],
      'fsd/no-public-api-sidestep': ['error', { publicApi: { allowSegmentImports: true, enforceShared: true } }],
      'fsd/no-relative-imports': ['error', { ...fsdLayers, allowSameSlice: true }],
      'fsd/ordered-imports': ['error', fsdLayers],
    },
  },
];
