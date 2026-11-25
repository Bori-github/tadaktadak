import { useEffect } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * 배경 연출 경과 시간 (밀리초). 프레임마다 갱신
 *
 * @param isPaused - 타이머 일시정지 여부
 * @returns 경과 시간 공유 값. 일시정지 동안 값 유지
 */
export const useBackdropElapsed = (isPaused: boolean): SharedValue<number> => {
  const elapsed = useSharedValue(0);

  const clock = useFrameCallback((frame) => {
    'worklet';
    elapsed.value += frame.timeSincePreviousFrame ?? 0;
  }, false);

  useEffect(() => {
    clock.setActive(!isPaused);
  }, [clock, isPaused]);

  return elapsed;
};
