import { createContext, useContext } from 'react';

// Provider 밖(테스트 등)에서 스플래시 없음으로 처리하도록 기본값 false
export const SplashVisibleContext = createContext(false);

/**
 * 앱 시작 스플래시의 화면 표시 여부
 *
 * @returns 스플래시 표시 중이면 true
 */
export const useIsSplashVisible = (): boolean => useContext(SplashVisibleContext);
