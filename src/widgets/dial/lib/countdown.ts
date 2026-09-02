import { REST_START_COUNTDOWN_GAP, SMALL_GLYPH_SIZE } from '../config/readout';
import { type TimerMode } from '@/entities/timer';

const SECONDS_IN_MINUTE = 60;

type CountdownInput = {
  mode: TimerMode;
  active: TimerMode;
  minutes: number;
  remainingSeconds: number | null;
};

/**
 * 시계판 숫자 한 줄이 보여 줄 초. `DESIGN.md` §3
 *
 * @param input.mode - 이 줄이 맡은 타이머
 * @param input.active - 카운트다운 중이거나 편집 대상인 쪽
 * @param input.minutes - 이 줄의 설정 시간(분)
 * @param input.remainingSeconds - 카운트다운 중인 남은 시간(초). 대기에서는 `null`
 * @returns 보여 줄 시간(초). 카운트다운 중인 줄은 남은 시간, 나머지는 설정 시간
 */
export const countdownSeconds = ({ mode, active, minutes, remainingSeconds }: CountdownInput): number =>
  mode === active && remainingSeconds !== null ? remainingSeconds : minutes * SECONDS_IN_MINUTE;

type RestStartCountdownCenterInput = {
  centerY: number;
  numeralRadius: number;
  dotSize: number;
};

/**
 * 휴식 시작 전 카운트다운 숫자의 중심 y. `DESIGN.md` §5 배치 순서
 *
 * @param input.centerY - 시계판 중심 y (px)
 * @param input.numeralRadius - 눈금 라벨 중심까지 반지름 (px)
 * @param input.dotSize - 도트 한 변 (px)
 * @returns 0분 눈금 라벨 바깥으로 12 논리 픽셀 띄운 중심 y (px)
 */
export const restStartCountdownCenterY = ({ centerY, numeralRadius, dotSize }: RestStartCountdownCenterInput): number => {
  const halfHeight = (SMALL_GLYPH_SIZE.heightInDots / 2) * dotSize;

  return centerY - (numeralRadius + halfHeight + REST_START_COUNTDOWN_GAP + halfHeight);
};
