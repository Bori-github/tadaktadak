import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { NotificationSettingsButton } from './NotificationSettingsButton';

/** 기준 화면에서 알림 설정 버튼 중심. `DESIGN.md` §5 */
const CENTER_X = 358;
const CENTER_Y = 79;

type Rect = { left: number; top: number; width: number; height: number };

const button = async (dotSize = 2) => {
  await render(<NotificationSettingsButton centerX={CENTER_X} centerY={CENTER_Y} dotSize={dotSize} onPressedChange={() => {}} />);

  return screen.getByRole('button');
};

const rect = ({ props }: { props: Record<string, unknown> }): Rect => {
  const { left, top, width, height } = props.style as Rect;
  return { left, top, width, height };
};

describe('터치 영역', () => {
  it('기준 화면에서 56 × 56이고 버튼 중심에 놓인다', async () => {
    expect(rect(await button())).toEqual({ left: 330, top: 51, width: 56, height: 56 });
  });

  it('도트 4에서 한 변이 104다', async () => {
    // 지름 24 도트 × 4 + 여백 8. `DESIGN.md` §4
    expect(rect(await button(4)).width).toBe(104);
  });
});
