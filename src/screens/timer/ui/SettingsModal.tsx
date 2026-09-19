import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { COLORS, DOT_SIZE } from '@/shared/constants';
import { translate, useLanguage } from '@/shared/lib';

import { CHEVRON_ICON, LANGUAGE_ICON, RectIconShape } from '@/shared/ui/dot-icon';
import { DotModal } from '@/shared/ui/dot-modal';
import { DotSprite } from '@/shared/ui/dot-sprite';

/** 피그마 `모달 · 설정` 높이 */
const HEIGHT_IN_DOTS = 240 / DOT_SIZE;

/** 배율 1의 논리 픽셀. 피그마 `모달 · 설정` */
const ROW_TOP = 52;
const ROW_HEIGHT = 56;
const ROW_INSET = 20;
const VALUE_TO_CHEVRON = 13;
const FONT_SIZE = 16;

const CHEVRON_COLORS = { I: COLORS.icon.secondary };

type SettingsModalProps = {
  visible: boolean;
  /** 도트 한 변 (px) */
  dotSize: number;
  onClose: () => void;
};

export const SettingsModal = memo(({ visible, dotSize, onClose }: SettingsModalProps) => {
  const language = useLanguage();
  const scale = dotSize / DOT_SIZE;

  const iconSize = LANGUAGE_ICON.boxSize * scale;
  const chevronWidth = (CHEVRON_ICON[0]?.length ?? 0) * dotSize;
  const chevronHeight = CHEVRON_ICON.length * dotSize;

  const rowStyle = { top: ROW_TOP * scale, height: ROW_HEIGHT * scale, paddingHorizontal: ROW_INSET * scale };
  const valueStyle = { fontSize: FONT_SIZE * scale, marginRight: VALUE_TO_CHEVRON * scale };

  return (
    <DotModal visible={visible} dotSize={dotSize} heightInDots={HEIGHT_IN_DOTS} onClose={onClose}>
      <View style={[styles.row, rowStyle]}>
        <Canvas style={{ width: iconSize, height: iconSize }}>
          <RectIconShape icon={LANGUAGE_ICON} left={0} top={0} dotSize={dotSize} color={COLORS.icon.default} />
        </Canvas>
        <Text style={[styles.value, valueStyle]}>{translate('language.name', language)}</Text>
        <Canvas style={{ width: chevronWidth, height: chevronHeight }}>
          <DotSprite grid={CHEVRON_ICON} centerX={chevronWidth / 2} centerY={chevronHeight / 2} dotSize={dotSize} colors={CHEVRON_COLORS} />
        </Canvas>
      </View>
    </DotModal>
  );
});

SettingsModal.displayName = 'SettingsModal';

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    flex: 1,
    textAlign: 'right',
    color: COLORS.icon.secondary,
  },
});
