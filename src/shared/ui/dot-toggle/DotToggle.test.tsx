import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DotToggle } from './DotToggle';

const changes: boolean[] = [];

const toggle = async (value: boolean) => {
  changes.length = 0;
  await render(<DotToggle testID="toggle" dotSize={2} value={value} onValueChange={(next) => changes.push(next)} />);

  return screen.getByTestId('toggle');
};

describe('누름', () => {
  it('꺼진 토글을 누르면 켜짐을 넘긴다', async () => {
    await fireEvent.press(await toggle(false));

    expect(changes).toEqual([true]);
  });

  it('켜진 토글을 누르면 꺼짐을 넘긴다', async () => {
    await fireEvent.press(await toggle(true));

    expect(changes).toEqual([false]);
  });
});
