import { memo } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { COLORS } from '@/shared/constants';

import { DotCells, type DotRole } from '@/shared/ui/dot-shape';

const WIDTH_IN_DOTS = 22;
const HEIGHT_IN_DOTS = 12;

/** 꺼짐에서 켜짐까지 손잡이가 움직이는 거리 (dot) */
const KNOB_TRAVEL_IN_DOTS = 10;

const ON_COLORS: Record<DotRole, string> = {
  edge: COLORS.fire.mid,
  face: COLORS.focus.thumbCore,
  highlight: COLORS.focus.thumbCore,
  shadow: COLORS.focus.thumbCore,
};

const OFF_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.edge,
  face: COLORS.button.face,
  highlight: COLORS.button.highlight,
  shadow: COLORS.button.shadow,
};

type DotToggleProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** 토글 위치를 지정하는 스타일 */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const DotToggle = memo(({ dotSize, value, onValueChange, style, testID }: DotToggleProps) => {
  const knobColumn = value ? KNOB_TRAVEL_IN_DOTS : 0;
  const cells = [
    { key: 'track-vertical', column: 1, row: 0, widthInDots: 20, heightInDots: 12, role: 'edge' },
    { key: 'track-horizontal', column: 0, row: 1, widthInDots: 22, heightInDots: 10, role: 'edge' },
    { key: 'knob-vertical', column: knobColumn + 2, row: 1, widthInDots: 8, heightInDots: 10, role: 'face' },
    { key: 'knob-horizontal', column: knobColumn + 1, row: 2, widthInDots: 10, heightInDots: 8, role: 'face' },
    { key: 'knob-highlight', column: knobColumn + 2, row: 2, widthInDots: 8, heightInDots: 1, role: 'highlight' },
  ] as const;
  const size = { width: WIDTH_IN_DOTS * dotSize, height: HEIGHT_IN_DOTS * dotSize };

  return (
    <Pressable testID={testID} style={[style, size]} onPress={() => onValueChange(!value)}>
      <Canvas style={size} pointerEvents="none">
        <DotCells cells={cells} dotSize={dotSize} colors={value ? ON_COLORS : OFF_COLORS} />
      </Canvas>
    </Pressable>
  );
});

DotToggle.displayName = 'DotToggle';
