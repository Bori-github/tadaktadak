import { describe, expect, it } from '@jest/globals';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DotModalStack, type DotModalScreen } from './DotModalStack';

type StackView = 'first' | 'second';

const stackScreens: Record<StackView, DotModalScreen<StackView>> = {
  first: {
    heightInDots: 120,
    render: ({ open }) => (
      <Pressable testID="to-second" onPress={() => open('second')}>
        <Text>첫 화면</Text>
      </Pressable>
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
});
