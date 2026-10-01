import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Dimensions, Platform } from 'react-native';

import { BUTTON_SIZE_IN_DOTS } from '@/shared/constants';

import { DEVICE_NAMES, DEVICES, type DeviceName } from './devices';
import { resolveLayout, getFormFactor, type FormFactor } from './responsive';

// 390×844 화면. safe area 위 47·아래 34이므로 위 끝은 47, 아래 끝은 810
const SAFE_AREA_TOP_EDGE = 47;
const SAFE_AREA_BOTTOM_EDGE = 810;

// 큰 짧은 변에서도 세로 배치를 유지하려고 safe area 아래 끝을 짧은 변의 2배 이상으로 설정
const layout = (shortSide: number) => resolveLayout({ shortSide, safeAreaTopEdge: SAFE_AREA_TOP_EDGE, safeAreaBottomEdge: Math.max(SAFE_AREA_BOTTOM_EDGE, shortSide * 2) });

// iPad mini 744×1133. safe area 위 24·아래 20
const ipadMini = () => resolveLayout({ shortSide: 744, safeAreaTopEdge: 24, safeAreaBottomEdge: 1113, formFactor: 'tablet' });

// 위 끝을 0으로 두면 safe area 높이가 그대로 아래 끝 좌표가 됨
const buttonOffset = (safeAreaHeight: number) => safeAreaHeight - resolveLayout({ shortSide: 390, safeAreaTopEdge: 0, safeAreaBottomEdge: safeAreaHeight }).buttonCenterY;

const dialTopEdge = (safeAreaHeight: number) => resolveLayout({ shortSide: 390, safeAreaTopEdge: 0, safeAreaBottomEdge: safeAreaHeight }).dialCenterY - 182;

describe('배율', () => {
  it.each([338, 656])('짧은 변 %d에서 1배다', (shortSide) => {
    expect(layout(shortSide).scale).toBe(1);
  });

  it.each([657, 1024])('짧은 변 %d에서 상한 1.5배다', (shortSide) => {
    expect(layout(shortSide).scale).toBe(1.5);
  });
});

describe('등급별 모닥불', () => {
  it.each([320, 359])('compact 등급인 짧은 변 %d에서 모닥불은 7 도트다', (shortSide) => {
    expect(layout(shortSide).bonfireHeightInDots).toBe(7);
  });

  it('medium 최소 짧은 변 360에서 모닥불은 9 도트다', () => {
    expect(layout(360).bonfireHeightInDots).toBe(9);
  });
});

describe('개체 중심 반지름', () => {
  it('지원 최소 짧은 변에서 132.6이다', () => {
    expect(layout(338).itemRadius).toBeCloseTo(132.6);
  });

  it('기준 화면에서 153이다', () => {
    expect(layout(390).itemRadius).toBe(153);
  });
});

describe('기준 화면의 나머지 반지름', () => {
  it('호·손잡이 반지름은 131이다', () => {
    expect(layout(390).arcRadius).toBe(131);
  });

  it('눈금 숫자 반지름은 175다', () => {
    expect(layout(390).numeralRadius).toBe(175);
  });
});

describe('지원 밖 화면', () => {
  it('지원 최소보다 좁은 320에서도 반지름이 모두 양수다', () => {
    const l = layout(320);
    expect(l.itemRadius).toBeGreaterThan(0);
    expect(l.arcRadius).toBeGreaterThan(0);
    expect(l.numeralRadius).toBeGreaterThan(0);
  });

  it('폭이 좁아지면 시계판도 작아진다', () => {
    expect(layout(337).itemRadius).toBeLessThan(layout(338).itemRadius);
  });
});

const dialDiameter = ({ numeralRadius, dotSize }: { numeralRadius: number; dotSize: number }) => (numeralRadius + 3.5 * dotSize) * 2;

const tallWindow = (shortSide: number, formFactor: FormFactor) => resolveLayout({ shortSide, safeAreaTopEdge: 0, safeAreaBottomEdge: shortSide * 2, formFactor });

describe('태블릿', () => {
  it.each([560, 744, 1024])('짧은 변 %d에서 시계판 지름이 짧은 변의 70%다', (shortSide) => {
    expect(dialDiameter(tallWindow(shortSide, 'tablet')) / shortSide).toBeCloseTo(0.7);
  });
});

