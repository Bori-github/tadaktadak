import { type JSX } from 'react';
import { Canvas, Skia, Skottie } from '@shopify/react-native-skia';
import { Image, StyleSheet, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import splash from './splash.json';

const animation = Skia.Skottie.Make(JSON.stringify(splash));

const LAST_FRAME = splash.op - 1;

const FADE_DELAY_MS = 2900;
const FADE_MS = 300;

interface SplashProps {
  onHidden: () => void;
}

export const Splash = ({ onHidden }: SplashProps): JSX.Element => {
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
      playing.setActive(true);
      opacity.value = withDelay(
        FADE_DELAY_MS,
        withTiming(0, { duration: FADE_MS }, (finished) => {
          'worklet';
          if (finished) scheduleOnRN(onHidden);
        }),
      );
    },
  });

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View {...container} style={[container.style, fadeStyle]}>
      <Image {...logo} />
      <View style={styles.stage} pointerEvents="none">
        <Canvas style={styles.canvas}>
          <Skottie animation={animation} frame={frame} />
        </Canvas>
      </View>
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
