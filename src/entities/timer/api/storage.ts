import AsyncStorage from '@react-native-async-storage/async-storage';

import { type TimerMode } from '../model/mode';
import { parseMinutes, parseSession } from '../model/parse';
import { serializeSession } from '../model/serialize';
import { type TimerSession } from '../model/session';

const SESSION_KEY = 'timer.session';
const MINUTES_KEY: Record<TimerMode, string> = { focus: 'timer.minutes.focus', rest: 'timer.minutes.rest' };

/**
 * 기기에 저장된 타이머 세션 값
 *
 * @returns 이어갈 수 있는 타이머 세션 값. 없거나 현재 스키마와 맞지 않으면 `null`
 */
export const loadSession = async (): Promise<TimerSession | null> => parseSession(await AsyncStorage.getItem(SESSION_KEY));

/**
 * 타이머 세션 값을 기기에 저장
 *
 * @param session - 지금 타이머 세션 값. 대기면 저장값을 제거
 * @returns 저장이 끝나면 이행하는 프로미스
 */
export const saveSession = async (session: TimerSession): Promise<void> => {
  const serialized = serializeSession(session);
  return serialized === null ? AsyncStorage.removeItem(SESSION_KEY) : AsyncStorage.setItem(SESSION_KEY, serialized);
};

/**
 * 기기에 저장된 마지막 타이머 시간(분) 읽기
 *
 * @returns 집중/휴식 타이머(분). 기기에 저장된 값이 없으면 기본값 반환
 */
export const loadMinutes = async (): Promise<Record<TimerMode, number>> => {
  const [focus, rest] = await Promise.all([AsyncStorage.getItem(MINUTES_KEY.focus), AsyncStorage.getItem(MINUTES_KEY.rest)]);
  return { focus: parseMinutes(focus, 'focus'), rest: parseMinutes(rest, 'rest') };
};

/**
 * 마지막 타이머 시간(분)을 기기에 저장
 *
 * @param mode - 타이머 모드(집중/휴식)
 * @param minutes - 설정한 타이머 시간(분)
 * @returns 저장이 끝나면 이행하는 프로미스
 */
export const saveMinutes = async (mode: TimerMode, minutes: number): Promise<void> => AsyncStorage.setItem(MINUTES_KEY[mode], String(minutes));
