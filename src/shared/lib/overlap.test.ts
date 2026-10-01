import { describe, expect, it } from '@jest/globals';

import { BUTTON_SIZE_IN_DOTS } from '@/shared/constants';

import { DEVICES, type DeviceName } from './devices';
import { resolveLayout } from './responsive';

/** 최대 투영 (dot). `DESIGN.md` §4 */
const PROJECTION = { log: 4, bonfire: 7 };

/** 개체 높이 (dot). `DESIGN.md` §4 */
const HEIGHT = { bonfire: 9, thumb: 7, numeral: 7, button: BUTTON_SIZE_IN_DOTS };

// 큰 짧은 변에서도 세로 배치를 유지하려고 safe area 아래 끝을 짧은 변의 2배 이상으로 설정
const layout = (shortSide: number) => resolveLayout({ shortSide, safeAreaTopEdge: 47, safeAreaBottomEdge: Math.max(810, shortSide * 2) });

/** 화면 반지름에서 배율을 나눈 값 (px). 도트 수는 배율과 무관하므로 도트 단위 검산은 이 값으로 계산 */
const baseItemRadius = (shortSide: number) => {
  const { itemRadius, scale } = layout(shortSide);
  return itemRadius / scale;
};

/** 1분 간격 (dot). `DESIGN.md` §7 계산 순서 7 */
const minuteGap = (shortSide: number) => (Math.PI * baseItemRadius(shortSide)) / 60;

const needed = (a: number, b: number) => (a + b) / 2;

const round = (value: number) => Math.round(value * 100) / 100;

describe('1분 간격', () => {
  it('기준 화면 390에서 반지름 153의 원주를 60으로 나눈 8.01 도트다', () => {
    expect(round(minuteGap(390))).toBe(8.01);
  });
});

describe('개체 중심 반지름 하한 118.1의 원주 방향 겹침', () => {
  // 가로 배치에서 safe area 높이가 낮아 하한까지 축소되고 버튼과는 떨어진 창
  const { itemRadius, bonfireHeightInDots } = resolveLayout({ shortSide: 300, safeAreaTopEdge: 0, safeAreaBottomEdge: 300, safeAreaLeftEdge: 0, safeAreaRightEdge: 844 });
  const gap = (Math.PI * itemRadius) / 60;

  it('1분 간격 최솟값은 6.18 도트이고 모닥불은 7 도트다', () => {
    expect(round(gap)).toBe(6.18);
    expect(bonfireHeightInDots).toBe(7);
  });

  it('7 도트 모닥불 + 장작 여유는 0.68 도트다 (간격 6.18, 필요 5.5)', () => {
    expect(round(gap - needed(PROJECTION.bonfire, PROJECTION.log))).toBe(0.68);
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
  const gapOn = (shortSide: number, top: number, bottom: number, isTablet = false) => {
    const l = resolveLayout({ shortSide, safeAreaTopEdge: top, safeAreaBottomEdge: bottom, isTablet });
    const numeralOuter = l.dialCenterY + l.numeralRadius + HEIGHT.numeral * 0.5 * l.dotSize;
    const buttonTop = l.buttonCenterY - (HEIGHT.button * l.dotSize) / 2;
    return buttonTop - numeralOuter;
  };

  const gapOnDevice = (name: DeviceName) => {
    const { shortSide, topEdge, bottomEdge, isTablet } = DEVICES[name];
    return gapOn(shortSide, topEdge, bottomEdge, isTablet);
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
