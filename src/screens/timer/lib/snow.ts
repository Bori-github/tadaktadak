import { noise } from '@/shared/lib';

export const FLAKE_COUNT = 48;
/** 화면 상하단 바깥 여백 (배율 1) */
const FLAKE_MARGIN = 8;
const BIG_FLAKE_RATIO = 0.2;
const BIG_FLAKE_SPEED_RATIO = 1.4;

export interface Flake {
  /** 초기 좌표 (px) */
  x: number;
  y: number;
  /** 낙하 속도 (px/초) */
  speed: number;
  /** x 진폭 (px), 각진동수 (rad/초), 위상 (rad) */
  amplitude: number;
  frequency: number;
  phase: number;
  /** y 순환 주기 (px). 화면 높이 + 상하단 여백 */
  fallHeight: number;
  margin: number;
  /** 2×2 도트 여부 */
  isBig: boolean;
  alpha: number;
}

type FlakeInput = {
  width: number;
  height: number;
  scale: number;
};

/**
 * 눈송이 목록
 *
 * @param input - 화면 크기
 * @param input.width - 화면 너비 (px)
 * @param input.height - 화면 높이 (px)
 * @param input.scale - 배율
 * @returns `FLAKE_COUNT`개. 같은 입력에 같은 결과
 */
export const createFlakes = ({ width, height, scale }: FlakeInput): Flake[] => {
  const margin = FLAKE_MARGIN * scale;
  const fallHeight = height + margin * 2;

  return Array.from({ length: FLAKE_COUNT }, (_, index) => {
    const isBig = noise(index, 4.9) < BIG_FLAKE_RATIO;

    return {
      x: noise(index, 1.3) * width,
      y: noise(index, 2.7) * fallHeight,
      speed: (8 + noise(index, 3.1) * 10) * scale * (isBig ? BIG_FLAKE_SPEED_RATIO : 1),
      amplitude: (3 + noise(index, 6.1) * 6) * scale,
      frequency: 0.3 + noise(index, 7.7) * 0.5,
      phase: index,
      fallHeight,
      margin,
      isBig,
      alpha: 0.3 + noise(index, 5.3) * 0.4,
    };
  });
};

/**
 * 경과 시간 기준 눈송이 좌표
 *
 * @param flake - `createFlakes` 결과의 항목
 * @param seconds - 경과 시간 (초)
 * @returns 도트 격자 스냅 전 좌표 (px). y는 `fallHeight` 주기로 순환
 */
export const flakePosition = (flake: Flake, seconds: number): { x: number; y: number } => {
  'worklet';
  return {
    x: flake.x + flake.amplitude * Math.sin(seconds * flake.frequency + flake.phase),
    y: ((flake.y + seconds * flake.speed) % flake.fallHeight) - flake.margin,
  };
};
