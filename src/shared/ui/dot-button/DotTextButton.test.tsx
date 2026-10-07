import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DotTextButton } from './DotTextButton';

let presses = 0;

const button = async () => {
  presses = 0;
  await render(
    <DotTextButton
      dotSize={2}
      widthInDots={76}
      heightInDots={24}
      label="다시 시작"
      onPress={() => {
        presses += 1;
      }}
    />,
  );

  return screen.getByRole('button');
};

describe('글자 버튼', () => {
  it('도트 2에서 76 × 24 도트 버튼은 152 × 48이다', async () => {
    const { width, height } = Object.assign({}, ...[(await button()).props.style].flat()) as { width: number; height: number };

    expect({ width, height }).toEqual({ width: 152, height: 48 });
  });

  it('버튼에 글자를 표시한다', async () => {
    await button();

    expect(screen.getByText('다시 시작')).toBeTruthy();
  });

  it('버튼을 누르면 onPress가 불린다', async () => {
    await fireEvent.press(await button());

    expect(presses).toBe(1);
  });
});
