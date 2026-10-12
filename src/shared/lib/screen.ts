import { useIsFocused } from '@react-navigation/native';

import { useIsSplashVisible } from './splash';

/**
 * 화면 표시 여부. 다른 화면이 위에 쌓이거나 스플래시가 덮으면 false
 *
 * @returns 표시 중이면 true
 */
export const useIsScreenVisible = (): boolean => {
  const isFocused = useIsFocused();
  const isSplashVisible = useIsSplashVisible();

  return isFocused && !isSplashVisible;
};
