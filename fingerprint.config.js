module.exports = {
  // fingerprint에 포함되지 않은 경로 추가
  extraSources: [{ type: 'dir', filePath: 'targets', reasons: ['apple-targets'] }],
  // prebuild 생성물이라 실행 여부에 따라 해시가 달라지므로 gitignore와 동일한 경로 추가
  ignorePaths: ['targets/*/Assets.xcassets/**'],
};
