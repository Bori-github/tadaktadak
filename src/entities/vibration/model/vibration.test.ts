import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { type HapticEvent } from '@modules/haptic-pattern';

import { holdVibration, playVibration, prepareVibration, releaseVibration } from './vibration';

const PATTERN: HapticEvent[] = [{ type: 'transient', timeMs: 0, intensity: 0.4, sharpness: 0.5 }];

type PreparedCall = { name: string; events: HapticEvent[] };

const mockPrepared: PreparedCall[] = [];
const mockPlayedNames: string[] = [];
let mockModule: unknown;

jest.mock('@modules/haptic-pattern', () => ({
  // 게터라 읽을 때마다 돌아, 모듈을 찾지 못한 빌드를 테스트 중에 흉내 낼 수 있음
  get hapticPattern() {
    return mockModule;
  },
}));

beforeEach(() => {
  mockPrepared.length = 0;
  mockPlayedNames.length = 0;
  mockModule = {
    prepareAsync: async (name: string, events: HapticEvent[]) => {
      mockPrepared.push({ name, events });
    },
    play: (name: string) => {
      mockPlayedNames.push(name);
    },
    holdAsync: async () => {},
    release: () => {},
  };
});

describe('조작 진동', () => {
  it('등록한 이름으로 재생한다', () => {
    prepareVibration(PATTERN);
    playVibration();

    expect(mockPrepared).toEqual([{ name: expect.any(String), events: PATTERN }]);
    expect(mockPlayedNames).toEqual([mockPrepared[0]?.name]);
  });

  it('네이티브 모듈이 없으면 넷 다 아무 일도 하지 않는다', () => {
    mockModule = null;

    expect(() => {
      prepareVibration(PATTERN);
      playVibration();
      holdVibration();
      releaseVibration();
    }).not.toThrow();
  });
});
