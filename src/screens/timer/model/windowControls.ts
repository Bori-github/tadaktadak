import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { windowControls } from '@modules/window-controls';

/** 창 제어 버튼을 제외한 safe area 왼쪽 inset(px). Android는 0 */
export const useWindowControlsLeftInset = (): number => {
  const { width, height } = useWindowDimensions();
  const [leftInset, setLeftInset] = useState(0);

  // 창 모드 전환은 창 크기 변경으로만 감지돼서 크기 변경마다 재조회
  useEffect(() => {
    // 조회 실패 시 0이 남아 safeAreaInsets.left 사용
    windowControls
      ?.getLeftInsetAsync()
      .then(setLeftInset)
      .catch(() => {});
  }, [width, height]);

  return leftInset;
};
