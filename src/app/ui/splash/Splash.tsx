import { type JSX, useMemo } from 'react';
import { Canvas, Skia, type SkSkottieAnimation, Skottie } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';
import BootSplash, { type Manifest } from 'react-native-bootsplash';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import campfireSplash from '@assets/lottie/splash-campfire.json';
import winterSplash from '@assets/lottie/splash-winter.json';

import { type ThemeId, useDisplayedTheme } from '@/entities/theme';

const manifest: Manifest = require('../../../../assets/bootsplash/manifest.json');

const SPLASH_ANIMATIONS: Record<ThemeId, typeof campfireSplash | typeof winterSplash> = {
  campfire: campfireSplash,
  winter: winterSplash,
};

const FADE_MS = 300;

interface SplashProps {
  onHidden: () => void;
}

/**
 * 스플래시
 *
 * @returns 네이티브 스플래시 로고에서 이어 재생하고 사라지는 애니메이션 화면
 */
export const Splash = ({ onHidden }: SplashProps): JSX.Element => {
  const splash = SPLASH_ANIMATIONS[useDisplayedTheme()];
  // 언마운트 뒤 GC 대상이 되도록 컴포넌트 안에서 생성
  // Skottie.Make는 JSON 파싱 실패 시 null을 반환하는데 반환 타입에 빠져 있어서 null 포함으로 선언
  const animation = useMemo<SkSkottieAnimation | null>(() => Skia.Skottie.Make(JSON.stringify(splash)), [splash]);
  const frame = useSharedValue(0);
  const opacity = useSharedValue(1);
  const logoOpacity = useSharedValue(1);

  const { fr: frameRate, op: endFrame } = splash;
  const lastFrame = endFrame - 1;
  // Lottie 마지막 프레임에서 페이드아웃이 끝나도록 Lottie 길이에서 계산
  const fadeDelayMs = (endFrame / frameRate) * 1000 - FADE_MS;

  const playing = useFrameCallback((info) => {
    'worklet';
    frame.value = Math.min((info.timeSinceFirstFrame / 1000) * frameRate, lastFrame);
  }, false);

  const { container, logo } = BootSplash.useHideAnimation({
    manifest,
    logo: require('../../../../assets/bootsplash/logo.png'),
    animate: () => {
      try {
        // Canvas가 로고 Image와 같은 그림인 0프레임부터 이어 그려서 재생 시작 시 Image 불투명도를 0으로 설정
        if (animation !== null) logoOpacity.value = 0;
        playing.setActive(true);
        // withTiming이 취소돼도(finished false) 스플래시가 남지 않게 onHidden 호출
        opacity.value = withDelay(
          fadeDelayMs,
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
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value }));
  // react-native-bootsplash가 Samsung One UI 4에서 logoSizeRatio 0.5로 logo.style.width를 줄여서 같은 비율로 Lottie 크기 조정
  const logoScale = typeof logo.style?.width === 'number' ? logo.style.width / manifest.logo.width : 1;

  return (
    <Animated.View {...container} style={[container.style, fadeStyle]} testID="splash">
      <Animated.Image {...logo} style={[logo.style, logoStyle]} />
      {animation === null ? null : (
        <View style={[styles.stage, { transform: [{ scale: logoScale }] }]} pointerEvents="none">
          <Canvas style={{ width: splash.w, height: splash.h }}>
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
});
