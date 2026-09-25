import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { type HapticEvent } from '@modules/haptic-pattern';

import {
  canVibrate,
  holdVibration,
  playVibration,
  playVibrationPattern,
  prepareVibration,
  previewVibration,
  releaseVibration,
  restoreVibrationEnabled,
  setVibrationEnabled,
} from './vibration';

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

  it('네이티브 모듈이 없으면 holdVibration과 releaseVibration이 예외 없이 반환한다', () => {
    mockModule = null;

    expect(() => {
      holdVibration();
      releaseVibration();
    }).not.toThrow();
  });
});

describe('네이티브 모듈이 없는 빌드의 Vibration.vibrate 대체 재생', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await restoreVibrationEnabled();
    mockModule = null;
    jest.mocked(Vibration.vibrate).mockClear();
  });

  it('playVibration은 등록한 transient 패턴을 5ms 진동 배열로 변환해 재생한다', () => {
    prepareVibration(PATTERN);
    playVibration();

    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 5]);
  });

  it('timeMs가 같은 이벤트는 최대 진동 시간 하나로 병합해 대기·진동 시간 배열로 변환한다', () => {
    playVibrationPattern([
      { type: 'continuous', timeMs: 0, durationMs: 60, intensity: 1, sharpness: 0.3 },
      { type: 'transient', timeMs: 0, intensity: 1, sharpness: 0.9 },
      { type: 'continuous', timeMs: 180, durationMs: 60, intensity: 1, sharpness: 0.3 },
    ]);

    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 60, 120, 60]);
  });

  it('canVibrate는 진동 사용 여부 설정값을 그대로 반환한다', () => {
    expect(canVibrate()).toBe(true);

    setVibrationEnabled(false);

    expect(canVibrate()).toBe(false);
  });

  it('진동 사용 여부가 꺼져 있으면 조작 진동과 완료 진동을 재생하지 않는다', () => {
    prepareVibration(PATTERN);
    setVibrationEnabled(false);
    playVibration();
    playVibrationPattern(PATTERN);

    expect(Vibration.vibrate).not.toHaveBeenCalled();
  });

  it('진동 사용 여부가 꺼져 있어도 previewVibration은 토글 피드백 진동을 재생한다', () => {
    setVibrationEnabled(false);
    previewVibration(PATTERN);

    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 5]);
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

  it('꺼져 있어도 토글 피드백 진동은 재생한다', () => {
    setVibrationEnabled(false);
    previewVibration(PATTERN);

    expect(mockPlayedPatterns).toEqual([PATTERN]);
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
