const REQUIRED_PRODUCTION_ENV = [
  'EXPO_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'ADMOB_IOS_APP_ID',
  'ADMOB_ANDROID_APP_ID',
  'EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID',
  'EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID',
];

const ADMOB_PLUGIN = 'react-native-google-mobile-ads';

// 환경 변수가 없는 빌드에서 App ID 누락으로 SDK가 크래시하지 않도록 Google 샘플 App ID로 대체
const ADMOB_SAMPLE_APP_ID = {
  ios: 'ca-app-pub-3940256099942544~1458002511',
  android: 'ca-app-pub-3940256099942544~3347511713',
};

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
  plugins: config.plugins.map((plugin) =>
    Array.isArray(plugin) && plugin[0] === ADMOB_PLUGIN
      ? [
          ADMOB_PLUGIN,
          {
            ...plugin[1],
            iosAppId: process.env.ADMOB_IOS_APP_ID ?? ADMOB_SAMPLE_APP_ID.ios,
            androidAppId: process.env.ADMOB_ANDROID_APP_ID ?? ADMOB_SAMPLE_APP_ID.android,
          },
        ]
      : plugin,
  ),
});
