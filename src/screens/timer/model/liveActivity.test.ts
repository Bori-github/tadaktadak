import { renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { type LiveActivityContent } from '@modules/live-activity';

import { useLiveActivity } from './liveActivity';

import { MINUTE_IN_MS, type RunningSession, type TimerMode, type TimerSession } from '@/entities/timer';

const mockStarted: LiveActivityContent[] = [];
let mockEndCount = 0;

jest.mock('@modules/live-activity', () => ({
  liveActivity: {
    startAsync: async (content: LiveActivityContent) => {
      mockStarted.push(content);
    },
    endAsync: async () => {
      mockEndCount += 1;
    },
  },
}));

const SETTING_MINUTES: Record<TimerMode, number> = { focus: 25, rest: 5 };

const FOCUS_MS = SETTING_MINUTES.focus * MINUTE_IN_MS;

// 훅이 안에서 `Date.now()`를 읽어, 고정값을 쓰면 끝난 세션이 되어 시작하지 않음
// 재개한 세션이라 `startedAt`은 10분 전이고 남은 시간은 25분. 두 값이 갈라져야 진행 막대 계산이 검증됨
const running = (): RunningSession => {
  const now = Date.now();

  return { phase: 'running', mode: 'focus', startedAt: now - 10 * MINUTE_IN_MS, endsAt: now + FOCUS_MS };
};

const READY: TimerSession = { phase: 'ready', mode: 'focus' };

const render = async (session: TimerSession, isSettled = true) => renderHook(() => useLiveActivity({ session, settingMinutes: SETTING_MINUTES, isSettled }));

describe('Live Activity 수명', () => {
  beforeEach(() => {
    mockStarted.length = 0;
    mockEndCount = 0;
  });

  it('저장값을 읽기 전에는 아무것도 하지 않는다', async () => {
    await render(running(), false);

    expect(mockStarted).toHaveLength(0);
    expect(mockEndCount).toBe(0);
  });

  it('진행에 들어가면 끝날 시각을 넘겨 시작한다', async () => {
    const session = running();

    await render(session);

    expect(mockStarted).toEqual([{ mode: 'focus', progressStartsAt: session.endsAt - FOCUS_MS, endsAt: session.endsAt }]);
  });

  it('진행이 아니면 끝낸다', async () => {
    await render(READY);

    expect(mockEndCount).toBe(1);
    expect(mockStarted).toHaveLength(0);
  });

  it('같은 세션 값으로 다시 그려도 한 번만 부른다', async () => {
    const { rerender } = await render(running());

    await rerender(undefined);

    expect(mockStarted).toHaveLength(1);
  });
});
