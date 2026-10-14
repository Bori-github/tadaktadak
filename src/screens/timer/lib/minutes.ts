import { MINUTE_IN_MS } from '@/entities/timer';

/**
 * 밀리초를 분으로 변환
 *
 * @param ms - 밀리초
 * @returns 0이 하한인 분. 소수 포함
 */
export const millisecondsToMinutes = (ms: number): number => {
  'worklet';
  return Math.max(0, ms / MINUTE_IN_MS);
};
