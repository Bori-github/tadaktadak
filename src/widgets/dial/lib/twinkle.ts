import { type TimerMode, type TimerPhase } from '@/entities/timer';
import { SPARK_A, SPARK_B, SPARK_REST } from '@/shared/ui/dot-sprite';

type TwinklingInput = {
  /** 휴식 타이머가 도는 중인지 여부 */
  isResting: boolean;
  phase: TimerPhase;
};

type ThumbGridInput = {
  mode: TimerMode;
  isTwinkling: boolean;
  /** 125밀리초마다 1씩 느는 값. 홀짝이 A와 B를 정함 */
  step: number;
};

/**
 * 손잡이가 반짝이는지 여부. `DESIGN.md` §8 손잡이 색과 움직임
 *
 * @returns 집중 타이머가 도는 동안만 `true`
 */
export const isThumbTwinkling = ({ isResting, phase }: TwinklingInput): boolean => phase === 'running' && !isResting;

/**
 * 손잡이가 이번 프레임에 그릴 도트 격자. `DESIGN.md` §4 손잡이, §8 손잡이 색과 움직임
 *
 * @returns 반짝이지 않는 동안은 A
 */
export const thumbGrid = ({ mode, isTwinkling, step }: ThumbGridInput): readonly string[] => {
  if (mode === 'rest') return SPARK_REST;

  return isTwinkling && step % 2 === 1 ? SPARK_B : SPARK_A;
};
