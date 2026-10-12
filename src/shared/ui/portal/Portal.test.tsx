import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BackHandler, Text, type HardwareBackPressEvent } from 'react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { act, render, screen } from '@testing-library/react-native';

import { Portal, PortalHost } from './Portal';

type BackPressHandler = (event: HardwareBackPressEvent) => boolean | null | undefined;

const backPressHandlers = new Set<BackPressHandler>();

const pressBack = async (): Promise<boolean> => {
  let isHandled = false;

  await act(() => {
    // Android `BackHandler`처럼 마지막에 등록한 리스너부터 호출하고 `true` 반환 시 전파 중단
    isHandled = [...backPressHandlers].reverse().some((handler) => handler({ type: 'hardwareBackPress', timeStamp: 0 }) === true);
  });

  return isHandled;
};

const tapDismissLayer = async () => {
  await act(() => {
    fireGestureHandler(getByGestureTestId('portal-dismiss-layer'));
  });
};

const Screen = ({ isOpen }: { isOpen: boolean }) => (
  <PortalHost>
    <Text>화면</Text>
    {isOpen ? (
      <Portal>
        <Text>레이어</Text>
      </Portal>
    ) : null}
  </PortalHost>
);

type DismissableScreenProps = {
  isEnabled?: boolean;
  isSecondOpen?: boolean;
  onDismissFirst: () => void;
  onDismissSecond: () => void;
};

const DismissableScreen = ({ isEnabled, isSecondOpen = true, onDismissFirst, onDismissSecond }: DismissableScreenProps) => (
  <PortalHost isEnabled={isEnabled}>
    <Portal onDismiss={onDismissFirst}>
      <Text>첫 번째 레이어</Text>
    </Portal>
    {isSecondOpen ? (
      <Portal onDismiss={onDismissSecond}>
        <Text>두 번째 레이어</Text>
      </Portal>
    ) : null}
  </PortalHost>
);

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

describe('Portal', () => {
  it('Portal 내용은 PortalHost의 children 뒤에 렌더링된다', async () => {
    await render(<Screen isOpen />);

    const hostChildren = screen.getByText('화면').parent?.children;

    expect(hostChildren?.at(-1)).toBe(screen.getByText('레이어'));
  });

  it('Portal이 사라지면 내용도 PortalHost에서 사라진다', async () => {
    await render(<Screen isOpen />);

    await screen.rerender(<Screen isOpen={false} />);

    expect(screen.queryByText('레이어')).toBeNull();
  });

  it('PortalHost 밖의 Portal은 오류를 던진다', async () => {
    // React가 렌더링 오류를 `console.error`로 출력해 목으로 출력 억제
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      render(
        <Portal>
          <Text>레이어</Text>
        </Portal>,
      ),
    ).rejects.toThrow('Portal은 PortalHost 안에서만 쓸 수 있음');
  });

  it('onDismiss가 없는 Portal만 있으면 DismissLayer를 렌더링하지 않고 Android 뒤로 가기를 소비하지 않는다', async () => {
    await render(<Screen isOpen />);

    expect(() => getByGestureTestId('portal-dismiss-layer')).toThrow();
    expect(await pressBack()).toBe(false);
  });

  it('화면 터치는 마지막에 mount한 Portal의 onDismiss만 호출한다', async () => {
    const onDismissFirst = jest.fn();
    const onDismissSecond = jest.fn();
    await render(<DismissableScreen onDismissFirst={onDismissFirst} onDismissSecond={onDismissSecond} />);

    await tapDismissLayer();

    expect(onDismissSecond).toHaveBeenCalledTimes(1);
    expect(onDismissFirst).not.toHaveBeenCalled();
  });

  it('Android 뒤로 가기는 마지막에 mount한 Portal의 onDismiss만 호출하고 이벤트를 소비한다', async () => {
    const onDismissFirst = jest.fn();
    const onDismissSecond = jest.fn();
    await render(<DismissableScreen onDismissFirst={onDismissFirst} onDismissSecond={onDismissSecond} />);

    expect(await pressBack()).toBe(true);
    expect(onDismissSecond).toHaveBeenCalledTimes(1);
    expect(onDismissFirst).not.toHaveBeenCalled();
  });

  it('두 번째 Portal이 사라지면 화면 터치와 Android 뒤로 가기는 첫 번째 Portal의 onDismiss를 호출한다', async () => {
    const onDismissFirst = jest.fn();
    const onDismissSecond = jest.fn();
    await render(<DismissableScreen onDismissFirst={onDismissFirst} onDismissSecond={onDismissSecond} />);

    await screen.rerender(<DismissableScreen isSecondOpen={false} onDismissFirst={onDismissFirst} onDismissSecond={onDismissSecond} />);
    await tapDismissLayer();

    expect(await pressBack()).toBe(true);
    expect(onDismissFirst).toHaveBeenCalledTimes(2);
    expect(onDismissSecond).not.toHaveBeenCalled();
  });

  it('onDismiss가 바뀌면 BackHandler 리스너를 다시 등록하지 않고 바뀐 onDismiss를 호출한다', async () => {
    const onDismissBefore = jest.fn();
    const onDismissAfter = jest.fn();
    await render(<DismissableScreen onDismissFirst={onDismissBefore} onDismissSecond={onDismissBefore} />);

    await screen.rerender(<DismissableScreen onDismissFirst={onDismissAfter} onDismissSecond={onDismissAfter} />);
    await pressBack();

    expect(BackHandler.addEventListener).toHaveBeenCalledTimes(1);
    expect(onDismissAfter).toHaveBeenCalledTimes(1);
    expect(onDismissBefore).not.toHaveBeenCalled();
  });

  it('PortalHost가 비활성이면 Portal 내용과 DismissLayer를 렌더링하지 않고 Android 뒤로 가기를 소비하지 않는다', async () => {
    const onDismiss = jest.fn();
    await render(<DismissableScreen isEnabled={false} onDismissFirst={onDismiss} onDismissSecond={onDismiss} />);

    expect(screen.queryByText('첫 번째 레이어')).toBeNull();
    expect(() => getByGestureTestId('portal-dismiss-layer')).toThrow();
    expect(await pressBack()).toBe(false);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('PortalHost가 다시 활성화되면 Portal 내용을 렌더링하고 Android 뒤로 가기를 소비한다', async () => {
    const onDismiss = jest.fn();
    await render(<DismissableScreen isEnabled={false} onDismissFirst={onDismiss} onDismissSecond={onDismiss} />);

    await screen.rerender(<DismissableScreen isEnabled onDismissFirst={onDismiss} onDismissSecond={onDismiss} />);

    expect(screen.getByText('첫 번째 레이어')).toBeTruthy();
    expect(await pressBack()).toBe(true);
  });
});
