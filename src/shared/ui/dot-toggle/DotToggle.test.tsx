import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DotToggle } from './DotToggle';

// 토글 전환만 검증해 모션은 목표 값으로 즉시 이동
jest.mock('react-native-reanimated', () => ({
  Easing: { linear: (progress: number) => progress, bezierFn: () => (progress: number) => progress },
  useSharedValue: (initial: unknown) => ({ value: initial }),
  useDerivedValue: (compute: () => unknown) => ({ value: compute() }),
  withTiming: (target: unknown) => target,
}));

const changes: boolean[] = [];

const toggle = async (value: boolean) => {
  changes.length = 0;
  await render(<DotToggle testID="toggle" dotSize={2} value={value} onValueChange={(next) => changes.push(next)} />);

  return screen.getByTestId('toggle');
};

describe('토글', () => {
  it('꺼진 토글을 누르면 켜짐을 넘긴다', async () => {
    await fireEvent.press(await toggle(false));

    expect(changes).toEqual([true]);
  });

  it('켜진 토글을 누르면 꺼짐을 넘긴다', async () => {
    await fireEvent.press(await toggle(true));

    expect(changes).toEqual([false]);
  });
});
