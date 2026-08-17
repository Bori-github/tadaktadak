module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    appleTeamId: process.env.EXPO_APPLE_TEAM_ID,
  },
});
