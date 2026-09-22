import { Easing } from 'react-native-reanimated';

import { COLORS } from '@/shared/constants';

/** 토글 왼쪽 위 기준 불티 위치 `[column, row]` (dot). 음수 row는 토글 위쪽 */
type EmberPoint = readonly [number, number];

type EmberSegment = {
  durationMs: number;
  easing: (progress: number) => number;
  from: readonly EmberPoint[];
  to: readonly EmberPoint[];
  color: string;
};

/** 불티 1개의 위치와 색. 불티 미표시 구간은 `null` */
export type EmberFrame = { column: number; row: number; color: string } | null;

/** 불티 최대 상승 높이 (dot) */
export const EMBER_RISE_IN_DOTS = 10;

// 피그마 프로토타입 이징. CSS `ease-out`과 같은 곡선
export const EASE_OUT = Easing.bezierFn(0, 0, 0.58, 1);

// 피그마 `toggle-ember`의 `state=on-1`·`on-2`·`on` 불티 좌표
const ON_START: readonly EmberPoint[] = [
  [10, 5],
  [11, 4],
  [12, 5],
  [13, 6],
  [9, 6],
  [12, 3],
  [10, 3],
  [11, 6],
];
const ON_MIDDLE: readonly EmberPoint[] = [
  [6, 0],
  [9, -3],
  [14, -2],
  [17, 1],
  [4, 3],
  [13, -4],
  [10, -5],
  [11, -1],
];
const ON_END: readonly EmberPoint[] = [
  [3, -4],
  [7, -8],
  [16, -7],
  [20, -3],
  [1, 0],
  [14, -9],
  [9, -10],
  [11, -6],
];

// 피그마 `toggle-ember`의 `state=off-1`·`off` 불티 좌표
const OFF_START: readonly EmberPoint[] = [
  [10, 5],
  [11, 4],
  [12, 5],
  [11, 6],
];
const OFF_END: readonly EmberPoint[] = [
  [7, 1],
  [10, -2],
  [14, 0],
  [12, -1],
];

/** 켜짐 전환 구간. 첫 구간 시간 = 손잡이 이동 시간 */
export const TURN_ON: readonly EmberSegment[] = [
  { durationMs: 150, easing: EASE_OUT, from: ON_START, to: ON_START, color: COLORS.fire.core },
  // 피그마 ease-out·ease-in 연결은 구간 경계 속도가 0이라 불티가 정지해 두 구간 모두 linear 적용
  { durationMs: 300, easing: Easing.linear, from: ON_START, to: ON_MIDDLE, color: COLORS.fire.mid },
  { durationMs: 400, easing: Easing.linear, from: ON_MIDDLE, to: ON_END, color: COLORS.fire.base },
];

/** 꺼짐 전환 구간. 첫 구간 시간 = 손잡이 이동 시간 */
export const TURN_OFF: readonly EmberSegment[] = [
  { durationMs: 150, easing: EASE_OUT, from: OFF_START, to: OFF_START, color: COLORS.fire.base },
  { durationMs: 300, easing: EASE_OUT, from: OFF_START, to: OFF_END, color: COLORS.fire.base },
];

/**
 * @returns 구간 시간의 합 (밀리초)
 */
export const totalDurationMs = (segments: readonly EmberSegment[]): number => segments.reduce((sum, segment) => sum + segment.durationMs, 0);

/**
 * 경과 시간 기준 불티 1개의 위치와 색. 위치는 도트 격자에 스냅, 색은 구간 내 고정
 *
 * @param segments - `TURN_ON` 또는 `TURN_OFF`
 * @param index - 불티 번호
 * @param elapsedMs - 첫 구간 시작 기준 경과 시간 (밀리초)
 * @returns 불티 위치와 색. 마지막 구간 종료 후이거나 해당 번호 불티를 쓰지 않는 구간이면 `null`
 */
export const emberAt = (segments: readonly EmberSegment[], index: number, elapsedMs: number): EmberFrame => {
  'worklet';
  let segmentStartMs = 0;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (segment === undefined) return null;

    if (elapsedMs < segmentStartMs + segment.durationMs) {
      const from = segment.from[index];
      const to = segment.to[index];
      if (from === undefined || to === undefined) return null;

      const progress = segment.easing((elapsedMs - segmentStartMs) / segment.durationMs);

      return {
        column: Math.round(from[0] + (to[0] - from[0]) * progress),
        row: Math.round(from[1] + (to[1] - from[1]) * progress),
        color: segment.color,
      };
    }

    segmentStartMs += segment.durationMs;
  }

  return null;
};
