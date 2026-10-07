import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { useAmbientSoundEnabled } from './store';

const FIRE_LOOP = require('../../../../assets/sounds/fire-loop.m4a');

const FADE_IN_MS = 2000;
const FADE_STEP_MS = 50;

const subscribeAppState = (listener: () => void): (() => void) => {
  const subscription = AppState.addEventListener('change', listener);
  return () => {
    subscription.remove();
  };
};

// iOS 제어 센터 표시 중인 `inactive`도 포그라운드로 보고 재생 유지
const getIsForeground = (): boolean => AppState.currentState !== 'background';

/**
 * 배경음이 켜져 있고 앱이 포그라운드인 동안 음원을 반복 재생하고, 재생을 시작할 때 음량을 `FADE_IN_MS` 동안 0에서 1로 올림
 *
 * @returns 없음
 */
export const useAmbientSoundPlayback = (): void => {
  const isEnabled = useAmbientSoundEnabled();
  const isForeground = useSyncExternalStore(subscribeAppState, getIsForeground);

  useEffect(() => {
    // 오디오 모드 설정이 실패해도 expo-audio 기본값이 같은 동작(무음 모드 재생, 다른 앱과 섞기)이라 무시
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEnabled || !isForeground) return;

    const player = createAudioPlayer(FIRE_LOOP);
    player.loop = true;
    player.volume = 0;
    player.play();

    const startedAt = Date.now();
    const fadeTimer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / FADE_IN_MS);
      player.volume = progress;
      if (progress === 1) clearInterval(fadeTimer);
    }, FADE_STEP_MS);

    return () => {
      clearInterval(fadeTimer);
      // Android `remove()`는 플레이어 등록만 해제하고 네이티브 플레이어는 GC 때 해제해서 `pause()`로 먼저 정지
      player.pause();
      player.remove();
    };
  }, [isEnabled, isForeground]);
};
