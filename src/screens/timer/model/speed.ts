import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import { millisecondsToMinutes } from '../lib/minutes';
import { millisecondsToSeconds } from '../lib/seconds';

import { type TimerMode } from '@/entities/timer';

/**
 * 배속을 걸었을 때 실제로 흐를 설정 시간(분)
 *
 * @param settingMinutes - 화면이 보여 주는 설정 시간(분)
 * @param speed - 1이 실제 속도
 * @returns 배속만큼 짧아진 설정 시간(분)
 */
export const realMinutes = (settingMinutes: Record<TimerMode, number>, speed: number): Record<TimerMode, number> => ({
  focus: settingMinutes.focus / speed,
  rest: settingMinutes.rest / speed,
});

/**
 * 남은 실제 시간이 배속에서 보일 초
 *
 * @param realMs - 남은 실제 시간 (밀리초)
 * @param speed - 1이 실제 속도
 * @returns 화면에 보여 줄 시간(초)
 */
export const toShownSeconds = (realMs: number, speed: number): number => {
  'worklet';
  return millisecondsToSeconds(realMs * speed);
};

/**
 * 남은 실제 시간이 배속에서 보일 분
 *
 * @param realMs - 남은 실제 시간 (밀리초)
 * @param speed - 1이 실제 속도
 * @returns 화면에 보여 줄 시간(분). 초로 깎지 않아 프레임마다 값이 달라짐
 */
export const toShownMinutes = (realMs: number, speed: number): number => {
  'worklet';
  return millisecondsToMinutes(realMs * speed);
};

/**
 * 타이머 시간 배속. (개발 빌드용)
 *
 * @param settingMinutes - 화면이 보여 주는 설정 시간(분)
 * @returns 지금 배속, 배속 변경, 배속만큼 짧아진 설정 시간(분), 남은 밀리초를 보여 줄 초와 분으로 바꾸는 함수
 */
interface TimerSpeed {
  speed: number;
  setSpeed: Dispatch<SetStateAction<number>>;
  /** 배속만큼 짧아진 설정 시간(분) */
  realSettingMinutes: Record<TimerMode, number>;
  toSeconds: (ms: number) => number;
  toMinutes: (ms: number) => number;
}

export const useTimerSpeed = (settingMinutes: Record<TimerMode, number>): TimerSpeed => {
  const [speed, setSpeed] = useState(1);

  const realSettingMinutes = useMemo(() => realMinutes(settingMinutes, speed), [settingMinutes, speed]);

  const toSeconds = useCallback(
    (ms: number) => {
      'worklet';
      return toShownSeconds(ms, speed);
    },
    [speed],
  );

  const toMinutes = useCallback(
    (ms: number) => {
      'worklet';
      return toShownMinutes(ms, speed);
    },
    [speed],
  );

  return { speed, setSpeed, realSettingMinutes, toSeconds, toMinutes };
};
