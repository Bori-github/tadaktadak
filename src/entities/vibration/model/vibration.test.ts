import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { type HapticEvent } from '@modules/haptic-pattern';

import { canVibrate, holdVibration, playVibration, playVibrationPattern, prepareVibration, releaseVibration, restoreVibrationEnabled, setVibrationEnabled } from './vibration';

const PATTERN: HapticEvent[] = [{ type: 'transient', timeMs: 0, intensity: 0.4, sharpness: 0.5 }];

type PreparedCall = { name: string; events: HapticEvent[] };

const mockPrepared: PreparedCall[] = [];
const mockPlayedNames: string[] = [];
const mockPlayedPatterns: HapticEvent[][] = [];
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
  mockPlayedPatterns.length = 0;
  mockModule = {
    supportsHaptics: true,
    prepareAsync: async (name: string, events: HapticEvent[]) => {
      mockPrepared.push({ name, events });
    },
    play: (name: string) => {
      mockPlayedNames.push(name);
    },
    playAsync: async (events: HapticEvent[]) => {
      mockPlayedPatterns.push(events);
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

describe('진동 사용 여부', () => {
  // 저장소와 모듈의 진동 사용 여부를 함께 초기화해 첫 실행 상태에서 시작
  beforeEach(async () => {
    await AsyncStorage.clear();
    await restoreVibrationEnabled();
    prepareVibration(PATTERN);
  });

  it('저장된 진동 사용 여부가 없으면 켜져 있다', () => {
    expect(canVibrate()).toBe(true);
  });

  it('끄면 조작 진동을 재생하지 않는다', () => {
    setVibrationEnabled(false);
    playVibration();

    expect(mockPlayedNames).toEqual([]);
  });

  it('끄면 완료 진동을 재생하지 않는다', () => {
    setVibrationEnabled(false);
    playVibrationPattern(PATTERN);

    expect(mockPlayedPatterns).toEqual([]);
  });

  it('끈 진동 사용 여부는 다음 실행에서도 꺼져 있다', async () => {
    setVibrationEnabled(false);
    await restoreVibrationEnabled();

    expect(canVibrate()).toBe(false);
  });
});
