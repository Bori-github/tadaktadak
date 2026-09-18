import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { NotificationSettingsButton } from './NotificationSettingsButton';

/** 기준 화면에서 알림 설정 버튼 중심. `DESIGN.md` §5 */
const CENTER_X = 32;
const CENTER_Y = 79;

type Rect = { position: string; left: number; top: number; width: number; height: number };

/** 진동을 재생한 횟수 */
let mockVibrations = 0;

jest.mock('@modules/haptic-pattern', () => ({
  hapticPattern: {
    play: () => {
      mockVibrations += 1;
    },
  },
}));

const pressedChanges: boolean[] = [];

const button = async (dotSize = 2) => {
  pressedChanges.length = 0;
  mockVibrations = 0;
  await render(<NotificationSettingsButton centerX={CENTER_X} centerY={CENTER_Y} dotSize={dotSize} onPressedChange={(pressed) => pressedChanges.push(pressed)} />);

  return screen.getByRole('button');
};

const rect = ({ props }: { props: Record<string, unknown> }): Rect => {
  const { position, left, top, width, height } = props.style as Rect;
  return { position, left, top, width, height };
};

describe('터치 영역', () => {
  it('기준 화면에서 56 × 56이고 버튼 중심에 놓인다', async () => {
    expect(rect(await button())).toEqual({ position: 'absolute', left: 4, top: 51, width: 56, height: 56 });
  });

  it('도트 4에서 한 변이 104다', async () => {
    // 지름 24 도트 × 4 + 여백 8. `DESIGN.md` §4
    expect(rect(await button(4)).width).toBe(104);
  });
});

describe('누름', () => {
  it('누르면 시스템 설정을 연다', async () => {
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    const target = await button();
    await fireEvent.press(target);

    expect(openSettings).toHaveBeenCalledTimes(1);
    openSettings.mockRestore();
  });

  it('누르는 순간 진동한다', async () => {
    const target = await button();
    fireEvent(target, 'pressIn');

    expect(mockVibrations).toBe(1);
  });

  it('누르고 뗄 때 눌림을 알린다', async () => {
    const target = await button();
    fireEvent(target, 'pressIn');
    fireEvent(target, 'pressOut');

    expect(pressedChanges).toEqual([true, false]);
  });
});
