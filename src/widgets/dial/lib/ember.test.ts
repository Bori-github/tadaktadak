import { describe, expect, it } from '@jest/globals';

import { EMBER_COLORS, EMBER_COUNT, emberAt, emberRemainingMs, emberColorIndex, isEmberShown, spawnEmbers, type Ember } from './ember';

import { MINUTE_IN_MS, NOW, pauseTimer, READY_SESSION, resumeTimer, type RunningSession, type TimerSession } from '@/entities/timer';
import { COLORS } from '@/shared/constants';

const embers = (random?: () => number) => spawnEmbers({ centerX: 100, centerY: 100, radius: 76.5, random });

/** 12시에서 초당 한 도트로 곧게 오르는 불티. 수명은 2.8초 */
const rising: Ember = { x: 0, y: 0, velocityX: 0, velocityY: -1, lifeMs: 2800 };

const REST_MS = 5 * MINUTE_IN_MS;

const resting: RunningSession = { phase: 'running', mode: 'rest', startedAt: NOW, endsAt: NOW + REST_MS };
const focusCompleted: TimerSession = { phase: 'completed', mode: 'focus', completedAt: NOW };

describe('불티 생성', () => {
  it('80개를 만든다', () => {
    expect(embers()).toHaveLength(EMBER_COUNT);
  });

  it.each([
    { label: '가장 짧은', value: 0, expected: 2100 },
    { label: '가장 긴', value: 1, expected: 3500 },
  ])('$label 수명은 $expected밀리초다', ({ value, expected }) => {
    expect(embers(() => value)[0]?.lifeMs).toBeCloseTo(expected, 10);
  });

  it.each([
    { label: '가장 느린', value: 0, expected: -0.33 },
    { label: '가장 빠른', value: 1, expected: -0.87 },
  ])('$label 상승 속도는 $expected 도트/프레임이다', ({ value, expected }) => {
    expect(embers(() => value)[0]?.velocityY).toBeCloseTo(expected, 10);
  });

  it.each([
    { label: '왼쪽 끝', value: 0, expected: -0.12 },
    { label: '오른쪽 끝', value: 1, expected: 0.32 },
  ])('3시 방향 불티의 $label 가로 속도는 $expected 도트/프레임이다', ({ value, expected }) => {
    expect(embers(() => value)[0]?.velocityX).toBeCloseTo(expected, 10);
  });

  it.each([
    { label: '가장 안쪽', value: 0, expected: 165.79 },
    { label: '가장 바깥', value: 1, expected: 179.56 },
  ])('$label 불티는 개체 반지름 76.5인 시계판에서 x $expected에 나온다', ({ value, expected }) => {
    expect(embers(() => value)[0]?.x).toBeCloseTo(expected, 10);
  });
});

describe('불티 위치', () => {
  it('첫 프레임에는 속도만큼 간다', () => {
    expect(emberAt(rising, 16).y).toBeCloseTo(-1, 10);
  });

  it('두 번째 프레임에는 세로 속도가 0.994로 줄어 1.994까지 간다', () => {
    expect(emberAt(rising, 32).y).toBeCloseTo(-1.994, 10);
  });

  it('가로 속도는 0.985로 더 빨리 줄어든다', () => {
    expect(emberAt({ ...rising, velocityX: 1, velocityY: 0 }, 32).x).toBeCloseTo(1.985, 10);
  });
});

describe('불티 수명', () => {
  it.each([
    [0, 1],
    [1400, 0.5],
    [2800, 0],
    [3200, 0],
  ])('노출 후 %i밀리초에 남은 수명은 %s다', (elapsedMs, expected) => {
    expect(emberAt(rising, elapsedMs).life).toBeCloseTo(expected, 10);
  });
});

describe('불티가 노출되는 동안', () => {
  const shown = (session: TimerSession, now: number) => isEmberShown({ session, now });

  it.each([
    { label: '노출된다', elapsedMs: 3499, expected: true },
    { label: '노출되지 않는다', elapsedMs: 3500, expected: false },
  ])('휴식이 시작되고 $elapsedMs밀리초에 $label', ({ elapsedMs, expected }) => {
    expect(shown(resting, NOW + elapsedMs)).toBe(expected);
  });

  it.each([
    { label: '노출된다', elapsedMs: 3499, expected: true },
    { label: '노출되지 않는다', elapsedMs: 3500, expected: false },
  ])('집중이 끝나고 $elapsedMs밀리초에 $label', ({ elapsedMs, expected }) => {
    expect(shown(focusCompleted, NOW + elapsedMs)).toBe(expected);
  });

  it('휴식 시작 1초 뒤에 멈췄다 한 시간 뒤에 재개해도 노출되지 않는다', () => {
    const stopped = pauseTimer({ session: resting, now: NOW + 1000 });
    const resumedAt = NOW + 60 * MINUTE_IN_MS;

    expect(shown(resumeTimer({ session: stopped, now: resumedAt }), resumedAt)).toBe(false);
  });

  it.each([
    { label: '휴식 완료', session: { phase: 'completed', mode: 'rest', completedAt: NOW } },
    { label: '집중 진행', session: { phase: 'running', mode: 'focus', startedAt: NOW, endsAt: NOW + 25 * MINUTE_IN_MS } },
    { label: '휴식 일시정지', session: { phase: 'paused', mode: 'rest', startedAt: NOW - MINUTE_IN_MS, pausedRemainingMs: 4 * MINUTE_IN_MS } },
    { label: '집중 대기', session: READY_SESSION },
  ] as { label: string; session: TimerSession }[])('$label에서는 노출되지 않는다', ({ session }) => {
    expect(shown(session, NOW)).toBe(false);
  });
});

describe('불티가 없어질 때까지', () => {
  const remaining = (now: number) => emberRemainingMs({ session: resting, now });

  it.each([
    { elapsedMs: 0, expected: 3500 },
    { elapsedMs: 3499, expected: 1 },
    { elapsedMs: 3500, expected: 0 },
    { elapsedMs: 4000, expected: 0 },
  ])('휴식이 시작되고 $elapsedMs밀리초에 $expected밀리초 남는다', ({ elapsedMs, expected }) => {
    expect(remaining(NOW + elapsedMs)).toBe(expected);
  });

  it.each([
    { elapsedMs: 0, expected: 3500 },
    { elapsedMs: 3499, expected: 1 },
    { elapsedMs: 3500, expected: 0 },
    { elapsedMs: 4000, expected: 0 },
  ])('집중이 끝나고 $elapsedMs밀리초에 $expected밀리초 남는다', ({ elapsedMs, expected }) => {
    expect(emberRemainingMs({ session: focusCompleted, now: NOW + elapsedMs })).toBe(expected);
  });
});

describe('불티 색', () => {
  it.each([
    [1, COLORS.fire.core],
    [0.67, COLORS.fire.core],
    [0.66, COLORS.fire.mid],
    [0.34, COLORS.fire.mid],
    [0.33, COLORS.fire.base],
    [0, COLORS.fire.base],
  ])('남은 수명 %s일 때 %s다', (life, expected) => {
    expect(EMBER_COLORS[emberColorIndex(life)]).toBe(expected);
  });
});
