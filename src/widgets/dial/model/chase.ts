import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { useCompletedEffectElapsed } from './ember';
import { TICK_NUMBERS } from '../config/ticks';
import { chaseBoost } from '../lib/chase';

/**
 * 완료 연출 중 눈금별 추가 밝기. 프레임마다 갱신
 *
 * @param settingMinutes - 순환 대상 전구 수
 * @param effectStartedAt - 완료 연출 시작 시각 (밀리초). `null`이면 갱신 정지
 * @returns `TICK_NUMBERS` 순서의 추가 밝기. 설정 시간 밖 눈금은 0
 */
export const useChaseBoosts = (settingMinutes: number, effectStartedAt: number | null): SharedValue<number[]> => {
  const elapsed = useCompletedEffectElapsed(effectStartedAt);

  return useDerivedValue(() => TICK_NUMBERS.map((tick) => (tick > settingMinutes ? 0 : chaseBoost({ tick, elapsedMs: elapsed.value, settingMinutes }))));
};
