import { type JSX } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';

import { AdvertisementFooter } from './AdvertisementFooter';
import { LanguageList } from './LanguageList';
import { MoreList } from './MoreList';
import { ThemeList } from './ThemeList';

import { translate, useLanguage, useSelectedLanguage } from '@/entities/language';
import { useDisplayedTheme } from '@/entities/theme';
import { isHapticsSupported, previewVibration, setVibrationEnabled, TOGGLE_PATTERN, useVibrationEnabled } from '@/entities/vibration';

import { DOT_SIZE } from '@/shared/constants';
import { resolveLayout, getFormFactor, usePalette, type RootStackParamList } from '@/shared/lib';

import { ChevronIcon, LANGUAGE_ICON, MORE_ICON, THEME_ICON, VIBRATION_ICON } from '@/shared/ui/dot-icon';
import { DotModalRow, DotModalStack, MODAL_CONTENT_WIDTH, type DotModalScreen } from '@/shared/ui/dot-modal';
import { DotToggle } from '@/shared/ui/dot-toggle';

type SettingsView = 'settings' | 'language' | 'theme' | 'more';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'settings'>;

/**
 * 설정 화면
 *
 * @returns 설정·언어·더보기 화면을 쌓는 `DotModalStack`
 */
export const SettingsScreen = ({ navigation }: SettingsScreenProps): JSX.Element | null => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { dotSize } = resolveLayout({
    shortSide: Math.min(width, height),
    formFactor: getFormFactor(),
    safeAreaTopEdge: insets.top,
    safeAreaBottomEdge: height - insets.bottom,
  });
  const language = useLanguage();
  const selected = useSelectedLanguage();
  const displayedTheme = useDisplayedTheme();
  const isVibrationEnabled = useVibrationEnabled();
  const palette = usePalette();
  const scale = dotSize / DOT_SIZE;

  const valueStyle = { color: palette.text.secondary, fontSize: 16 * scale, marginRight: 13 * scale };

  const screens: Record<SettingsView, DotModalScreen<SettingsView>> = {
    settings: {
      render: ({ open }) => (
        <>
          <DotModalRow dotSize={dotSize} icon={LANGUAGE_ICON} testID="settings-language" onPress={() => open('language')}>
            <Text style={[styles.value, valueStyle]}>{selected === null ? translate('language.system', language) : translate('language.name', selected)}</Text>
            <ChevronIcon dotSize={dotSize} />
          </DotModalRow>
          <DotModalRow dotSize={dotSize} icon={THEME_ICON} testID="settings-theme" onPress={() => open('theme')}>
            <Text style={[styles.value, valueStyle]}>{translate(`theme.${displayedTheme}`, language)}</Text>
            <ChevronIcon dotSize={dotSize} />
          </DotModalRow>
          {isHapticsSupported() ? (
            <DotModalRow dotSize={dotSize} icon={VIBRATION_ICON}>
              <DotToggle
                testID="settings-vibration"
                dotSize={dotSize}
                value={isVibrationEnabled}
                style={styles.trailing}
                onPressIn={() => previewVibration(TOGGLE_PATTERN)}
                onValueChange={setVibrationEnabled}
              />
            </DotModalRow>
          ) : null}
          <DotModalRow dotSize={dotSize} icon={MORE_ICON} testID="settings-more" onPress={() => open('more')}>
            <ChevronIcon dotSize={dotSize} style={styles.trailing} />
          </DotModalRow>
        </>
      ),
      footer: <AdvertisementFooter dotSize={dotSize} width={Math.min(MODAL_CONTENT_WIDTH * scale, width)} />,
    },
    language: {
      render: () => <LanguageList dotSize={dotSize} />,
    },
    theme: {
      render: () => <ThemeList dotSize={dotSize} />,
    },
    more: {
      render: () => <MoreList dotSize={dotSize} />,
    },
  };

  return (
    <DotModalStack
      dotSize={dotSize}
      initial="settings"
      screens={screens}
      onClose={() => {
        if (navigation.canGoBack()) navigation.goBack();
      }}
    />
  );
};

const styles = StyleSheet.create({
  trailing: {
    marginLeft: 'auto',
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
});
