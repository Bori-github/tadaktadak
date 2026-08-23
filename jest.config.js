const preset = require('jest-expo/jest-preset');

const [transformAllowList, ...transformRest] = preset.transformIgnorePatterns;

/**
 * Skia의 `main`은 ESM인 `lib/module/index.js`
 * Jest는 `node_modules`를 변환하지 않음. 허용 목록에 없으면 첫 `import`에서 `SyntaxError`
 */
const allowSkia = transformAllowList.replace('))', '|@shopify/react-native-skia))');

// 치환 실패 시 Skia가 허용 목록에서 빠진 채 통과. 증상이 위 `SyntaxError`와 같아 구별되지 않으므로 여기서 먼저 중단
if (allowSkia === transformAllowList) {
  throw new Error('jest-expo의 transformIgnorePatterns에서 `))`을 찾지 못함. 허용 목록 치환 수정 필요');
}

module.exports = {
  ...preset,
  transformIgnorePatterns: [allowSkia, ...transformRest],
  setupFiles: [...preset.setupFiles, '<rootDir>/node_modules/@shopify/react-native-skia/jestSetup.js'],
};
