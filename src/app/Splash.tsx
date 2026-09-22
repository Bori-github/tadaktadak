import { type JSX, useMemo } from 'react';
import { Canvas, Skia, type SkSkottieAnimation, Skottie } from '@shopify/react-native-skia';
import { Image, StyleSheet, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import splash from './splash.json';

const LAST_FRAME = splash.op - 1;

const FADE_MS = 300;
// Lottie 마지막 프레임에서 페이드아웃이 끝나도록 Lottie 길이에서 계산
const FADE_DELAY_MS = (splash.op / splash.fr) * 1000 - FADE_MS;

interface SplashProps {
  onHidden: () => void;
}

export const Splash = ({ onHidden }: SplashProps): JSX.Element => {
  // 언마운트 뒤 GC 대상이 되도록 컴포넌트 안에서 생성
  // Skottie.Make는 JSON 파싱 실패 시 null을 반환하는데 반환 타입에 빠져 있어서 null 포함으로 선언
  const animation = useMemo<SkSkottieAnimation | null>(() => Skia.Skottie.Make(JSON.stringify(splash)), []);
  const frame = useSharedValue(0);
  const opacity = useSharedValue(1);

  const playing = useFrameCallback((info) => {
    'worklet';
    frame.value = Math.min((info.timeSinceFirstFrame / 1000) * splash.fr, LAST_FRAME);
  }, false);

  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require('../../assets/bootsplash/manifest.json'),
    logo: require('../../assets/bootsplash/logo.png'),
    animate: () => {
      try {
        playing.setActive(true);
        // withTiming이 취소돼도(finished false) 스플래시가 남지 않게 onHidden 호출
        opacity.value = withDelay(
          FADE_DELAY_MS,
          withTiming(0, { duration: FADE_MS }, () => {
            'worklet';
            scheduleOnRN(onHidden);
          }),
        );
      } catch {
        // react-native-bootsplash가 animate 예외를 catch로 무시해서 여기서 onHidden 호출
        onHidden();
      }
    },
  });

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View {...container} style={[container.style, fadeStyle]}>
      <Image {...logo} />
      {animation === null ? null : (
        <View style={styles.stage} pointerEvents="none">
          <Canvas style={styles.canvas}>
            <Skottie animation={animation} frame={frame} />
          </Canvas>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    width: splash.w,
    height: splash.h,
  },
});
