import { NativeModule, requireOptionalNativeModule } from 'expo';

/** 타이머 모드. `src/entities/timer`의 `TimerMode`와 같은 값 */
export type LiveActivityMode = 'focus' | 'rest';

export type LiveActivityContent = {
  mode: LiveActivityMode;
  /** 진행 막대가 0%인 시각. `endsAt - 타이머 시간` (밀리초) */
  progressStartsAt: number;
  /** 타이머가 끝날 시각(밀리초). 이 시각이 지나면 iOS가 Live Activity를 흐리게 그림 */
  endsAt: number;
};

declare class LiveActivityModule extends NativeModule {
  /** 위젯 타겟 배포 버전인 iOS 18 이상인지 */
  isSupported: boolean;
  /** 설정 › 앱 › 타닥 › 실시간 현황 스위치 */
  isEnabled: boolean;
  /** Live Activity가 없으면 시작하고, 있으면 이 값으로 갱신 */
  startAsync(content: LiveActivityContent): Promise<void>;
  /** 남아 있는 Live Activity를 모두 즉시 종료 */
  endAsync(): Promise<void>;
}

export const liveActivity = requireOptionalNativeModule<LiveActivityModule>('LiveActivity');
