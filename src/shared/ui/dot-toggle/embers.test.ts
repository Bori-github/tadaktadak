import { describe, expect, it, jest } from '@jest/globals';

import { COLORS } from '@/shared/constants';

import { emberAt, totalDurationMs, TURN_OFF, TURN_ON } from './embers';

// 구간 선택과 색만 검증해 이징은 진행률을 그대로 반환
jest.mock('react-native-reanimated', () => ({
  Easing: { linear: (progress: number) => progress, bezierFn: () => (progress: number) => progress },
}));

describe('토글 불티', () => {
  it('켜기 시작 직후 첫 불티는 손잡이 앞에 불 심 색으로 있다', () => {
    expect(emberAt(TURN_ON, 0, 0)).toEqual({ column: 10, row: 5, color: COLORS.fire.core });
  });

  it('구간 안에서는 색이 바뀌지 않는다', () => {
    const secondStartMs = TURN_ON[0]?.durationMs ?? 0;

    expect(emberAt(TURN_ON, 0, secondStartMs + 1)?.color).toBe(COLORS.fire.mid);
    expect(emberAt(TURN_ON, 0, secondStartMs + 299)?.color).toBe(COLORS.fire.mid);
  });

  it('마지막 구간이 끝나면 불티를 한 번에 지운다', () => {
    const totalMs = totalDurationMs(TURN_ON);

    expect(emberAt(TURN_ON, 0, totalMs - 1)).not.toBeNull();
    expect(emberAt(TURN_ON, 0, totalMs)).toBeNull();
  });

  it('끌 때는 다섯째 불티부터 없다', () => {
    expect(emberAt(TURN_OFF, 3, 0)).not.toBeNull();
    expect(emberAt(TURN_OFF, 4, 0)).toBeNull();
  });
});
