module.exports = ({ config }) => ({
  ...config,
  // Release Please가 app.json을 수정하면서 서식이 함께 변경됨. 버전은 package.json에서 읽도록 처리
  version: require('./package.json').version,
  ios: {
    ...config.ios,
    appleTeamId: process.env.EXPO_APPLE_TEAM_ID,
  },
});
