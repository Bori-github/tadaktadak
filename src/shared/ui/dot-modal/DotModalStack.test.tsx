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

/**
 * 하드웨어 뒤로 가기 이벤트 발생
 *
 * @returns 이벤트 소비 여부. false면 Android 기본 동작(앱 종료) 실행
 */
const pressBack = async (): Promise<boolean> => {
  let isHandled = false;

  await act(() => {
    // Android BackHandler와 동일하게 최근 등록 리스너부터 호출, true 반환 시 전파 중단
    isHandled = [...backPressHandlers].reverse().some((handler) => handler({ type: 'hardwareBackPress', timeStamp: 0 }) === true);
  });

  return isHandled;
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
  it('닫은 뒤 다시 표시하면 스택이 첫 화면으로 초기화된다', async () => {
    await render(stack(true));
    await fireEvent.press(screen.getByTestId('to-second'));

    expect(screen.queryByText('두번째 화면')).not.toBeNull();

    await screen.rerender(stack(false));
    await screen.rerender(stack(true));

    expect(screen.queryByText('첫 화면')).not.toBeNull();
  });

  it('같은 화면 연속 push 시 스택에 한 번만 쌓인다', async () => {
    await render(stack(true));
    await fireEvent.press(screen.getByTestId('to-second-twice'));
    await fireEvent.press(screen.getByTestId('modal-back'));

    expect(screen.queryByText('첫 화면')).not.toBeNull();
  });

  it('두번째 화면에서 하드웨어 뒤로 가기 이벤트 발생 시 첫 화면으로 복귀한다', async () => {
    await render(stack(true));
    await fireEvent.press(screen.getByTestId('to-second'));
    await pressBack();

    expect(screen.queryByText('첫 화면')).not.toBeNull();
  });

  it('첫 화면에서 하드웨어 뒤로 가기 이벤트 발생 시 모달을 닫는다', async () => {
    const onClose = jest.fn();
    await render(stack(true, onClose));
    await pressBack();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('표시 중인 모달은 하드웨어 뒤로 가기 이벤트를 소비해 앱 종료를 막는다', async () => {
    await render(stack(true));

    expect(await pressBack()).toBe(true);
  });

  it('닫힌 상태로 마운트된 모달은 하드웨어 뒤로 가기 이벤트를 처리하지 않는다', async () => {
    const onClose = jest.fn();
    await render(stack(false, onClose));
    await pressBack();

    expect(onClose).not.toHaveBeenCalled();
  });

  it('닫힌 모달은 하드웨어 뒤로 가기 리스너를 해제한다', async () => {
    const onClose = jest.fn();
    await render(stack(true, onClose));
    await screen.rerender(stack(false, onClose));

    expect(await pressBack()).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('닫힌 모달은 터치 이벤트를 받지 않는다', async () => {
    const onClose = jest.fn();
    await render(stack(false, onClose));
    await fireEvent.press(screen.getByTestId('modal-close'));

    expect(onClose).not.toHaveBeenCalled();
  });
});
