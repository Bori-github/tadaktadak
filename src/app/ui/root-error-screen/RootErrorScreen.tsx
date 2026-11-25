import { type JSX, useEffect, useMemo } from 'react';
import { Canvas, Skia, type SkSkottieAnimation, Skottie } from '@shopify/react-native-skia';
import { reloadAppAsync } from 'expo';
import { StyleSheet, Text, View } from 'react-native';
import { cancelAnimation, Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import campfireError from '@assets/lottie/error-campfire.json';
import winterError from '@assets/lottie/error-winter.json';

import { getLottieDotBottom } from './lottieDotBottom';

import { translate, useLanguage } from '@/entities/language';
import { type ThemeId, useDisplayedTheme } from '@/entities/theme';
import { usePalette } from '@/shared/lib';
import { DotTextButton } from '@/shared/ui/dot-button';

const ERROR_ANIMATIONS: Record<ThemeId, typeof campfireError | typeof winterError> = {
  campfire: campfireError,
  winter: winterError,
};

// 그림 하단에서 문구 상단까지, 문구 상단에서 버튼 상단까지
const MESSAGE_GAP = 21;
const BUTTON_OFFSET = 46;

const BUTTON_DOT_SIZE = 2;
const BUTTON_WIDTH_IN_DOTS = 76;
const BUTTON_HEIGHT_IN_DOTS = 24;

/**
 * 에러 화면
 *
 * @returns 에러 애니메이션을 반복 재생하고 재시작 버튼을 둔 화면
 */
export const RootErrorScreen = (): JSX.Element => {
  const language = useLanguage();
  const palette = usePalette();
  const errorAnimation = ERROR_ANIMATIONS[useDisplayedTheme()];
  // 언마운트 뒤 GC 대상이 되도록 컴포넌트 안에서 생성
  // Skottie.Make는 JSON 파싱 실패 시 null을 반환하는데 반환 타입에 빠져 있어서 null 포함으로 선언
  const animation = useMemo<SkSkottieAnimation | null>(() => Skia.Skottie.Make(JSON.stringify(errorAnimation)), [errorAnimation]);
  const frame = useSharedValue(0);
  const { fr: frameRate, op: endFrame, w: stageWidth, h: stageHeight } = errorAnimation;
  const messageTop = useMemo(() => getLottieDotBottom(errorAnimation) + MESSAGE_GAP, [errorAnimation]);

  useEffect(() => {
    const durationMs = (endFrame / frameRate) * 1000;
    frame.value = withRepeat(withTiming(endFrame - 1, { duration: durationMs, easing: Easing.linear }), -1);
    return () => {
      cancelAnimation(frame);
    };
  }, [frame, frameRate, endFrame]);

  const handleRestartPress = () => {
    // 재시작 실패 시 에러 화면이 유지돼 재시도 가능하므로 reject 무시
    reloadAppAsync().catch(() => {});
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.canvas }]} testID="root-error-screen">
      <View style={{ width: stageWidth, height: stageHeight }}>
        {animation === null ? null : (
          <Canvas style={styles.canvas} pointerEvents="none">
            <Skottie animation={animation} frame={frame} />
          </Canvas>
        )}
        <Text style={[styles.message, { top: messageTop, color: palette.text.primary }]}>{translate('error.message', language)}</Text>
        <DotTextButton
          dotSize={BUTTON_DOT_SIZE}
          widthInDots={BUTTON_WIDTH_IN_DOTS}
          heightInDots={BUTTON_HEIGHT_IN_DOTS}
          label={translate('error.restart', language)}
          style={[styles.button, { top: messageTop + BUTTON_OFFSET, left: (stageWidth - BUTTON_WIDTH_IN_DOTS * BUTTON_DOT_SIZE) / 2 }]}
          onPress={handleRestartPress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    ...StyleSheet.absoluteFill,
  },
  message: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
  },
});
