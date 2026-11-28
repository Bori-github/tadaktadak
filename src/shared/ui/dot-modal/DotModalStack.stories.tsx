import { useState, type JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { DOT_SIZE } from '@/shared/constants';
import { usePalette } from '@/shared/lib';

import { ChevronIcon, LANGUAGE_ICON, THEME_ICON, VIBRATION_ICON } from '@/shared/ui/dot-icon';
import { DotToggle } from '@/shared/ui/dot-toggle';

import { DotModalCheckRow } from './DotModalCheckRow';
import { DotModalRow } from './DotModalRow';
import { DotModalStack, type DotModalScreen } from './DotModalStack';

type ModalView = 'main' | 'language' | 'theme';

const LANGUAGES = ['시스템 설정', '한국어', 'English'];
const THEMES = ['모닥불', '겨울'];

const ModalStackPreview = ({ dotSize }: { dotSize: number }): JSX.Element => {
  const palette = usePalette();
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [theme, setTheme] = useState(THEMES[0]);
  const [isVibrationEnabled, setVibrationEnabled] = useState(true);
  const scale = dotSize / DOT_SIZE;
  const valueStyle = { color: palette.text.secondary, fontSize: 16 * scale, marginRight: 13 * scale };

  const screens: Record<ModalView, DotModalScreen<ModalView>> = {
    main: {
      render: ({ open }) => (
        <>
          <DotModalRow dotSize={dotSize} icon={LANGUAGE_ICON} onPress={() => open('language')}>
            <Text style={[styles.value, valueStyle]}>{language}</Text>
            <ChevronIcon dotSize={dotSize} />
          </DotModalRow>
          <DotModalRow dotSize={dotSize} icon={THEME_ICON} onPress={() => open('theme')}>
            <Text style={[styles.value, valueStyle]}>{theme}</Text>
            <ChevronIcon dotSize={dotSize} />
          </DotModalRow>
          <DotModalRow dotSize={dotSize} icon={VIBRATION_ICON}>
            <DotToggle dotSize={dotSize} value={isVibrationEnabled} style={styles.trailing} onValueChange={setVibrationEnabled} />
          </DotModalRow>
        </>
      ),
    },
    language: {
      render: () => (
        <>
          {LANGUAGES.map((option, index) => (
            <DotModalCheckRow
              key={option}
              dotSize={dotSize}
              name={option}
              description={index === 0 ? '지원하지 않는 언어는 영어로 표시' : undefined}
              checked={option === language}
              testID={option}
              onPress={() => setLanguage(option)}
            />
          ))}
        </>
      ),
    },
    theme: {
      render: () => (
        <>
          {THEMES.map((option) => (
            <DotModalCheckRow key={option} dotSize={dotSize} name={option} checked={option === theme} testID={option} onPress={() => setTheme(option)} />
          ))}
        </>
      ),
    },
  };

  return (
    <SafeAreaProvider>
      <View style={styles.frame}>
        <DotModalStack dotSize={dotSize} initial="main" screens={screens} onClose={() => {}} />
      </View>
    </SafeAreaProvider>
  );
};

const meta: Meta<typeof ModalStackPreview> = {
  component: ModalStackPreview,
  args: { dotSize: 2 },
};

export default meta;

export const Interactive: StoryObj<typeof ModalStackPreview> = {};

const styles = StyleSheet.create({
  frame: {
    height: 600,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  trailing: {
    marginLeft: 'auto',
  },
});
