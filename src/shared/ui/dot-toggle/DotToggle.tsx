import { memo, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { usePalette, type Palette } from '@/shared/lib';

import { DotCells, type DotRole } from '@/shared/ui/dot-shape';

import { EASE_OUT, EMBER_RISE_IN_DOTS, emberAt, totalDurationMs, TURN_OFF, TURN_ON, type EmberColor } from './embers';

const WIDTH_IN_DOTS = 22;
const HEIGHT_IN_DOTS = 12;

/** 손잡이 이동 거리 (dot) */
const KNOB_TRAVEL_IN_DOTS = 10;

/** 켜짐 전환 불티 개수. 꺼짐 전환은 앞 4개만 사용 */
const EMBER_COUNT = 8;

const TRACK_CELLS = [
  { key: 'track-vertical', column: 1, row: 0, widthInDots: 20, heightInDots: 12, role: 'edge' },
  { key: 'track-horizontal', column: 0, row: 1, widthInDots: 22, heightInDots: 10, role: 'edge' },
] as const;

const KNOB_CELLS = [
  { key: 'knob-vertical', column: 2, row: 1, widthInDots: 8, heightInDots: 10, role: 'face' },
  { key: 'knob-horizontal', column: 1, row: 2, widthInDots: 10, heightInDots: 8, role: 'face' },
  { key: 'knob-highlight', column: 2, row: 2, widthInDots: 8, heightInDots: 1, role: 'highlight' },
] as const;

const getLayerColors = ({ fire, focus, button }: Palette): Record<'on' | 'off', Record<DotRole, string>> => ({
  on: { edge: fire.mid, face: focus.thumbCore, highlight: focus.thumbCore, shadow: focus.thumbCore },
  off: { edge: button.edge, face: button.face, highlight: button.highlight, shadow: button.shadow },
});

type ToggleEmberProps = {
  index: number;
  dotSize: number;
  emberColors: Record<EmberColor, string>;
  isTurningOn: SharedValue<boolean>;
  elapsedMs: SharedValue<number>;
};

const ToggleEmber = ({ index, dotSize, emberColors, isTurningOn, elapsedMs }: ToggleEmberProps) => {
  const frame = useDerivedValue(() => emberAt(isTurningOn.value ? TURN_ON : TURN_OFF, index, elapsedMs.value));
  const x = useDerivedValue(() => (frame.value?.column ?? 0) * dotSize);
  const y = useDerivedValue(() => ((frame.value?.row ?? 0) + EMBER_RISE_IN_DOTS) * dotSize);
  const color = useDerivedValue(() => (frame.value ? emberColors[frame.value.color] : 'transparent'));

  return <Rect x={x} y={y} width={dotSize} height={dotSize} color={color} />;
};

type DotToggleProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  value: boolean;
  onValueChange: (value: boolean) => void;
  onPressIn?: () => void;
  /** 토글 위치를 지정하는 스타일 */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * 도트 토글
 *
 * @returns 누르면 `onValueChange`에 반대 값을 넘기는 `Pressable`
 */
export const DotToggle = memo(({ dotSize, value, onValueChange, onPressIn, style, testID }: DotToggleProps) => {
  const palette = usePalette();
  const layerColors = getLayerColors(palette);
  const knobColumn = useSharedValue(value ? KNOB_TRAVEL_IN_DOTS : 0);
  const isTurningOn = useSharedValue(value);
  // 첫 렌더링은 전 구간 종료 상태로 시작해 불티 미표시
  const elapsedMs = useSharedValue(Number.POSITIVE_INFINITY);
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) return;
    previousValue.current = value;

    const segments = value ? TURN_ON : TURN_OFF;
    const totalMs = totalDurationMs(segments);

    // 모션 중 토글 시 손잡이는 현재 위치에서 반대쪽으로 이동, 불티는 반대 방향 첫 구간부터 재시작
    knobColumn.value = withTiming(value ? KNOB_TRAVEL_IN_DOTS : 0, { duration: segments[0]?.durationMs ?? 0, easing: EASE_OUT });
    isTurningOn.value = value;
    elapsedMs.value = 0;
    elapsedMs.value = withTiming(totalMs, { duration: totalMs, easing: Easing.linear });
  }, [value, knobColumn, isTurningOn, elapsedMs]);

  const knobTransform = useDerivedValue(() => [{ translateX: Math.round(knobColumn.value) * dotSize }]);
  // `value` 기준 색 전환은 React 렌더링을 거쳐 불티보다 늦어 불티와 같은 공유 값으로 켜짐·꺼짐 레이어 중 하나만 표시
  const onOpacity = useDerivedValue(() => (isTurningOn.value ? 1 : 0));
  const offOpacity = useDerivedValue(() => (isTurningOn.value ? 0 : 1));

  const size = { width: WIDTH_IN_DOTS * dotSize, height: HEIGHT_IN_DOTS * dotSize };
  const riseHeight = EMBER_RISE_IN_DOTS * dotSize;

  return (
    <Pressable testID={testID} style={[style, size]} onPressIn={onPressIn} onPress={() => onValueChange(!value)}>
      {/* 불티가 토글 위로 벗어나 캔버스를 위쪽으로 확장 */}
      <Canvas style={[styles.canvas, { top: -riseHeight, width: size.width, height: size.height + riseHeight }]} pointerEvents="none">
        {[
          { key: 'on', colors: layerColors.on, opacity: onOpacity },
          { key: 'off', colors: layerColors.off, opacity: offOpacity },
        ].map((layer) => (
          <Group key={layer.key} opacity={layer.opacity}>
            <DotCells cells={TRACK_CELLS} dotSize={dotSize} colors={layer.colors} offsetY={riseHeight} />
            <Group transform={knobTransform}>
              <DotCells cells={KNOB_CELLS} dotSize={dotSize} colors={layer.colors} offsetY={riseHeight} />
            </Group>
          </Group>
        ))}
        <Group antiAlias={false}>
          {Array.from({ length: EMBER_COUNT }, (_, index) => (
            <ToggleEmber key={index} index={index} dotSize={dotSize} emberColors={palette.fire} isTurningOn={isTurningOn} elapsedMs={elapsedMs} />
          ))}
        </Group>
      </Canvas>
    </Pressable>
  );
});

DotToggle.displayName = 'DotToggle';

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    left: 0,
  },
});
