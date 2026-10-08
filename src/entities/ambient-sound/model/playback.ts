import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

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

type AmbientSoundPlaybackOptions = {
  canPlay: boolean;
};

/**
 * 배경음이 켜져 있고 앱이 포그라운드인 동안 음원을 반복 재생하고, 재생을 시작할 때 음량을 `FADE_IN_MS` 동안 0에서 1로 올림
 *
 * @param options.canPlay - false인 동안 재생하지 않음
 * @returns 없음
 */
export const useAmbientSoundPlayback = ({ canPlay }: AmbientSoundPlaybackOptions): void => {
  const isEnabled = useAmbientSoundEnabled();
  const isForeground = useSyncExternalStore(subscribeAppState, getIsForeground);

  useEffect(() => {
    // iOS는 실패 시 기본 오디오 세션으로 남아 무음 스위치에 음소거되지만 재생은 가능해 무시
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!canPlay || !isEnabled || !isForeground) return;

    let player: AudioPlayer | null = null;
    try {
      player = createAudioPlayer(FIRE_LOOP);
      player.loop = true;
      player.volume = 0;
      player.play();
    } catch {
      // iOS `play()`는 오디오 세션 활성화 실패 시 throw해서 플레이어 해제 후 재생 생략
      player?.remove();
      return;
    }

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
  }, [canPlay, isEnabled, isForeground]);
};
