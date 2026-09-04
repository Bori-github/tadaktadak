import { type TimerSession } from '@/entities/timer';
import { COLORS } from '@/shared/constants';

/** 불티 하나가 노출될 때의 위치·속도·수명. `DESIGN.md` §9 완료 */
export type Ember = {
  /** 노출 위치 (dot) */
  x: number;
  y: number;
  /** 속도 (dot/frame) */
  velocityX: number;
  velocityY: number;
  lifeMs: number;
};

/** 경과 시간으로 구한 불티 위치와 남은 수명 */
export type EmberState = {
  x: number;
  y: number;
  /** 남은 수명. 1은 노출 시점, 0은 꺼진 시점 */
  life: number;
};

type Spread = { min: number; max: number };

type SpawnInput = {
  /** 시계판 중심 (dot) */
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (dot) */
  radius: number;
  random?: () => number;
};

/** 불티 개수. `DESIGN.md` §9 */
export const EMBER_COUNT = 80;

/** 잔광 반지름 (논리 픽셀, 배율 1)과 알파. 알파에 남은 수명을 곱함. `DESIGN.md` §9 */
export const EMBER_GLOW_RADIUS = 3;
export const EMBER_GLOW_ALPHA = 0.15;

/** 수명이 높은 쪽부터 늘어놓은 불티 색. `DESIGN.md` §9 */
export const EMBER_COLORS = [COLORS.fire.core, COLORS.fire.mid, COLORS.fire.base];

const LIFE_MS = 2800;
const LIFE_SPREAD: Spread = { min: 0.75, max: 1.25 };

/** 마지막 불티의 수명 (밀리초). `DESIGN.md` §9 연출 길이 */
export const EMBER_MAX_LIFE_MS = LIFE_MS * LIFE_SPREAD.max;

type EmberShownInput = {
  session: TimerSession;
  now: number;
};

/**
 * 불티가 노출되는지 여부. `DESIGN.md` §9 완료
 *
 * @param input.session - 지금 타이머 세션
 * @param input.now - 지금 시각 (밀리초)
 * @returns 집중 타이머가 끝나고 불티 수명이 다하기 전이면 `true`
 */
export const isEmberShown = ({ session, now }: EmberShownInput): boolean => {
  if (session.phase === 'completed') return session.mode === 'focus';

  const remaining = emberRemainingMs({ session, now });

  return remaining !== null && remaining > 0;
};

/**
 * 불티가 없어질 때까지 남은 시간 (밀리초). `DESIGN.md` §9 완료
 *
 * @param input.session - 지금 타이머 세션
 * @param input.now - 지금 시각 (밀리초)
 * @returns 휴식 진행에서 남은 시간. 그 밖의 단계에서는 `null`
 */
export const emberRemainingMs = ({ session, now }: EmberShownInput): number | null => {
  if (session.phase !== 'running' || session.mode !== 'rest') return null;

  return Math.max(0, session.startedAt + EMBER_MAX_LIFE_MS - now);
};

const RISE = 0.6;
const RISE_SPREAD: Spread = { min: 0.55, max: 1.45 };

/** 좌우로 흩어지는 폭 (dot/frame). 불티마다 ±0.22 안에서 무작위. `DESIGN.md` §9 */
const DRIFT = 0.22;

/** 시계판 중심에서 멀어지는 쪽으로 더하는 가로 속도 (dot/frame). `DESIGN.md` §9 */
const OUTWARD = 0.1;

/** 불티 감쇠. 프레임마다 속도에 곱함. `DESIGN.md` §9 */
const DAMPING = { rise: 0.994, drift: 0.985 };

/** 속도의 기준이 되는 프레임 길이 (밀리초). `DESIGN.md` §9 */
const FRAME_MS = 16;

/** 불티가 노출되는 위치. 개체 중심 반지름에 곱함. 시안 `design/prototype.html` */
const SPAWN_BAND: Spread = { min: 0.86, max: 1.04 };

const withSpread = (random: () => number, { min, max }: Spread): number => min + random() * (max - min);

/** 프레임마다 `ratio`가 곱해지는 속도로 `frames` 동안 간 거리. 속도 1 기준 */
const damped = (ratio: number, frames: number): number => {
  'worklet';
  return (1 - ratio ** frames) / (1 - ratio);
};

/**
 * 완료에서 개체 둘레에 노출되는 불티. `DESIGN.md` §9 완료
 *
 * @param [input.random] - 0 이상 1 미만의 값. 편차를 고정하려면 넘김
 * @returns 위치·속도·수명에 편차를 적용한 불티 80개
 */
export const spawnEmbers = ({ centerX, centerY, radius, random = Math.random }: SpawnInput): Ember[] =>
  Array.from({ length: EMBER_COUNT }, () => {
    const angle = random() * 2 * Math.PI;
    const distance = radius * withSpread(random, SPAWN_BAND);

    return {
      x: centerX + distance * Math.cos(angle),
      y: centerY + distance * Math.sin(angle),
      velocityX: Math.cos(angle) * OUTWARD + (random() - 0.5) * 2 * DRIFT,
      velocityY: -RISE * withSpread(random, RISE_SPREAD),
      lifeMs: LIFE_MS * withSpread(random, LIFE_SPREAD),
    };
  });

/**
 * 노출 후 `elapsedMs`가 지난 불티. `DESIGN.md` §9 완료
 *
 * @returns 꺼진 뒤에는 남은 수명 0
 */
export const emberAt = (ember: Ember, elapsedMs: number): EmberState => {
  'worklet';
  const frames = elapsedMs / FRAME_MS;

  return {
    x: ember.x + ember.velocityX * damped(DAMPING.drift, frames),
    y: ember.y + ember.velocityY * damped(DAMPING.rise, frames),
    life: Math.max(0, 1 - elapsedMs / ember.lifeMs),
  };
};

/**
 * 남은 수명이 가리키는 `EMBER_COLORS` 위치. `DESIGN.md` §9
 *
 * @returns 수명 0.66 위가 0, 0.33 위가 1, 그 아래가 2
 */
export const emberColorIndex = (life: number): number => {
  'worklet';
  if (life > 0.66) return 0;

  return life > 0.33 ? 1 : 2;
};
