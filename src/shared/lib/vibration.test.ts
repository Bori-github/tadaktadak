import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { type HapticEvent } from '@modules/haptic-pattern';

import { prepareVibration, vibrate } from './vibration';

const PATTERN: HapticEvent[] = [{ type: 'transient', timeMs: 0, intensity: 0.4, sharpness: 0.5 }];

const mockPreparedNames: string[] = [];
const mockPlayedNames: string[] = [];

jest.mock('@modules/haptic-pattern', () => ({
  hapticPattern: {
    prepareAsync: async (name: string) => {
      mockPreparedNames.push(name);
    },
    play: (name: string) => {
      mockPlayedNames.push(name);
    },
  },
}));

beforeEach(() => {
  mockPreparedNames.length = 0;
  mockPlayedNames.length = 0;
});

describe('조작 진동', () => {
  it('등록한 이름으로 재생한다', () => {
    prepareVibration(PATTERN);
    vibrate();

    expect(mockPreparedNames).toEqual([expect.any(String)]);
    expect(mockPlayedNames).toEqual(mockPreparedNames);
  });
});
