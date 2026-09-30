import { type JSX } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { Canvas } from '@shopify/react-native-skia';

import { LANGUAGE_OPTIONS, LanguageList } from './LanguageList';
import { MORE_ROW_COUNT, MoreList } from './MoreList';
import { getPanelHeightInDots, SettingsRow } from './SettingsRow';

import { translate, useLanguage, useSelectedLanguage } from '@/entities/language';
import { previewVibration, setVibrationEnabled, TOGGLE_PATTERN, useVibrationEnabled } from '@/entities/vibration';

import { COLORS, DOT_SIZE } from '@/shared/constants';
import { resolveLayout, type RootStackParamList } from '@/shared/lib';

import { ChevronIcon, LANGUAGE_ICON, MORE_ICON, RectIconShape, VIBRATION_ICON } from '@/shared/ui/dot-icon';
import { DotModalStack, type DotModalScreen } from '@/shared/ui/dot-modal';
import { DotToggle } from '@/shared/ui/dot-toggle';

type SettingsView = 'settings' | 'language' | 'more';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'settings'>;

export const SettingsScreen = ({ navigation }: SettingsScreenProps): JSX.Element | null => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { dotSize } = resolveLayout({
    shortSide: Math.min(width, height),
    safeAreaTopEdge: insets.top,
    safeAreaBottomEdge: height - insets.bottom,
  });
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
      heightInDots: getPanelHeightInDots(MORE_ROW_COUNT),
      render: () => <MoreList dotSize={dotSize} />,
    },
  };

  return <DotModalStack dotSize={dotSize} initial="settings" screens={screens} onClose={() => navigation.goBack()} />;
};

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
