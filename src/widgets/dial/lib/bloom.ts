import { TICKS } from '../config/ticks';
import { DOT_SIZE } from '@/shared/constants';

/** 중앙 빛 번짐 반지름. 개체 반지름에 곱함. `DESIGN.md` §6 */
export const CENTER_BLOOM_RATIO = 0.95;

/** 빛 번짐 반지름 (논리 픽셀, 배율 1). `DESIGN.md` §6 */
export const BLOOM_RADIUS = { bonfire: 32, log: 16 };

/** 빛 번짐 알파. `DESIGN.md` §6 */
export const BLOOM_ALPHA = { bonfire: 0.55, log: 0.32 };

type BloomRadiusInput = {
  tick: number;
  isMajorTick: boolean;
  progress: number;
  step: number;
  dotSize: number;
};

/**
 * 눈금 하나의 빛 번짐 반지름 (px). `DESIGN.md` §6
 *
 * @param input.tick - 시계판 눈금 번호. 12시 다음이 1
 * @param input.isMajorTick - 모닥불이 놓인 5분 배수 눈금인지 여부
 * @param input.progress - 불이 붙은 정도. 0은 꺼짐, 1은 다 붙음
 * @param input.step - 불꽃 프레임 순서. 눈금마다 세 단계로 어긋난 깜빡임을 만듦
 * @param input.dotSize - 도트 한 변 (px)
 * @returns 붙은 정도와 깜빡임과 배율을 곱한 반지름
 */
export const bloomRadius = ({ tick, isMajorTick, progress, step, dotSize }: BloomRadiusInput): number => {
  const base = isMajorTick ? BLOOM_RADIUS.bonfire : BLOOM_RADIUS.log;
  const flicker = 0.9 + 0.1 * ((tick + step) % 3);

  return base * (0.55 + 0.45 * progress) * flicker * (dotSize / DOT_SIZE);
};

/**
 * 시계판 가운데 빛 번짐의 알파. `DESIGN.md` §6
 *
 * @param litCount - 다 붙은 눈금 수
 * @returns 60칸을 다 채웠을 때 0.34, 하나도 붙지 않았을 때 0.04
 */
export const centerBloomAlpha = (litCount: number): number => 0.3 * Math.min(litCount / TICKS, 1) + 0.04;
