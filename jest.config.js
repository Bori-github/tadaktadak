const preset = require('jest-expo/jest-preset');

const [transformAllowList, ...transformRest] = preset.transformIgnorePatterns;

module.exports = {
  ...preset,
  /**
   * Skia의 `main`은 ESM인 `lib/module/index.js`
   * Jest는 `node_modules`를 변환하지 않음. 허용 목록에 없으면 첫 `import`에서 `SyntaxError`
   */
  transformIgnorePatterns: [transformAllowList.replace('))', '|@shopify/react-native-skia))'), ...transformRest],
  setupFiles: [...preset.setupFiles, '<rootDir>/node_modules/@shopify/react-native-skia/jestSetup.js'],
};
