import { type JSX, useEffect, useMemo } from 'react';
import { Canvas, Skia, type SkSkottieAnimation, Skottie } from '@shopify/react-native-skia';
import { reloadAppAsync } from 'expo';
import { StyleSheet, Text, View } from 'react-native';
import { cancelAnimation, Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import errorAnimation from './error.json';

import { translate, useLanguage } from '@/entities/language';
import { COLORS } from '@/shared/constants';
import { DotTextButton } from '@/shared/ui/dot-button';

const LAST_FRAME = errorAnimation.op - 1;
const DURATION_MS = (errorAnimation.op / errorAnimation.fr) * 1000;

const BUTTON_DOT_SIZE = 2;
const BUTTON_WIDTH_IN_DOTS = 76;
const BUTTON_HEIGHT_IN_DOTS = 24;

export const RootErrorScreen = (): JSX.Element => {
  const language = useLanguage();
  // 언마운트 뒤 GC 대상이 되도록 컴포넌트 안에서 생성
  // Skottie.Make는 JSON 파싱 실패 시 null을 반환하는데 반환 타입에 빠져 있어서 null 포함으로 선언
  const animation = useMemo<SkSkottieAnimation | null>(() => Skia.Skottie.Make(JSON.stringify(errorAnimation)), []);
  const frame = useSharedValue(0);

  useEffect(() => {
    frame.value = withRepeat(withTiming(LAST_FRAME, { duration: DURATION_MS, easing: Easing.linear }), -1);
    return () => {
      cancelAnimation(frame);
    };
  }, [frame]);

  const handleRestartPress = () => {
    // 재시작 실패 시 에러 화면이 유지돼 재시도 가능하므로 reject 무시
    reloadAppAsync().catch(() => {});
  };

  return (
    <View style={styles.root} testID="root-error-screen">
      <View style={styles.stage}>
        {animation === null ? null : (
          <Canvas style={styles.canvas} pointerEvents="none">
            <Skottie animation={animation} frame={frame} />
          </Canvas>
        )}
        <Text style={styles.message}>{translate('error.message', language)}</Text>
        <DotTextButton
          dotSize={BUTTON_DOT_SIZE}
          widthInDots={BUTTON_WIDTH_IN_DOTS}
          heightInDots={BUTTON_HEIGHT_IN_DOTS}
          label={translate('error.restart', language)}
          style={styles.button}
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
    backgroundColor: COLORS.canvas,
  },
  stage: {
    width: errorAnimation.w,
    height: errorAnimation.h,
  },
  canvas: {
    ...StyleSheet.absoluteFill,
  },
  message: {
    position: 'absolute',
    top: 452,
    left: 0,
    right: 0,
    color: COLORS.text.primary,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
    top: 498,
    left: (errorAnimation.w - BUTTON_WIDTH_IN_DOTS * BUTTON_DOT_SIZE) / 2,
  },
});