describe('iPad mini 세로 위치', () => {
  it('iPad mini에서 버튼 중심 y는 963이다', () => {
    expect(ipadMini().buttonCenterY).toBe(963);
  });

  it('iPad mini에서 시계판 중심 y는 570.6이다', () => {
    expect(ipadMini().dialCenterY).toBeCloseTo(570.6);
  });
});

describe('safe area 높이와 버튼 거리', () => {
  it('632에서 기준값 150을 지킨다', () => {
    expect(buttonOffset(632)).toBe(150);
  });

  it('900으로 넉넉해도 150을 넘지 않는다', () => {
    expect(buttonOffset(900)).toBe(150);
  });

  it('631에서 모자란 1만큼 줄어 149다', () => {
    expect(buttonOffset(631)).toBe(149);
  });

  it('526에서 하한 44에 닿는다', () => {
    expect(buttonOffset(526)).toBe(44);
  });
});

describe('safe area 높이와 시계판 위 끝', () => {
  it('632에서 safe area 위 끝에 닿는다', () => {
    expect(dialTopEdge(632)).toBe(0);
  });

  it('600과 526에서도 safe area 위 끝에 붙는다', () => {
    expect(dialTopEdge(600)).toBe(0);
    expect(dialTopEdge(526)).toBe(0);
  });
});

describe('배치 선택', () => {
  const isLandscape = (safeAreaHeight: number) => resolveLayout({ shortSide: 390, safeAreaTopEdge: 0, safeAreaBottomEdge: safeAreaHeight }).isLandscape;

  it('safe area 높이 525에서 가로 배치로 전환된다', () => {
    expect(isLandscape(525)).toBe(true);
  });

  it('하한 118.1까지 커질 시계판 크기로 배치를 판정한다', () => {
    // 태블릿 70% 크기로는 세로 배치가 들어가지만 하한 크기로는 들어가지 않는 창
    const { isLandscape: landscape } = resolveLayout({ shortSide: 375, safeAreaTopEdge: 24, safeAreaBottomEdge: 446, formFactor: 'tablet' });
    expect(landscape).toBe(true);
  });
});

describe('가로 배치. 피그마 844×390 기준 프레임', () => {
  // safe area 좌우 47·아래 21
  const landscape = resolveLayout({ shortSide: 390, safeAreaTopEdge: 0, safeAreaBottomEdge: 369, safeAreaLeftEdge: 47, safeAreaRightEdge: 797 });

  it('시계판 중심은 safe area 중심 (422, 184.5)이다', () => {
    expect(landscape.dialCenterX).toBe(422);
    expect(landscape.dialCenterY).toBe(184.5);
  });

  it('개체 중심 반지름은 safe area 높이 기준으로 147.5로 축소된다', () => {
    expect(landscape.itemRadius).toBeCloseTo(147.5);
  });

  it('버튼 두 개의 가운데 x는 709, 중심 y는 325다', () => {
    expect(landscape.buttonsCenterX).toBe(709);
    expect(landscape.buttonCenterY).toBe(325);
  });
});

describe('가로 배치 시계판과 버튼', () => {
  it.each([
    { label: '너비 375·높이 442', shortSide: 375, height: 442, width: 375 },
    { label: '너비 400·높이 350', shortSide: 350, height: 350, width: 400 },
  ])('$label 창에서 시계판은 버튼에 닿지 않는다', ({ shortSide, height, width }) => {
    const l = resolveLayout({ shortSide, safeAreaTopEdge: 0, safeAreaBottomEdge: height, safeAreaLeftEdge: 0, safeAreaRightEdge: width });
    const buttonHalfSize = (BUTTON_SIZE_IN_DOTS / 2) * l.dotSize;
    const buttonsLeftEdge = l.buttonsCenterX - 22 * l.dotSize - buttonHalfSize;
    const buttonsTopEdge = l.buttonCenterY - buttonHalfSize;
    const distance = Math.hypot(Math.max(buttonsLeftEdge - l.dialCenterX, 0), Math.max(buttonsTopEdge - l.dialCenterY, 0));
    const dialTopHalfHeight = l.numeralRadius + 3.5 * l.dotSize;

    expect(l.isLandscape).toBe(true);
    expect(distance).toBeGreaterThanOrEqual(dialTopHalfHeight - 1e-9);
  });
});

