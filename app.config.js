const REQUIRED_PRODUCTION_ENV = ['EXPO_PUBLIC_SENTRY_DSN', 'SENTRY_AUTH_TOKEN'];

const missingEnv = REQUIRED_PRODUCTION_ENV.filter((key) => !process.env[key]);
if (process.env.EAS_BUILD_PROFILE === 'production' && missingEnv.length > 0) {
  throw new Error(`Missing in the EAS production environment: ${missingEnv.join(', ')}`);
}

module.exports = ({ config }) => ({
  ...config,
  version: require('./package.json').version,
  ios: {
    ...config.ios,
    appleTeamId: process.env.EXPO_APPLE_TEAM_ID,
  },
});
