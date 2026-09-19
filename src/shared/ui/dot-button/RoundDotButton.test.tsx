import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { NOTIFICATION_OFF_ICON } from '@/shared/ui/dot-icon';

import { RoundDotButton } from './RoundDotButton';

/** 진동을 재생한 횟수 */
let mockVibrations = 0;

jest.mock('@modules/haptic-pattern', () => ({
  hapticPattern: {
    play: () => {
      mockVibrations += 1;
    },
  },
}));

let presses = 0;

const button = async ({ disabled = false, dotSize = 2 } = {}) => {
  presses = 0;
  mockVibrations = 0;
  await render(
    <RoundDotButton
      dotSize={dotSize}
      icon={NOTIFICATION_OFF_ICON}
      disabled={disabled}
      onPress={() => {
        presses += 1;
      }}
    />,
  );

  return screen.getByRole('button');
};

const sizeOf = ({ props }: { props: Record<string, unknown> }) => {
  const { width, height } = Object.assign({}, ...[props.style].flat()) as { width: number; height: number };
  return { width, height };
};

describe('원 버튼 크기와 터치 영역', () => {
  it('기준 화면에서 원 버튼은 48 × 48이다', async () => {
    expect(sizeOf(await button())).toEqual({ width: 48, height: 48 });
  });

  it('도트 4에서 원 버튼은 96 × 96이다', async () => {
    expect(sizeOf(await button({ dotSize: 4 }))).toEqual({ width: 96, height: 96 });
  });

  // 사방 4씩 넓혀 기준 화면에서 56 × 56. `DESIGN.md` §4
  it('원 버튼의 터치 영역은 사방으로 4씩 넓다', async () => {
    expect((await button()).props.hitSlop).toBe(4);
  });
});

describe('누름', () => {
  it('원 버튼을 누르면 onPress가 불린다', async () => {
    await fireEvent.press(await button());

    expect(presses).toBe(1);
  });

  it('원 버튼을 누르는 순간 진동한다', async () => {
    await fireEvent(await button(), 'pressIn');

    expect(mockVibrations).toBe(1);
  });
});

describe('disabled 상태', () => {
  it('disabled 상태의 원 버튼은 눌러도 onPress가 불리지 않는다', async () => {
    await fireEvent.press(await button({ disabled: true }));

    expect(presses).toBe(0);
  });

  it('disabled 상태의 원 버튼은 누르는 순간 진동하지 않는다', async () => {
    await fireEvent(await button({ disabled: true }), 'pressIn');

    expect(mockVibrations).toBe(0);
  });
});

describe('누르는 중에 disabled 상태가 됨', () => {
  const touch = () => ({
    persist: () => {},
    currentTarget: 1,
    nativeEvent: { locationX: 0, locationY: 0, pageX: 0, pageY: 0, timestamp: 0, touches: [], changedTouches: [], identifier: 0, target: 1 },
  });

  // RNTL의 fireEvent는 disabled 요소에 이벤트를 보내지 않아 핸들러를 직접 호출함
  it('누르는 중에 disabled 상태가 된 원 버튼은 손을 떼도 onPress가 불리지 않는다', async () => {
    presses = 0;
    const onPress = () => {
      presses += 1;
    };
    const { rerender } = await render(<RoundDotButton dotSize={2} icon={NOTIFICATION_OFF_ICON} onPress={onPress} />);
    await fireEvent(screen.getByRole('button'), 'responderGrant', touch());
    await rerender(<RoundDotButton dotSize={2} icon={NOTIFICATION_OFF_ICON} disabled onPress={onPress} />);

    const release = screen.getByRole('button').props.onResponderRelease as (event: ReturnType<typeof touch>) => void;
    await act(() => release(touch()));

    expect(presses).toBe(0);
  });
});
