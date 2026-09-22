import { describe, expect, it } from '@jest/globals';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DotModalStack, type DotModalScreen } from './DotModalStack';

type StackView = 'first' | 'second';

const stackScreens: Record<StackView, DotModalScreen<StackView>> = {
  first: {
    heightInDots: 120,
    render: ({ open }) => (
      <>
        <Pressable testID="to-second" onPress={() => open('second')}>
          <Text>첫 화면</Text>
        </Pressable>
        <Pressable
          testID="to-second-twice"
          onPress={() => {
            open('second');
            open('second');
          }}
        />
      </>
    ),
  },
  second: {
    heightInDots: 120,
    render: () => <Text>두번째 화면</Text>,
  },
};

const stack = (visible: boolean) => <DotModalStack visible={visible} dotSize={2} initial="first" screens={stackScreens} onClose={() => {}} />;

describe('DotModalStack', () => {
  it('닫았다 다시 열면 첫 화면을 보여준다', async () => {
    await render(stack(true));
    await fireEvent.press(screen.getByTestId('to-second'));

    expect(screen.queryByText('두번째 화면')).not.toBeNull();

    await screen.rerender(stack(false));
    await screen.rerender(stack(true));

    expect(screen.queryByText('첫 화면')).not.toBeNull();
  });

  it('같은 화면을 연달아 열어도 뒤로 한 번에 첫 화면으로 돌아간다', async () => {
    await render(stack(true));
    await fireEvent.press(screen.getByTestId('to-second-twice'));
    await fireEvent.press(screen.getByTestId('modal-back'));

    expect(screen.queryByText('첫 화면')).not.toBeNull();
  });
});
