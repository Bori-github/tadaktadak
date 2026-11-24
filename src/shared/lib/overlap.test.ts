import { describe, expect, it } from '@jest/globals';

import { BUTTON_SIZE_IN_DOTS, type MajorItemHeightInDots } from '@/shared/constants';
import {
  BONFIRE_COLD_7,
  BONFIRE_COLD_9,
  BONFIRE_HOT_A_7,
  BONFIRE_HOT_A_9,
  BONFIRE_HOT_B_7,
  BONFIRE_HOT_B_9,
  BULB_BIG_OFF,
  BULB_OFF,
  LOG_COLD,
  LOG_HOT_A,
  LOG_HOT_B,
} from '@/shared/ui/dot-sprite';

import { bulbCenter } from './bulb';
import { DEVICE_NAMES, DEVICES, type DeviceName } from './devices';
import { topLeftOnGrid } from './grid';
import { MIN_ITEM_RADIUS, resolveLayout, type FormFactor } from './responsive';

/** 최대 투영 `max(폭, 높이)` (dot). 프레임 중 가장 큰 값. `DESIGN.md` §4 */
const maxProjection = (frames: string[][]) => Math.max(...frames.map((rows) => Math.max(rows.length, ...rows.map((row) => row.length))));

const LOG_PROJECTION = maxProjection([LOG_COLD, LOG_HOT_A, LOG_HOT_B]);
const BONFIRE_PROJECTION: Record<MajorItemHeightInDots, number> = {
  7: maxProjection([BONFIRE_COLD_7, BONFIRE_HOT_A_7, BONFIRE_HOT_B_7]),
  9: maxProjection([BONFIRE_COLD_9, BONFIRE_HOT_A_9, BONFIRE_HOT_B_9]),
};

type ItemKind = 'log' | 'bonfire';

const projectionOf = (kind: ItemKind, majorItemHeightInDots: MajorItemHeightInDots) => (kind === 'log' ? LOG_PROJECTION : BONFIRE_PROJECTION[majorItemHeightInDots]);

/** 모닥불 사이 눈금 수. 5분 배수 눈금에만 있음 */
const BONFIRE_TICK_DISTANCE = 5;

/** 1분 간격이 필요 간격과 정확히 같은 경계에서 부동소수점 오차로 음수가 되는 것을 허용하는 범위 */
const FLOAT_TOLERANCE = 1e-9;

/** 개체 높이 (dot). `DESIGN.md` §4 */
const HEIGHT = { bonfire: 9, thumb: 7, numeral: 7, button: BUTTON_SIZE_IN_DOTS };

// 큰 짧은 변에서도 세로 배치를 유지하려고 safe area 아래 끝을 짧은 변의 2배 이상으로 설정
const layout = (shortSide: number) => resolveLayout({ shortSide, safeAreaTopEdge: 47, safeAreaBottomEdge: Math.max(810, shortSide * 2) });

/** 1분 간격 (dot). 원주를 60으로 나눈 길이를 도트 크기로 나눔. `DESIGN.md` §7 계산 순서 7 */
const minuteGap = ({ itemRadius, dotSize }: { itemRadius: number; dotSize: number }) => (2 * Math.PI * itemRadius) / 60 / dotSize;

const needed = (a: number, b: number) => (a + b) / 2;

const round = (value: number) => Math.round(value * 100) / 100;

describe('1분 간격', () => {
  it('기준 화면 390에서 반지름 153의 원주를 60으로 나눈 8.01 도트다', () => {
    expect(round(minuteGap(layout(390)))).toBe(8.01);
  });
});

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, index) => start + index);

const LANDSCAPE_WIDTHS = [667, 844, 932];
const PORTRAIT_WIDTHS = [320, 360, 375, 390, 430];

