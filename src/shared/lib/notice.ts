import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DismissibleNotice = {
  isVisible: boolean;
  dismiss: () => void;
};

/**
 * `storageKey`에 닫기 기록이 없을 때만 표시하는 안내의 표시 여부. `dismiss` 시 기록 저장
 *
 * @param storageKey - 닫기 기록의 AsyncStorage 키
 * @returns 표시 여부와 닫기 함수
 */
export const useDismissibleNotice = (storageKey: string): DismissibleNotice => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let isUnmounted = false;

    // AsyncStorage 읽기 실패 시 표시하지 않음
    AsyncStorage.getItem(storageKey)
      .then((dismissed) => {
        if (!isUnmounted && dismissed !== 'true') setIsVisible(true);
      })
      .catch(() => {});

    return () => {
      isUnmounted = true;
    };
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setIsVisible(false);

    // AsyncStorage 저장 실패 시 다음 mount에 다시 표시
    AsyncStorage.setItem(storageKey, 'true').catch(() => {});
  }, [storageKey]);

  return { isVisible, dismiss };
};
