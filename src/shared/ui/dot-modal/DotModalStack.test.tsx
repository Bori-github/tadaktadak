import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BackHandler, Pressable, Text, type HardwareBackPressEvent } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

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

const stack = (visible: boolean, onClose = () => {}) => <DotModalStack visible={visible} dotSize={2} initial="first" screens={stackScreens} onClose={onClose} />;

type BackPressHandler = (event: HardwareBackPressEvent) => boolean | null | undefined;

const backPressHandlers = new Set<BackPressHandler>();

const pressBack = async () => {
  await act(() => {
    backPressHandlers.forEach((handler) => handler({ type: 'hardwareBackPress', timeStamp: 0 }));
  });
};

beforeEach(() => {
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_eventName, handler) => {
    backPressHandlers.add(handler);

    return {
      remove: () => {
        backPressHandlers.delete(handler);
      },
    };
  });
});

afterEach(() => {
  backPressHandlers.clear();
  jest.restoreAllMocks();
});

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

  it('두번째 화면에서 Android 뒤로 버튼을 누르면 첫 화면으로 돌아간다', async () => {
    await render(stack(true));
    await fireEvent.press(screen.getByTestId('to-second'));
    await pressBack();

    expect(screen.queryByText('첫 화면')).not.toBeNull();
  });

  it('첫 화면에서 Android 뒤로 버튼을 누르면 모달을 닫는다', async () => {
    const onClose = jest.fn();
    await render(stack(true, onClose));
    await pressBack();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('닫힌 모달은 Android 뒤로 버튼을 처리하지 않는다', async () => {
    const onClose = jest.fn();
    await render(stack(false, onClose));
    await pressBack();

    expect(onClose).not.toHaveBeenCalled();
  });
});
