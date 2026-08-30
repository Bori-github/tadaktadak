import { describe, expect, it } from '@jest/globals';

import { BUTTON_SIZE_IN_DOTS } from '@/shared/constants';

import { DEVICES, type DeviceName } from './devices';
import { resolveLayout } from './responsive';

/** 최대 투영 (dot). `DESIGN.md` §4 */
const PROJECTION = { log: 4, bonfire: 9, marker: 5 };

/** 개체 높이 (dot). `DESIGN.md` §4 */
const HEIGHT = { bonfire: 9, thumb: 7, numeral: 7, button: BUTTON_SIZE_IN_DOTS };

const layout = (shortSide: number) => resolveLayout({ shortSide, safeAreaTopEdge: 47, safeAreaBottomEdge: 810 });

/** 화면 반지름에서 배율을 나눈 값 (px). 도트 수는 배율과 무관하므로 도트 단위 검산은 이 값으로 계산 */
const baseItemRadius = (shortSide: number) => {
  const { itemRadius, scale } = layout(shortSide);
  return itemRadius / scale;
};

/** 1분 간격 (dot). `DESIGN.md` §7 계산 순서 8 */
const minuteGap = (shortSide: number) => (Math.PI * baseItemRadius(shortSide)) / 60;

const needed = (a: number, b: number) => (a + b) / 2;

const round = (value: number) => Math.round(value * 100) / 100;

describe('1분 간격', () => {
  it('기준 화면 390에서 반지름 153의 원주를 60으로 나눈 8.01 도트다', () => {
    expect(round(minuteGap(390))).toBe(8.01);
  });

  it('짧은 변 676은 계산용 너비가 하한 338이라 6.91 도트로 가장 좁다', () => {
    expect(round(minuteGap(676))).toBe(6.91);
  });

  it('짧은 변 1014도 계산용 너비가 338이라 676과 같다', () => {
    expect(round(minuteGap(1014))).toBe(round(minuteGap(676)));
  });

  it('짧은 변 744는 계산용 너비가 372라 676보다 넓다', () => {
    expect(minuteGap(744)).toBeGreaterThan(minuteGap(676));
  });
});

describe('짧은 변 676의 원주 방향 겹침', () => {
  const gap = minuteGap(676);

  it('장작 + 장작은 간격 6.91에서 필요 4.0을 빼 여유 2.91 도트다', () => {
    expect(round(gap - needed(PROJECTION.log, PROJECTION.log))).toBe(2.91);
  });

  it('모닥불 + 장작은 간격 6.91에서 필요 6.5를 빼 여유 0.41 도트다', () => {
    expect(round(gap - needed(PROJECTION.bonfire, PROJECTION.log))).toBe(0.41);
  });

  it('모닥불끼리는 다섯 칸 34.56에서 필요 9.0을 빼 여유 25.56 도트다', () => {
    expect(round(gap * 5 - needed(PROJECTION.bonfire, PROJECTION.bonfire))).toBe(25.56);
  });

  it('12시 모닥불과 기준 표식은 반 칸 3.46에서 필요 7.0을 빼 3.54 도트 겹친다', () => {
    expect(round(gap * 0.5 - needed(PROJECTION.bonfire, PROJECTION.marker))).toBe(-3.54);
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
  const gapOn = (shortSide: number, top: number, bottom: number) => {
    const l = resolveLayout({ shortSide, safeAreaTopEdge: top, safeAreaBottomEdge: bottom });
    const numeralOuter = l.dialCenterY + l.numeralRadius + HEIGHT.numeral * 0.5 * l.dotSize;
    const buttonTop = l.buttonCenterY - (HEIGHT.button * l.dotSize) / 2;
    return buttonTop - numeralOuter;
  };

  const gapOnDevice = (name: DeviceName) => {
    const { shortSide, topEdge, bottomEdge } = DEVICES[name];
    return gapOn(shortSide, topEdge, bottomEdge);
  };

  it('기준 화면 iPhone 17e에서 90이다', () => {
    expect(gapOnDevice('iPhone17e')).toBe(90);
  });

  it('시계판이 작은 iPhone SE에서도 90이다', () => {
    expect(gapOnDevice('iPhoneSE')).toBe(90);
  });

  it('시계판 위 반높이가 356으로 커지는 iPad mini에서도 90이다', () => {
    expect(gapOnDevice('iPadMini')).toBe(90);
  });

  it('배율 3인 짧은 변 1014에서도 90이다', () => {
    expect(gapOn(1014, 24, 1300)).toBe(90);
  });

  it('safe area 높이 500이라 버튼 거리가 하한 44로 클램프돼도 90이다', () => {
    expect(gapOn(390, 0, 500)).toBe(90);
  });
});
