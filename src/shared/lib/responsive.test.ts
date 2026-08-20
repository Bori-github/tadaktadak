import { describe, expect, it } from '@jest/globals';

import { BUTTON_SIZE_IN_DOTS } from '@/shared/constants';

import { resolveLayout } from './responsive';

// 390×844 화면. safe area 위 47·아래 34이므로 위 끝은 47, 아래 끝은 810
const SAFE_AREA_TOP_EDGE = 47;
const SAFE_AREA_BOTTOM_EDGE = 810;

const layout = (shortSide: number) => resolveLayout({ shortSide, safeAreaTopEdge: SAFE_AREA_TOP_EDGE, safeAreaBottomEdge: SAFE_AREA_BOTTOM_EDGE });

// iPad mini 744×1133. safe area 위 24·아래 20
const ipadMini = () => resolveLayout({ shortSide: 744, safeAreaTopEdge: 24, safeAreaBottomEdge: 1113 });

// 위 끝을 0으로 두면 safe area 높이가 그대로 아래 끝 좌표가 된다
const buttonOffset = (safeAreaHeight: number) => safeAreaHeight - resolveLayout({ shortSide: 390, safeAreaTopEdge: 0, safeAreaBottomEdge: safeAreaHeight }).buttonCenterY;

const dialTopEdge = (safeAreaHeight: number) => resolveLayout({ shortSide: 390, safeAreaTopEdge: 0, safeAreaBottomEdge: safeAreaHeight }).dialCenterY - 182;

describe('배율', () => {
  it('지원 최소 너비에서 1배다', () => {
    expect(layout(338).scale).toBe(1);
  });

  it('지원 최소 너비의 두 배에 못 미치면 1배에 머문다', () => {
    expect(layout(675).scale).toBe(1);
  });

  it('지원 최소 너비의 두 배에서 2배가 된다', () => {
    expect(layout(676).scale).toBe(2);
  });

  it('지원 최소 너비의 세 배에서 3배가 된다', () => {
    expect(layout(1014).scale).toBe(3);
  });
});

describe('모닥불 높이', () => {
  it('지원 최소 너비에서 7 도트다', () => {
    expect(layout(338).bonfireDots).toBe(7);
  });

  it('전환 너비 바로 아래에서 7 도트다', () => {
    expect(layout(359).bonfireDots).toBe(7);
  });

  it('전환 너비에서 9 도트가 된다', () => {
    expect(layout(360).bonfireDots).toBe(9);
  });

  it('배율이 올라도 짧은 변이 넓으면 9 도트를 지킨다', () => {
    expect(layout(676).bonfireDots).toBe(9);
  });
});

describe('개체 중심 반지름', () => {
  it('지원 최소 너비에서 134다', () => {
    expect(layout(338).itemRadius).toBe(134);
  });

  it('너비 380에서 상한 153에 처음 닿는다', () => {
    expect(layout(380).itemRadius).toBe(153);
  });

  it('기준 화면에서 상한 153에 걸린다', () => {
    expect(layout(390).itemRadius).toBe(153);
  });

  it('iPad mini에서 298이다', () => {
    expect(layout(744).itemRadius).toBe(298);
  });
});

describe('기준 화면의 나머지 반지름', () => {
  it('호·손잡이 반지름은 131이다', () => {
    expect(layout(390).arcRadius).toBe(131);
  });

  it('눈금 숫자 반지름은 175다', () => {
    expect(layout(390).tickNumberRadius).toBe(175);
  });
});

describe('배율 2에서 반지름 셋에 모두 k가 곱해진다', () => {
  it('호·손잡이 반지름은 254다', () => {
    expect(layout(744).arcRadius).toBe(254);
  });

  it('눈금 숫자 반지름은 342다', () => {
    expect(layout(744).tickNumberRadius).toBe(342);
  });
});

describe('지원 밖 화면', () => {
  it('지원 최소보다 좁은 320에서도 반지름이 모두 양수다', () => {
    const l = layout(320);
    expect(l.itemRadius).toBeGreaterThan(0);
    expect(l.arcRadius).toBeGreaterThan(0);
    expect(l.tickNumberRadius).toBeGreaterThan(0);
  });

  it('폭이 좁아지면 시계판도 작아진다', () => {
    expect(layout(337).itemRadius).toBeLessThan(layout(338).itemRadius);
  });
});

