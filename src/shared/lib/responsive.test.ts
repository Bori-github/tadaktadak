import { describe, expect, it } from '@jest/globals';

import { BUTTON_SIZE_IN_DOTS } from '@/shared/constants';

import { DEVICE_NAMES, DEVICES, type DeviceName } from './devices';
import { resolveLayout } from './responsive';

// 390×844 화면. safe area 위 47·아래 34이므로 위 끝은 47, 아래 끝은 810
const SAFE_AREA_TOP_EDGE = 47;
const SAFE_AREA_BOTTOM_EDGE = 810;

// 큰 짧은 변에서도 세로 배치를 유지하려고 safe area 아래 끝을 짧은 변의 2배 이상으로 설정
const layout = (shortSide: number) => resolveLayout({ shortSide, safeAreaTopEdge: SAFE_AREA_TOP_EDGE, safeAreaBottomEdge: Math.max(SAFE_AREA_BOTTOM_EDGE, shortSide * 2) });

// iPad mini 744×1133. safe area 위 24·아래 20
const ipadMini = () => resolveLayout({ shortSide: 744, safeAreaTopEdge: 24, safeAreaBottomEdge: 1113 });

// 위 끝을 0으로 두면 safe area 높이가 그대로 아래 끝 좌표가 됨
const buttonOffset = (safeAreaHeight: number) => safeAreaHeight - resolveLayout({ shortSide: 390, safeAreaTopEdge: 0, safeAreaBottomEdge: safeAreaHeight }).buttonCenterY;

const dialTopEdge = (safeAreaHeight: number) => resolveLayout({ shortSide: 390, safeAreaTopEdge: 0, safeAreaBottomEdge: safeAreaHeight }).dialCenterY - 182;

describe('배율', () => {
  it('지원 최소 짧은 변에서 1배다', () => {
    expect(layout(338).scale).toBe(1);
  });

  it('지원 최소 짧은 변의 두 배에 못 미치면 1배에 머문다', () => {
    expect(layout(675).scale).toBe(1);
  });

  it('지원 최소 짧은 변의 두 배에서 2배가 된다', () => {
    expect(layout(676).scale).toBe(2);
  });

  it('지원 최소 짧은 변의 세 배에서 3배가 된다', () => {
    expect(layout(1014).scale).toBe(3);
  });

  it('지원 최소 짧은 변의 네 배에서도 3배에 머문다', () => {
    expect(layout(1352).scale).toBe(3);
  });
});

describe('화면 등급', () => {
  it('medium 최소 바로 아래에서 compact다', () => {
    expect(layout(359).screenGrade).toBe('compact');
  });

  it('배율이 그대로여도 medium 최소에서 medium이 된다', () => {
    expect(layout(360).screenGrade).toBe('medium');
  });

  it('지원 최소보다 좁은 320도 compact다', () => {
    expect(layout(320).screenGrade).toBe('compact');
  });
});

describe('개체 중심 반지름', () => {
  it('지원 최소 짧은 변에서 132.6이다', () => {
    expect(layout(338).itemRadius).toBeCloseTo(132.6);
  });

  it('배율이 2로 바뀌는 675와 676 사이에서 1 미만 차이다', () => {
    expect(Math.abs(layout(676).itemRadius - layout(675).itemRadius)).toBeLessThan(1);
  });

  it('짧은 변 1170에서 459가 되고 그 이상에서 고정된다', () => {
    expect(layout(1170).itemRadius).toBeCloseTo(459);
    expect(layout(1400).itemRadius).toBeCloseTo(459);
  });

  it('기준 화면에서 상한 153에 걸린다', () => {
    expect(layout(390).itemRadius).toBe(153);
  });

  it('iPad mini에서 291.88이다', () => {
    expect(layout(744).itemRadius).toBeCloseTo(291.88);
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

describe('배율 2에서 반지름 셋에 모두 k가 곱해진다', () => {
  it('호·손잡이 반지름은 247.88이다', () => {
    expect(layout(744).arcRadius).toBeCloseTo(247.88);
  });

  it('눈금 숫자 반지름은 335.88이다', () => {
    expect(layout(744).numeralRadius).toBeCloseTo(335.88);
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

describe('버튼 중심 y에는 k를 곱하지 않고 버튼에서 시계판까지는 k를 탄다', () => {
  it('iPad mini에서 버튼 중심 y는 963이다', () => {
    expect(ipadMini().buttonCenterY).toBe(963);
  });

  it('iPad mini에서 시계판 중심 y는 467.12다', () => {
    expect(ipadMini().dialCenterY).toBeCloseTo(467.12);
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

  it('버튼 중심은 x 665와 753, y 325다', () => {
    expect(landscape.buttonsCenterX).toBe(709);
    expect(landscape.buttonCenterY).toBe(325);
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

  it('개체 중심 반지름은 118.1 미만으로 축소되지 않는다', () => {
    expect(narrowWindow(300).itemRadius).toBeCloseTo(118.1);
  });
});

const onDevice = (name: DeviceName) => {
  const { shortSide, topEdge, bottomEdge } = DEVICES[name];
  return resolveLayout({ shortSide, safeAreaTopEdge: topEdge, safeAreaBottomEdge: bottomEdge });
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