/** 기기 목록과 safe area 높이를 1씩 바꾼 창. 높이가 낮은 창은 반지름이 하한 118.1과 모닥불 크기 경계 124.1을 지남 */
const LAYOUT_CASES = [
  ...DEVICE_NAMES.map((name) => {
    const { shortSide, topEdge, bottomEdge, formFactor } = DEVICES[name];
    return { label: name, input: { shortSide, safeAreaTopEdge: topEdge, safeAreaBottomEdge: bottomEdge, formFactor } };
  }),
  ...range(250, 500).flatMap((height) =>
    LANDSCAPE_WIDTHS.map((width) => ({
      label: `가로 ${width}×${height}`,
      input: { shortSide: height, safeAreaTopEdge: 0, safeAreaBottomEdge: height, safeAreaLeftEdge: 0, safeAreaRightEdge: width },
    })),
  ),
  ...range(250, 1400).flatMap((height) =>
    PORTRAIT_WIDTHS.map((width) => ({
      label: `세로 ${width}×${height}`,
      input: { shortSide: Math.min(width, height), safeAreaTopEdge: 0, safeAreaBottomEdge: height, safeAreaLeftEdge: 0, safeAreaRightEdge: width },
    })),
  ),
];

// 버튼 회피로 하한보다 작아진 창은 겹침이 있으므로 검사 제외
// 버튼과 떨어진 창의 하한 유지는 `responsive.test.ts`가 검사
const CHECKED_LAYOUTS = LAYOUT_CASES.map(({ label, input }) => ({ label, ...resolveLayout(input) })).filter(
  ({ itemRadius, scale }) => itemRadius / scale >= MIN_ITEM_RADIUS - FLOAT_TOLERANCE,
);

/** 여유가 0 미만인 화면 목록 */
const overlappingLayouts = (tickDistance: number, first: ItemKind, second: ItemKind) =>
  CHECKED_LAYOUTS.flatMap((checked) => {
    const { label, majorItemHeightInDots } = checked;
    const margin = minuteGap(checked) * tickDistance - needed(projectionOf(first, majorItemHeightInDots), projectionOf(second, majorItemHeightInDots));
    return margin < -FLOAT_TOLERANCE ? [`${label}: 여유 ${round(margin)}`] : [];
  });

describe('원주 방향으로 이웃한 개체', () => {
  // 모닥불 + 기준 표식은 12시에서 반 눈금만 떨어져 겹치므로 검사 제외. `DESIGN.md` §5
  it('장작과 장작이 겹치지 않는다', () => {
    expect(overlappingLayouts(1, 'log', 'log')).toEqual([]);
  });

  it('모닥불과 장작이 겹치지 않는다', () => {
    expect(overlappingLayouts(1, 'bonfire', 'log')).toEqual([]);
  });

  it('모닥불과 모닥불이 겹치지 않는다', () => {
    expect(overlappingLayouts(BONFIRE_TICK_DISTANCE, 'bonfire', 'bonfire')).toEqual([]);
  });
});

type BulbLayout = { itemRadius: number; dotSize: number; dialCenterX: number; dialCenterY: number };

const bulbDots = (tick: number, { itemRadius, dotSize, dialCenterX, dialCenterY }: BulbLayout) => {
  const grid = tick % 5 === 0 ? BULB_BIG_OFF : BULB_OFF;
  const center = bulbCenter(tick, { centerX: dialCenterX, centerY: dialCenterY, radius: itemRadius, dotSize });
  const { left, top } = topLeftOnGrid({
    centerX: center.x,
    centerY: center.y,
    widthInDots: Math.max(...grid.map((row) => row.length)),
    heightInDots: grid.length,
    dotSize,
  });

  return grid.flatMap((row, y) => [...row].flatMap((cell, x) => (cell === '.' ? [] : [{ x: left + x, y: top + y }])));
};

const isTouching = (first: { x: number; y: number }[], second: { x: number; y: number }[]) => {
  const [a0, b0] = [first[0], second[0]];
  // 첫 도트 간 거리 9 초과 시 접촉 불가로 비교 생략. 전구 최대 5×7
  if (!a0 || !b0 || Math.abs(a0.x - b0.x) > 9 || Math.abs(a0.y - b0.y) > 9) return false;

  return first.some((a) => second.some((b) => Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1));
};

const bulbLayoutKey = ({ itemRadius, dotSize, dialCenterX, dialCenterY }: BulbLayout) => [itemRadius, dotSize, dialCenterX % dotSize, dialCenterY % dotSize].join('/');

const BULB_DOTS_BY_LAYOUT = [...new Map(CHECKED_LAYOUTS.map((checked) => [bulbLayoutKey(checked), checked])).values()].map((checked) => ({
  label: checked.label,
  dots: range(1, 60).map((tick) => bulbDots(tick, checked)),
}));

