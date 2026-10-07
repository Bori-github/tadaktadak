import * as Sentry from '@sentry/react-native';
import { registerRootComponent } from 'expo';

// App 모듈 평가 전 Sentry 초기화를 위해 먼저 import
import './src/app/sentry';
import { App } from './src/app/App';

registerRootComponent(Sentry.wrap(App));
