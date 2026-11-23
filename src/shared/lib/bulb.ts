/** [0, 1) 결정적 의사 난수. 실행마다 동일한 전구 위치 */
const noise = (x: number, y: number): number => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

/** 5분 전구 바로 앞뒤 1분 전구는 5분 전구 반대쪽 각도만 사용. 작은 시계판에서 맞닿음 방지 */
const awayFromMajorTick = (tick: number, degrees: number): number => {
  if (tick % 5 === 1) return Math.abs(degrees);
  if (tick % 5 === 4) return -Math.abs(degrees);

  return degrees;
};

/** 눈금 중심 기준 전구 위치 오프셋 */
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
