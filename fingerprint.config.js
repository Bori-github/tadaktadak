module.exports = {
  // fingerprint에 포함되지 않은 경로 추가
  extraSources: [{ type: 'dir', filePath: 'targets', reasons: ['apple-targets'] }],
};