const touchingBulbs = (pairs: [number, number][]) =>
  BULB_DOTS_BY_LAYOUT.flatMap(({ label, dots }) =>
    pairs.flatMap(([first, second]) => (isTouching(dots[first - 1] ?? [], dots[second - 1] ?? []) ? [`${label}: 눈금 ${first}, ${second}`] : [])),
  );

const TICK_PAIRS = range(1, 60).map((tick): [number, number] => [tick, (tick % 60) + 1]);
const isMajor = (tick: number) => tick % 5 === 0;

describe('원주 방향으로 이웃한 전구', () => {
  it('1분 전구와 1분 전구 사이가 1 도트 이상 떨어진다', () => {
    expect(touchingBulbs(TICK_PAIRS.filter(([first, second]) => !isMajor(first) && !isMajor(second)))).toEqual([]);
  });

  it('5분 전구와 1분 전구 사이가 1 도트 이상 떨어진다', () => {
    expect(touchingBulbs(TICK_PAIRS.filter(([first, second]) => isMajor(first) !== isMajor(second)))).toEqual([]);
  });

  it('5분 전구와 5분 전구 사이가 1 도트 이상 떨어진다', () => {
    const majorPairs = range(1, 12).map((index): [number, number] => [index * 5, (index % 12) * 5 + 5]);
    expect(touchingBulbs(majorPairs)).toEqual([]);
  });
});

describe('기준 화면의 반지름 방향 간격', () => {
  const { arcRadius, itemRadius, numeralRadius, dialCenterY, buttonCenterY, dotSize } = layout(390);
  const half = (heightInDots: number) => (heightInDots * dotSize) / 2;

  it('손잡이 바깥 138과 개체 안쪽 144가 6 논리 픽셀 떨어진다', () => {
    expect(itemRadius - half(HEIGHT.bonfire) - (arcRadius + half(HEIGHT.thumb))).toBe(6);
  });

  it('개체 바깥 162와 눈금 숫자 안쪽 168이 6 논리 픽셀 떨어진다', () => {
    expect(numeralRadius - half(HEIGHT.numeral) - (itemRadius + half(HEIGHT.bonfire))).toBe(6);
  });

  it('눈금 숫자 바깥 542와 버튼 위 632가 90 논리 픽셀 떨어진다', () => {
    expect(buttonCenterY - half(HEIGHT.button) - (dialCenterY + numeralRadius + half(HEIGHT.numeral))).toBe(90);
  });

  it('버튼 아래 688과 safe area 아래 끝 810이 122 논리 픽셀 떨어진다', () => {
    expect(810 - (buttonCenterY + half(HEIGHT.button))).toBe(122);
  });
});

describe('시계판 아래 끝과 버튼 위 끝은 배율과 무관하게 90 떨어진다', () => {
  const gapOn = (shortSide: number, top: number, bottom: number, formFactor: FormFactor = 'phone') => {
    const l = resolveLayout({ shortSide, safeAreaTopEdge: top, safeAreaBottomEdge: bottom, formFactor });
    const numeralOuter = l.dialCenterY + l.numeralRadius + HEIGHT.numeral * 0.5 * l.dotSize;
    const buttonTop = l.buttonCenterY - (HEIGHT.button * l.dotSize) / 2;
    return buttonTop - numeralOuter;
  };

  const gapOnDevice = (name: DeviceName) => {
    const { shortSide, topEdge, bottomEdge, formFactor } = DEVICES[name];
    return gapOn(shortSide, topEdge, bottomEdge, formFactor);
  };

  it('기준 화면 iPhone 17e에서 90이다', () => {
    expect(gapOnDevice('iPhone17e')).toBe(90);
  });

  it('시계판이 작은 iPhone SE에서도 90이다', () => {
    expect(gapOnDevice('iPhoneSE')).toBe(90);
  });

  it('iPad mini에서도 90이다', () => {
    expect(gapOnDevice('iPadMini')).toBe(90);
  });

  it('짧은 변 1014에서도 90이다', () => {
    expect(gapOn(1014, 24, 1300)).toBe(90);
  });

  it('safe area 높이 526에서 버튼 거리가 하한 44로 클램프되어도 90이다', () => {
    expect(gapOn(390, 0, 526)).toBe(90);
  });
});
