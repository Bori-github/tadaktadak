import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'language';

/**
 * 기기에 저장된 선택한 언어 읽기
 *
 * @returns 저장된 언어 태그. 선택한 적이 없으면 `null`
 */
export const loadLanguage = async (): Promise<string | null> => AsyncStorage.getItem(LANGUAGE_KEY);

/**
 * 선택한 언어를 기기에 저장
 *
 * @param language - 언어 태그
 * @returns 저장이 끝나면 이행하는 프로미스
 */
export const saveLanguage = async (language: string): Promise<void> => AsyncStorage.setItem(LANGUAGE_KEY, language);
