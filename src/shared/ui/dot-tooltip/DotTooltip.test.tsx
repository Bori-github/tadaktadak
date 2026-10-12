import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { StyleSheet, Text, View } from 'react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { DotTooltip } from './DotTooltip';

import { PortalHost } from '@/shared/ui/portal';

const TEXT = '배경음 안내';
const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const ANCHOR = { x: 170, y: 60, width: 48, height: 48 };

const renderTooltip = async ({ isVisible = true, maxWidth }: { isVisible?: boolean; maxWidth?: number } = {}) => {
  const onClose = jest.fn();

  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PortalHost>
        <DotTooltip text={TEXT} dotSize={2} arrowDirection="up" arrowAlign="center" maxWidth={maxWidth} isVisible={isVisible} onClose={onClose}>
          <Text>버튼</Text>
        </DotTooltip>
      </PortalHost>
    </SafeAreaProvider>,
  );

  // `DotTooltip`이 감싼 `View`의 부모가 `PortalHost`의 `View`
  const host = screen.getByText('버튼').parent?.parent;

  if (!host) throw new Error('PortalHost View를 찾지 못함');

  await fireEvent(host, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: METRICS.frame.width, height: METRICS.frame.height } } });

  return onClose;
};

// 측정용 `Text`는 투명 컨테이너 내부에 있고 말풍선 `Text`만 절대 위치
const bubbleTexts = () => screen.queryAllByText(TEXT).filter((text) => StyleSheet.flatten(text.props.style).position === 'absolute');

const layoutText = async () => {
  await fireEvent(screen.getByText(TEXT), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 80, height: 20 } } });
};

beforeEach(() => {
  jest.spyOn(View.prototype, 'measureLayout').mockImplementation((_relativeTo, onSuccess) => {
    onSuccess(ANCHOR.x, ANCHOR.y, ANCHOR.width, ANCHOR.height);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('DotTooltip', () => {
  it('툴팁을 숨기면 문구를 렌더링하지 않는다', async () => {
    await renderTooltip({ isVisible: false });

    expect(screen.queryByText(TEXT)).toBeNull();
  });

  it('툴팁은 문구 크기를 측정한 뒤 말풍선을 그린다', async () => {
    await renderTooltip();
    expect(bubbleTexts()).toHaveLength(0);

    await layoutText();

    expect(bubbleTexts()).toHaveLength(1);
  });

  it('말풍선을 그리기 전에는 DismissLayer를 렌더링하지 않는다', async () => {
    await renderTooltip();
    expect(() => getByGestureTestId('portal-dismiss-layer')).toThrow();

    await layoutText();

    expect(getByGestureTestId('portal-dismiss-layer')).toBeTruthy();
  });

  it('툴팁 표시 중 화면에 터치가 닿으면 onClose를 호출한다', async () => {
    const onClose = await renderTooltip();
    await layoutText();

    await act(() => {
      fireGestureHandler(getByGestureTestId('portal-dismiss-layer'));
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('문구 줄바꿈 너비는 maxWidth에서 좌우 안쪽 여백을 뺀 값이다', async () => {
    await renderTooltip({ maxWidth: 100 });

    // 안쪽 여백은 배율 1에서 좌우 14px
    expect(StyleSheet.flatten(screen.getByText(TEXT).parent?.props.style).width).toBe(100 - 14 * 2);
  });
});
