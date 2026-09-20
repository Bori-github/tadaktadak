import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { LanguageList } from './LanguageList';
import { SettingsRow } from './SettingsRow';

import { translate, useLanguage } from '@/entities/language';

import { COLORS, DOT_SIZE } from '@/shared/constants';

import { CHEVRON_ICON, LANGUAGE_ICON, RectIconShape } from '@/shared/ui/dot-icon';
import { DotModalStack, type DotModalScreen } from '@/shared/ui/dot-modal';
import { DotSprite } from '@/shared/ui/dot-sprite';

type SettingsView = 'settings' | 'language';

type SettingsModalProps = {
  visible: boolean;
  dotSize: number;
  onClose: () => void;
};

export const SettingsModal = memo(({ visible, dotSize, onClose }: SettingsModalProps) => {
  const language = useLanguage();
  const scale = dotSize / DOT_SIZE;

  const iconSize = LANGUAGE_ICON.boxSize * scale;
  const chevronWidth = (CHEVRON_ICON[0]?.length ?? 0) * dotSize;
  const chevronHeight = CHEVRON_ICON.length * dotSize;
  const valueStyle = { fontSize: 16 * scale, marginRight: 13 * scale };

  const screens: Record<SettingsView, DotModalScreen<SettingsView>> = {
    settings: {
      heightInDots: 240 / DOT_SIZE,
      render: ({ open }) => (
        <SettingsRow index={0} dotSize={dotSize} testID="settings-language" onPress={() => open('language')}>
          <Canvas style={{ width: iconSize, height: iconSize }}>
            <RectIconShape icon={LANGUAGE_ICON} left={0} top={0} dotSize={dotSize} color={COLORS.icon.default} />
          </Canvas>
          <Text style={[styles.value, valueStyle]}>{translate('language.name', language)}</Text>
          <Canvas style={{ width: chevronWidth, height: chevronHeight }}>
            <DotSprite grid={CHEVRON_ICON} centerX={chevronWidth / 2} centerY={chevronHeight / 2} dotSize={dotSize} colors={{ I: COLORS.icon.secondary }} />
          </Canvas>
        </SettingsRow>
      ),
    },
    language: {
      heightInDots: 240 / DOT_SIZE,
      render: () => <LanguageList dotSize={dotSize} />,
    },
  };

  return <DotModalStack visible={visible} dotSize={dotSize} initial="settings" screens={screens} onClose={onClose} />;
});

SettingsModal.displayName = 'SettingsModal';

const styles = StyleSheet.create({
  value: {
    flex: 1,
    textAlign: 'right',
    color: COLORS.icon.secondary,
  },
});
