import AsyncStorage from '@react-native-async-storage/async-storage';

const ENABLED_KEY = 'ambientSoundEnabled';

/**
 * 기기에 저장된 배경음 사용 여부 읽기
 *
 * @returns 켜짐으로 저장했으면 true. 저장한 적이 없으면 기본값인 false
 */
export const loadAmbientSoundEnabled = async (): Promise<boolean> => (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';

/**
 * 배경음 사용 여부를 기기에 저장
 *
 * @returns 저장이 끝나면 이행하는 프로미스
 */
export const saveAmbientSoundEnabled = async (enabled: boolean): Promise<void> => AsyncStorage.setItem(ENABLED_KEY, String(enabled));
