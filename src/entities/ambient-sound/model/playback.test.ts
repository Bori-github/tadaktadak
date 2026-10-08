import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { setAmbientSoundEnabled } from './store';
import { useAmbientSoundPlayback } from './playback';

type MockPlayer = { loop: boolean; volume: number; isPlaying: boolean; isRemoved: boolean };

const mockPlayers: MockPlayer[] = [];
let mockPlayError: Error | null = null;

jest.mock('expo-audio', () => ({
  setAudioModeAsync: async () => {},
  createAudioPlayer: () => {
    const player = {
      loop: false,
      volume: 1,
      isPlaying: false,
      isRemoved: false,
      play: () => {
        if (mockPlayError) throw mockPlayError;
        player.isPlaying = true;
      },
      pause: () => {
        player.isPlaying = false;
      },
      remove: () => {
        player.isRemoved = true;
      },
    };
    mockPlayers.push(player);
    return player;
  },
}));

const mockAppStateListeners: ((state: AppStateStatus) => void)[] = [];

// jest-expo가 `currentState`를 함수로 모의함. 실제 React Native는 문자열이라 문자열을 주도록 되돌림
let mockAppState: AppStateStatus = 'active';

Object.defineProperty(AppState, 'currentState', { configurable: true, get: () => mockAppState });

const changeAppState = (state: AppStateStatus): void => {
  mockAppState = state;
  for (const listener of mockAppStateListeners) listener(state);
};

beforeEach(() => {
  jest.useFakeTimers();
  mockPlayers.length = 0;
  mockPlayError = null;
  mockAppState = 'active';
  mockAppStateListeners.length = 0;
  jest.mocked(AppState.addEventListener).mockImplementation((_type, listener) => {
    mockAppStateListeners.push(listener);
    return {
      remove: () => {
        mockAppStateListeners.splice(mockAppStateListeners.indexOf(listener), 1);
      },
    };
  });
  setAmbientSoundEnabled(false);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('배경음 재생', () => {
  it('배경음이 꺼져 있으면 재생하지 않는다', async () => {
    await renderHook(() => useAmbientSoundPlayback({ canPlay: true }));

    expect(mockPlayers).toHaveLength(0);
  });

  it('배경음을 켜면 음량 0에서 반복 재생을 시작하고 2초 뒤 음량이 1이 된다', async () => {
    await renderHook(() => useAmbientSoundPlayback({ canPlay: true }));
    await act(async () => setAmbientSoundEnabled(true));

    expect(mockPlayers[0]).toMatchObject({ loop: true, volume: 0, isPlaying: true });

    await act(async () => jest.advanceTimersByTime(1000));
    expect(mockPlayers[0]?.volume).toBeCloseTo(0.5, 1);

    await act(async () => jest.advanceTimersByTime(1000));
    expect(mockPlayers[0]?.volume).toBe(1);
  });

  it('배경음을 끄면 재생을 즉시 정지한다', async () => {
    await renderHook(() => useAmbientSoundPlayback({ canPlay: true }));
    await act(async () => setAmbientSoundEnabled(true));
    await act(async () => setAmbientSoundEnabled(false));

    expect(mockPlayers[0]).toMatchObject({ isPlaying: false, isRemoved: true });
  });

  it('앱이 백그라운드로 전환되면 정지하고 포그라운드로 복귀하면 다시 재생한다', async () => {
    await renderHook(() => useAmbientSoundPlayback({ canPlay: true }));
    await act(async () => setAmbientSoundEnabled(true));

    await act(async () => changeAppState('background'));
    expect(mockPlayers[0]).toMatchObject({ isPlaying: false, isRemoved: true });

    await act(async () => changeAppState('active'));
    expect(mockPlayers[1]).toMatchObject({ volume: 0, isPlaying: true });
  });

  it('앱이 inactive 상태가 되어도 재생을 유지한다', async () => {
    await renderHook(() => useAmbientSoundPlayback({ canPlay: true }));
    await act(async () => setAmbientSoundEnabled(true));

    await act(async () => changeAppState('inactive'));

    expect(mockPlayers).toHaveLength(1);
    expect(mockPlayers[0]).toMatchObject({ isPlaying: true, isRemoved: false });
  });

  it('재생 시작에 실패하면 throw하지 않고 플레이어를 해제한다', async () => {
    mockPlayError = new Error('오디오 세션 활성화 실패');
    await renderHook(() => useAmbientSoundPlayback({ canPlay: true }));

    await act(async () => setAmbientSoundEnabled(true));

    expect(mockPlayers[0]).toMatchObject({ isPlaying: false, isRemoved: true });
  });

  it('배경음이 켜져 있어도 재생 가능 상태가 되기 전에는 재생하지 않는다', async () => {
    setAmbientSoundEnabled(true);
    const { rerender } = await renderHook(({ canPlay }: { canPlay: boolean }) => useAmbientSoundPlayback({ canPlay }), { initialProps: { canPlay: false } });
    expect(mockPlayers).toHaveLength(0);

    await rerender({ canPlay: true });
    expect(mockPlayers[0]).toMatchObject({ isPlaying: true });
  });

  it('재생 중에 재생 불가 상태가 되면 즉시 정지한다', async () => {
    setAmbientSoundEnabled(true);
    const { rerender } = await renderHook(({ canPlay }: { canPlay: boolean }) => useAmbientSoundPlayback({ canPlay }), { initialProps: { canPlay: true } });
    expect(mockPlayers[0]).toMatchObject({ isPlaying: true });

    await rerender({ canPlay: false });
    expect(mockPlayers[0]).toMatchObject({ isPlaying: false, isRemoved: true });
  });
});
