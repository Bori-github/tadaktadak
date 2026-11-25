import { describe, expect, it } from '@jest/globals';

import { hillBaseline } from './hill';

describe('뒤 언덕 평균선 y', () => {
  it.each([
    { label: '휴대폰 세로', height: 844, scale: 1, dialBottomY: 560, expected: 742 },
    { label: 'iPad 세로', height: 1180, scale: 1.5, dialBottomY: 820, expected: 1027 },
  ])('$label: 시계판 아래 공간이 넓으면 화면 하단에서 102 × 배율 위다', ({ height, scale, dialBottomY, expected }) => {
    expect(hillBaseline({ height, scale, dialBottomY })).toBe(expected);
  });

  it('시계판 아래 공간이 좁으면 숫자 라벨 하단에서 26 × 배율 아래다', () => {
    expect(hillBaseline({ height: 820, scale: 1.5, dialBottomY: 700 })).toBe(739);
  });

  it('시계판 아래 공간이 더 좁으면 화면 하단에서 30 × 배율 위다', () => {
    expect(hillBaseline({ height: 820, scale: 1.5, dialBottomY: 760 })).toBe(775);
  });
});
