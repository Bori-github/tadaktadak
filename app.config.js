module.exports = ({ config }) => ({
  ...config,
  version: require('./package.json').version,
  ios: {
    ...config.ios,
    appleTeamId: process.env.EXPO_APPLE_TEAM_ID,
  },
});
