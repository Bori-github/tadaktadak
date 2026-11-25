import { useEffect } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

/** 경과 시간 갱신 주기 (밀리초). 갱신마다 Skia `Canvas` 전체를 다시 그리므로 10fps로 제한 */
const BACKDROP_STEP_MS = 100;

/**
 * 배경 연출 경과 시간 (밀리초)
 *
 * @param isAnimating - 연출 진행 여부. 일시정지이거나 화면이 가려지면 `false`
 * @returns `BACKDROP_STEP_MS` 단위로 갱신되는 공유 값. 정지 동안 값 유지
 */
export const useBackdropElapsed = (isAnimating: boolean): SharedValue<number> => {
  const elapsed = useSharedValue(0);
  const total = useSharedValue(0);

  const clock = useFrameCallback((frame) => {
    'worklet';
    total.value += frame.timeSincePreviousFrame ?? 0;

    const stepped = Math.floor(total.value / BACKDROP_STEP_MS) * BACKDROP_STEP_MS;
    if (stepped !== elapsed.value) elapsed.value = stepped;
  }, false);

  useEffect(() => {
    clock.setActive(isAnimating);
  }, [clock, isAnimating]);

  return elapsed;
};
