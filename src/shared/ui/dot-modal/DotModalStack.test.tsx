import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BackHandler, Pressable, Text, type HardwareBackPressEvent } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

const stack = (onClose = () => {}) => (
  <SafeAreaProvider initialMetrics={metrics}>
    <DotModalStack dotSize={2} initial="first" screens={stackScreens} onClose={onClose} />
  </SafeAreaProvider>
);

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
  it('같은 화면 연속 push 시 스택에 한 번만 쌓인다', async () => {
    await render(stack());
    await fireEvent.press(screen.getByTestId('to-second-twice'));
    await fireEvent.press(screen.getByTestId('modal-back'));

    expect(screen.queryByText('첫 화면')).not.toBeNull();
  });

  it('두번째 화면에서 하드웨어 뒤로 가기 이벤트 발생 시 첫 화면으로 복귀한다', async () => {
    await render(stack());
    await fireEvent.press(screen.getByTestId('to-second'));
    await pressBack();

    expect(screen.queryByText('첫 화면')).not.toBeNull();
  });

  it('첫 화면에서 하드웨어 뒤로 가기 이벤트 발생 시 모달을 닫는다', async () => {
    const onClose = jest.fn();
    await render(stack(onClose));
    await pressBack();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('표시 중인 모달은 하드웨어 뒤로 가기 이벤트를 소비해 앱 종료를 막는다', async () => {
    await render(stack());

    expect(await pressBack()).toBe(true);
  });

  it('언마운트된 모달은 하드웨어 뒤로 가기 리스너를 해제한다', async () => {
    const onClose = jest.fn();
    await render(stack(onClose));
    await screen.unmount();

    expect(await pressBack()).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });
});
