import { noise } from './noise';

/** 5분 전구 인접 1분 전구의 최소 각도 오프셋 (도). 미만 시 작은 시계판에서 격자 반올림으로 맞닿음 */
const MIN_DEGREES_FROM_MAJOR_TICK = 1;

const awayFromMajorTick = (tick: number, degrees: number): number => {
  const away = Math.max(Math.abs(degrees), MIN_DEGREES_FROM_MAJOR_TICK);

  if (tick % 5 === 1) return away;
  if (tick % 5 === 4) return -away;

  return degrees;
};

export interface BulbOffset {
  degrees: number;
  /** 반지름 방향 오프셋 (논리 픽셀, 배율 1) */
  distance: number;
}

/**
 * 1분 전구 위치 오프셋. 5분 전구는 0
 *
 * @param tick - 시계판 눈금 번호. 12시 다음이 1
 * @returns 각도 ±1.5도, 반지름 방향 홀수 눈금 +3~7, 짝수 눈금 −3~7
 */
export const bulbOffset = (tick: number): BulbOffset => {
  if (tick % 5 === 0) return { degrees: 0, distance: 0 };

  const direction = tick % 2 === 1 ? 1 : -1;
  const degrees = (noise(tick * 13.1, 3.7) - 0.5) * 3;

  return {
    degrees: awayFromMajorTick(tick, degrees),
    distance: direction * (3 + 4 * noise(tick * 7.3, 11.9)),
  };
};
