/**
 * 밀리초를 초로 변환
 *
 * @param ms - 밀리초
 * @returns 0이 하한이고 올림한 초
 */
export const millisecondsToSeconds = (ms: number): number => {
  'worklet';
  return Math.max(0, Math.ceil(ms / 1000));
};