describe('iPad mini 가로', () => {
  // 1133×744. safe area 위 24·아래 20
  const ipadMiniLandscape = resolveLayout({ shortSide: 744, safeAreaTopEdge: 24, safeAreaBottomEdge: 724, safeAreaLeftEdge: 0, safeAreaRightEdge: 1133, formFactor: 'tablet' });

  it('가로 배치이고 시계판 중심 x는 566.5다', () => {
    expect(ipadMiniLandscape.isLandscape).toBe(true);
    expect(ipadMiniLandscape.dialCenterX).toBe(566.5);
  });

  it('시계판 지름은 짧은 변의 70%다', () => {
    const { numeralRadius, dotSize } = ipadMiniLandscape;
    const numeralHalfHeight = 3.5 * dotSize;
    expect(((numeralRadius + numeralHalfHeight) * 2) / 744).toBeCloseTo(0.7);
  });
});

describe('가로 배치 시계판 축소 하한', () => {
  const narrowWindow = (safeAreaHeight: number) =>
    resolveLayout({ shortSide: Math.min(375, safeAreaHeight), safeAreaTopEdge: 0, safeAreaBottomEdge: safeAreaHeight, safeAreaLeftEdge: 0, safeAreaRightEdge: 375 });

  it('개체 중심 반지름이 124.1 미만이면 모닥불이 7 도트다', () => {
    const l = narrowWindow(442);
    expect(l.itemRadius).toBeLessThan(124.1);
    expect(l.bonfireHeightInDots).toBe(7);
  });

  it('버튼과 떨어진 창에서 개체 중심 반지름은 118.1 미만으로 축소되지 않는다', () => {
    const wideWindow = resolveLayout({ shortSide: 300, safeAreaTopEdge: 0, safeAreaBottomEdge: 300, safeAreaLeftEdge: 0, safeAreaRightEdge: 844 });
    expect(wideWindow.itemRadius).toBeCloseTo(118.1);
  });

  it('버튼과 겹치는 창에서는 하한보다 버튼 회피가 우선이다', () => {
    const lowWindow = resolveLayout({ shortSide: 350, safeAreaTopEdge: 0, safeAreaBottomEdge: 350, safeAreaLeftEdge: 0, safeAreaRightEdge: 400 });
    expect(lowWindow.itemRadius).toBeLessThan(118.1);
  });
});

describe('기기 종류 판정', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    { label: '휴대폰', shortSide: 599, expected: 'phone' },
    { label: '태블릿', shortSide: 600, expected: 'tablet' },
  ])('Android에서 기기 화면 짧은 변이 $shortSide이면 $label이다', ({ shortSide, expected }) => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: shortSide, height: 900, scale: 2, fontScale: 1 });
    expect(getFormFactor()).toBe(expected);
  });
});

const onDevice = (name: DeviceName) => {
  const { shortSide, topEdge, bottomEdge, formFactor } = DEVICES[name];
  return resolveLayout({ shortSide, safeAreaTopEdge: topEdge, safeAreaBottomEdge: bottomEdge, formFactor });
};

describe('기준 화면 세로 위치', () => {
  it('iPhone 17e에서 버튼 중심 y는 660, 시계판 중심 y는 360이다', () => {
    expect(onDevice('iPhone17e').buttonCenterY).toBe(660);
    expect(onDevice('iPhone17e').dialCenterY).toBe(360);
  });
});

describe('버튼 아래 끝이 safe area 아래 끝을 넘지 않는다', () => {
  it.each(DEVICE_NAMES)('%s', (name) => {
    const { buttonCenterY, dotSize } = onDevice(name);
    const buttonBottomEdge = buttonCenterY + (BUTTON_SIZE_IN_DOTS / 2) * dotSize;
    expect(buttonBottomEdge).toBeLessThanOrEqual(DEVICES[name].bottomEdge);
  });
});

describe('시계판 위 끝이 safe area 위 끝을 넘지 않는다', () => {
  it.each(DEVICE_NAMES)('%s', (name) => {
    const { dialCenterY, numeralRadius, dotSize } = onDevice(name);
    // 숫자 반높이 = 7 × 배율 (px). 배율 = dotSize ÷ 2
    const dialTopEdge = dialCenterY - numeralRadius - 7 * (dotSize / 2);
    expect(dialTopEdge).toBeGreaterThanOrEqual(DEVICES[name].topEdge);
  });
});

describe('화면 가장자리 여백', () => {
  it('기준 화면에서 화면 가장자리 여백은 8이다', () => {
    expect(layout(390).edgeMargin).toBe(8);
  });

  it.each(DEVICE_NAMES)('%s에서 화면 가장자리 여백은 8 × 배율이다', (name) => {
    const { edgeMargin, scale } = onDevice(name);

    expect(edgeMargin).toBe(8 * scale);
  });
});
