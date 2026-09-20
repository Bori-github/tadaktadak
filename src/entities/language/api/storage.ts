import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseLanguage, type Language } from '../model/language';

const LANGUAGE_KEY = 'language';

/**
 * 기기에 저장된 선택한 언어 읽기
 *
 * @returns 저장된 언어. 선택한 적이 없거나 지원 목록에 없으면 `null`
 */
export const loadLanguage = async (): Promise<Language | null> => parseLanguage(await AsyncStorage.getItem(LANGUAGE_KEY));

/**
 * 선택한 언어를 기기에 저장
 *
 * @returns 저장이 끝나면 이행하는 프로미스
 */
export const saveLanguage = async (language: Language): Promise<void> => AsyncStorage.setItem(LANGUAGE_KEY, language);

/**
 * 선택한 언어를 기기에서 지움. 기기 언어를 따르는 상태로 되돌림
 *
 * @returns 지우기가 끝나면 이행하는 프로미스
 */
export const clearLanguage = async (): Promise<void> => AsyncStorage.removeItem(LANGUAGE_KEY);
