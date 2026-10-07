import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';

import { ENV } from '@/shared/constants';

Sentry.init({
  dsn: ENV.SENTRY_DSN,
  enabled: Updates.channel === 'production',
});
