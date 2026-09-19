import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { PLAY_ICON } from '@/shared/ui/dot-icon';

import { DotButton } from './DotButton';

let mockVibrations = 0;

jest.mock('@modules/haptic-pattern', () => ({
  hapticPattern: {
    play: () => {
      mockVibrations += 1;
    },
  },
}));

let presses = 0;

const onPress = () => {
  presses += 1;
};

const button = async ({ disabled = false, dotSize = 2 } = {}) => {
  presses = 0;
  mockVibrations = 0;
  await render(<DotButton dotSize={dotSize} icon={PLAY_ICON} disabled={disabled} onPress={onPress} />);

  return screen.getByRole('button');
};

const sizeOf = ({ props }: { props: Record<string, unknown> }) => {
  const { width, height } = Object.assign({}, ...[props.style].flat()) as { width: number; height: number };
  return { width, height };
};

describe('조작 버튼 크기와 터치 영역', () => {
  it('기준 화면에서 조작 버튼은 56 × 56이다', async () => {
    expect(sizeOf(await button())).toEqual({ width: 56, height: 56 });
  });

  it('도트 4에서 조작 버튼은 112 × 112다', async () => {
    expect(sizeOf(await button({ dotSize: 4 }))).toEqual({ width: 112, height: 112 });
  });

  it('조작 버튼의 터치 영역은 사방으로 4씩 넓다', async () => {
    expect((await button()).props.hitSlop).toBe(4);
  });
});

describe('누름', () => {
  it('조작 버튼을 누르면 onPress가 불린다', async () => {
    await fireEvent.press(await button());

    expect(presses).toBe(1);
  });

  it('조작 버튼을 누르는 순간 진동한다', async () => {
    await fireEvent(await button(), 'pressIn');

    expect(mockVibrations).toBe(1);
  });
});

describe('disabled 상태', () => {
  it('disabled 상태의 조작 버튼은 눌러도 onPress가 불리지 않는다', async () => {
    await fireEvent.press(await button({ disabled: true }));

    expect(presses).toBe(0);
  });

  it('disabled 상태의 조작 버튼은 누르는 순간 진동하지 않는다', async () => {
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

  // RNTL fireEvent는 disabled 요소를 건너뛰므로 onResponderRelease를 직접 호출함
  it('누르는 중에 disabled 상태가 된 조작 버튼은 손을 떼도 onPress가 불리지 않는다', async () => {
    presses = 0;
    const { rerender } = await render(<DotButton dotSize={2} icon={PLAY_ICON} onPress={onPress} />);
    await fireEvent(screen.getByRole('button'), 'responderGrant', touch());
    await rerender(<DotButton dotSize={2} icon={PLAY_ICON} disabled onPress={onPress} />);

    const release = screen.getByRole('button').props.onResponderRelease as (event: ReturnType<typeof touch>) => void;
    await act(() => release(touch()));

    expect(presses).toBe(0);
  });
});
