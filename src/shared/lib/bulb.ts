import { noise } from './noise';
import { DOT_SIZE } from '@/shared/constants';

/** 5분 전구 인접 1분 전구의 최소 각도 오프셋 (도). 미만 시 작은 시계판에서 격자 반올림으로 맞닿음 */
const MIN_DEGREES_FROM_MAJOR_TICK = 1;

const awayFromMajorTick = (tick: number, degrees: number): number => {
  const away = Math.max(Math.abs(degrees), MIN_DEGREES_FROM_MAJOR_TICK);

  if (tick % 5 === 1) return away;
  if (tick % 5 === 4) return -away;

  return degrees;
};

interface BulbOffset {
  degrees: number;
  /** 반지름 방향 오프셋 (논리 픽셀, 배율 1) */
  distance: number;
}

/** 각도 ±1.5도, 반지름 방향 홀수 눈금 +3~7, 짝수 눈금 −3~7. 5분 전구는 0 */
const bulbOffset = (tick: number): BulbOffset => {
  if (tick % 5 === 0) return { degrees: 0, distance: 0 };

  const direction = tick % 2 === 1 ? 1 : -1;
  const degrees = (noise(tick * 13.1, 3.7) - 0.5) * 3;

  return {
    degrees: awayFromMajorTick(tick, degrees),
    distance: direction * (3 + 4 * noise(tick * 7.3, 11.9)),
  };
};

export interface DialPlacement {
  /** 시계판 중심 (px) */
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  /** 도트 한 변 (px) */
  dotSize: number;
}

/**
 * 전구 중심. 눈금 중심에서 1분 전구만 흩뜨림
 *
 * @param tick - 시계판 눈금 번호. 12시 다음이 1
 * @param dial - 시계판 위치와 도트 크기
 * @returns 전구 중심 좌표 (px)
 */
export const bulbCenter = (tick: number, { centerX, centerY, radius, dotSize }: DialPlacement): { x: number; y: number } => {
  const { degrees, distance } = bulbOffset(tick);
  const bulbRadius = radius + (distance * dotSize) / DOT_SIZE;
  const radians = (((tick - 0.5) * 6 + degrees) * Math.PI) / 180;

  return { x: centerX + bulbRadius * Math.sin(radians), y: centerY - bulbRadius * Math.cos(radians) };
};
