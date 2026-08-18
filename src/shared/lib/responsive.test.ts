import { resolveLayout } from './responsive';

// 390×844 화면. safe area 아래 34이므로 아래 끝은 810
const SAFE_AREA_BOTTOM_EDGE = 810;

const layout = (shortSide: number, safeAreaBottomEdge = SAFE_AREA_BOTTOM_EDGE) => resolveLayout({ shortSide, safeAreaBottomEdge });

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

  it('iPad mini에서 계산용 너비 372의 149에 배율 2를 곱해 298이다', () => {
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

describe('도트 크기', () => {
  it('기준 화면에서 2다', () => {
    expect(layout(390).dotSize).toBe(2);
  });

  it('배율 2에서 4가 된다', () => {
    expect(layout(744).dotSize).toBe(4);
  });

  it('배율 3에서 6이 된다', () => {
    expect(layout(1014).dotSize).toBe(6);
  });
});

describe('세로 위치에는 k를 곱하지 않는다', () => {
  it('배율 2에서도 버튼 중심 y는 safe area 그대로다', () => {
    expect(layout(744).buttonCenterY).toBe(660);
  });

  it('배율 2에서도 시계판 중심 y는 safe area 그대로다', () => {
    expect(layout(744).dialCenterY).toBe(360);
  });
});

describe('세로 위치', () => {
  it('버튼 중심 y는 660이다', () => {
    expect(layout(390).buttonCenterY).toBe(660);
  });

  it('시계판 중심 y는 360이다', () => {
    expect(layout(390).dialCenterY).toBe(360);
  });
});