describe('버튼 중심 y에는 k를 곱하지 않고 버튼에서 시계판까지는 k를 탄다', () => {
  it('iPad mini에서 버튼 중심 y는 963이다', () => {
    expect(ipadMini().buttonCenterY).toBe(963);
  });

  it('iPad mini에서 시계판 중심 y는 461이다', () => {
    expect(ipadMini().dialCenterY).toBe(461);
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

  it('500에서도 하한 44에 머문다', () => {
    expect(buttonOffset(500)).toBe(44);
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

  it('500에서는 safe area 위 끝을 넘어 잘린다', () => {
    expect(dialTopEdge(500)).toBeLessThan(0);
  });
});

// 실제 기기의 safe area. 짧은 변, 위 끝, 아래 끝
const DEVICES = {
  iPhoneSE: { shortSide: 375, topEdge: 20, bottomEdge: 667 },
  iPhone17e: { shortSide: 390, topEdge: 47, bottomEdge: 810 },
  iPhoneProMax: { shortSide: 430, topEdge: 59, bottomEdge: 898 },
  iPadMini: { shortSide: 744, topEdge: 24, bottomEdge: 1113 },
  iPadHome: { shortSide: 768, topEdge: 20, bottomEdge: 1024 },
  iPadPro13: { shortSide: 1024, topEdge: 24, bottomEdge: 1346 },
  androidSmall: { shortSide: 360, topEdge: 24, bottomEdge: 592 },
};

const onDevice = (name: keyof typeof DEVICES) => {
  const { shortSide, topEdge, bottomEdge } = DEVICES[name];
  return resolveLayout({ shortSide, safeAreaTopEdge: topEdge, safeAreaBottomEdge: bottomEdge });
};

describe('기기별 세로 위치', () => {
  it('iPhone SE에서 버튼 중심 y는 517이다', () => {
    expect(onDevice('iPhoneSE').buttonCenterY).toBe(517);
  });

  it('iPhone 17e에서 버튼 중심 y는 660, 시계판 중심 y는 360이다', () => {
    expect(onDevice('iPhone17e').buttonCenterY).toBe(660);
    expect(onDevice('iPhone17e').dialCenterY).toBe(360);
  });

  it('안드로이드 360×640에서 버튼 중심 y는 486이다', () => {
    expect(onDevice('androidSmall').buttonCenterY).toBe(486);
  });
});

describe('버튼 아래 끝이 safe area 아래 끝을 넘지 않는다', () => {
  it.each(Object.keys(DEVICES) as (keyof typeof DEVICES)[])('%s', (name) => {
    const { buttonCenterY, dotSize } = onDevice(name);
    const buttonBottomEdge = buttonCenterY + (BUTTON_SIZE_IN_DOTS / 2) * dotSize;
    expect(buttonBottomEdge).toBeLessThanOrEqual(DEVICES[name].bottomEdge);
  });

  it('배율 2에서 하한 클램프에 걸려도 넘지 않는다', () => {
    const { buttonCenterY, dotSize } = resolveLayout({ shortSide: 744, safeAreaTopEdge: 24, safeAreaBottomEdge: 724 });
    expect(buttonCenterY + (BUTTON_SIZE_IN_DOTS / 2) * dotSize).toBeLessThanOrEqual(724);
  });
});

describe('시계판 위 끝이 safe area 위 끝을 넘지 않는다', () => {
  it.each(Object.keys(DEVICES) as (keyof typeof DEVICES)[])('%s', (name) => {
    const { dialCenterY, tickNumberRadius, dotSize } = onDevice(name);
    // 숫자 반높이 7은 배율을 탄다. dotSize ÷ 2 = 배율
    const dialTopEdge = dialCenterY - tickNumberRadius - 7 * (dotSize / 2);
    expect(dialTopEdge).toBeGreaterThanOrEqual(DEVICES[name].topEdge);
  });
});
