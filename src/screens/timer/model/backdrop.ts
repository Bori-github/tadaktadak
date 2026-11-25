import { useEffect } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

/** 경과 시간 갱신 주기 (밀리초). 갱신마다 Skia `Canvas` 전체를 다시 그리므로 10fps로 제한 */
const BACKDROP_STEP_MS = 100;
/** 프레임 간격 상한 (밀리초). 백그라운드 복귀 첫 프레임에 백그라운드 시간 전체가 더해져 눈송이가 이동하는 현상 방지 */
const MAX_FRAME_MS = 100;

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
    total.value += Math.min(frame.timeSincePreviousFrame ?? 0, MAX_FRAME_MS);

    const stepped = Math.floor(total.value / BACKDROP_STEP_MS) * BACKDROP_STEP_MS;
    if (stepped !== elapsed.value) elapsed.value = stepped;
  }, false);

  useEffect(() => {
    clock.setActive(isAnimating);
  }, [clock, isAnimating]);

  return elapsed;
};
