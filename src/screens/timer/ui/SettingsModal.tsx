import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { LANGUAGE_OPTIONS, LanguageList } from './LanguageList';
import { MoreList } from './MoreList';
import { getPanelHeightInDots, SettingsRow } from './SettingsRow';

import { translate, useLanguage, useSelectedLanguage } from '@/entities/language';
import { previewVibration, setVibrationEnabled, TOGGLE_PATTERN, useVibrationEnabled } from '@/entities/vibration';

import { COLORS, DOT_SIZE } from '@/shared/constants';

import { ChevronIcon, LANGUAGE_ICON, MORE_ICON, RectIconShape, VIBRATION_ICON } from '@/shared/ui/dot-icon';
import { DotModalStack, type DotModalScreen } from '@/shared/ui/dot-modal';
import { DotToggle } from '@/shared/ui/dot-toggle';

type SettingsView = 'settings' | 'language' | 'more';

type SettingsModalProps = {
  visible: boolean;
  dotSize: number;
  onClose: () => void;
};

export const SettingsModal = memo(({ visible, dotSize, onClose }: SettingsModalProps) => {
  const language = useLanguage();
  const selected = useSelectedLanguage();
  const isVibrationEnabled = useVibrationEnabled();
  const scale = dotSize / DOT_SIZE;

  const iconSize = LANGUAGE_ICON.boxSize * scale;
  const valueStyle = { fontSize: 16 * scale, marginRight: 13 * scale };

  const screens: Record<SettingsView, DotModalScreen<SettingsView>> = {
    settings: {
      heightInDots: getPanelHeightInDots(3),
      render: ({ open }) => (
        <>
          <SettingsRow index={0} dotSize={dotSize} testID="settings-language" onPress={() => open('language')}>
            <Canvas style={{ width: iconSize, height: iconSize }}>
              <RectIconShape icon={LANGUAGE_ICON} left={0} top={0} dotSize={dotSize} color={COLORS.icon.default} />
            </Canvas>
            <Text style={[styles.value, valueStyle]}>{selected === null ? translate('language.system', language) : translate('language.name', selected)}</Text>
            <ChevronIcon dotSize={dotSize} />
          </SettingsRow>
          <SettingsRow index={1} dotSize={dotSize}>
            <Canvas style={{ width: iconSize, height: iconSize }}>
              <RectIconShape icon={VIBRATION_ICON} left={0} top={0} dotSize={dotSize} color={COLORS.icon.default} />
            </Canvas>
            <DotToggle
              testID="settings-vibration"
              dotSize={dotSize}
              value={isVibrationEnabled}
              style={styles.trailing}
              onPressIn={() => previewVibration(TOGGLE_PATTERN)}
              onValueChange={setVibrationEnabled}
            />
          </SettingsRow>
          <SettingsRow index={2} dotSize={dotSize} testID="settings-more" onPress={() => open('more')}>
            <Canvas style={{ width: iconSize, height: iconSize }}>
              <RectIconShape icon={MORE_ICON} left={0} top={0} dotSize={dotSize} color={COLORS.icon.default} />
            </Canvas>
            <ChevronIcon dotSize={dotSize} style={styles.trailing} />
          </SettingsRow>
        </>
      ),
    },
    language: {
      heightInDots: getPanelHeightInDots(LANGUAGE_OPTIONS.length),
      render: () => <LanguageList dotSize={dotSize} />,
    },
    more: {
      heightInDots: getPanelHeightInDots(2),
      render: () => <MoreList dotSize={dotSize} />,
    },
  };

  return <DotModalStack visible={visible} dotSize={dotSize} initial="settings" screens={screens} onClose={onClose} />;
});

SettingsModal.displayName = 'SettingsModal';

const styles = StyleSheet.create({
  trailing: {
    marginLeft: 'auto',
  },
  value: {
    flex: 1,
    textAlign: 'right',
    color: COLORS.text.secondary,
  },
});
