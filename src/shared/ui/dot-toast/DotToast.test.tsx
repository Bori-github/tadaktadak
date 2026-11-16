import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { StyleSheet, Text } from 'react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { DotToast } from './DotToast';

import { WARNING_ICON } from '@/shared/ui/dot-icon';
import { PortalHost } from '@/shared/ui/portal';

const TEXT = '이미 시작한 타이머가 있어요!';
const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const TOP = 111;

const renderToast = async ({ isVisible = true }: { isVisible?: boolean } = {}) => {
  const onClose = jest.fn();

  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PortalHost>
        <Text>화면</Text>
        <DotToast testID="toast" text={TEXT} icon={WARNING_ICON} dotSize={2} top={TOP} isVisible={isVisible} onClose={onClose} />
      </PortalHost>
    </SafeAreaProvider>,
  );

  const host = screen.getByText('화면').parent;

  if (!host) throw new Error('PortalHost View를 찾지 못함');

  await fireEvent(host, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: METRICS.frame.width, height: METRICS.frame.height } } });

  return onClose;
};

/** 측정용 `Text`에 레이아웃 전달. 문구 너비 (px) */
const layoutText = async (width: number) => {
  const [measurer] = screen.getAllByText(TEXT);

  if (!measurer) throw new Error('측정용 Text를 찾지 못함');

  await fireEvent(measurer, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height: 20 } } });
};

const toastStyle = () => StyleSheet.flatten(screen.getByTestId('toast').props.style);

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('화면 위쪽 가운데에 표시하는 도트 토스트', () => {
  it('토스트를 숨기면 문구를 렌더링하지 않는다', async () => {
    await renderToast({ isVisible: false });

    expect(screen.queryByText(TEXT)).toBeNull();
  });

  it('토스트는 문구 크기를 측정한 뒤 몸통을 그린다', async () => {
    await renderToast();
    expect(screen.queryByTestId('toast')).toBeNull();

    await layoutText(80);

    expect(screen.getByTestId('toast')).toBeTruthy();
  });

  it('토스트 너비는 좌우 안쪽 여백, 아이콘, 간격, 문구 너비의 합을 도트 단위로 올린 값이다', async () => {
    await renderToast();
    // 14 + 24 + 10 + 81 + 14 = 143. 도트 2px 단위 올림으로 144
    await layoutText(81);

    expect(toastStyle().width).toBe(144);
    expect(toastStyle().left).toBe((METRICS.frame.width - 144) / 2);
    expect(toastStyle().top).toBe(TOP);
  });

  it('토스트 표시 중 화면에 터치가 닿으면 onClose를 호출한다', async () => {
    const onClose = await renderToast();
    await layoutText(80);

    await act(() => {
      fireGestureHandler(getByGestureTestId('portal-dismiss-layer'));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('토스트는 표시되고 3.5초가 지나면 onClose를 호출한다', async () => {
    const onClose = await renderToast();
    await layoutText(80);

    await act(() => {
      jest.advanceTimersByTime(3499);
    });
    expect(onClose).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
