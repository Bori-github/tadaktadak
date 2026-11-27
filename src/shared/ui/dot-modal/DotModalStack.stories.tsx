import { useState, type JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Canvas } from '@shopify/react-native-skia';
import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { DotModalCheckRow } from './DotModalCheckRow';
import { DotModalRow } from './DotModalRow';
import { DotModalStack, type DotModalScreen } from './DotModalStack';
import { DOT_SIZE } from '@/shared/constants';
import { usePalette } from '@/shared/lib';

import { ChevronIcon, LANGUAGE_ICON, RectIconShape, THEME_ICON, type RectIcon } from '@/shared/ui/dot-icon';

type ModalView = 'main' | 'language' | 'theme';

type MenuRowProps = {
  dotSize: number;
  icon: RectIcon;
  value: string;
  onPress: () => void;
};

const MenuRow = ({ dotSize, icon, value, onPress }: MenuRowProps): JSX.Element => {
  const palette = usePalette();
  const scale = dotSize / DOT_SIZE;
  const iconSize = icon.boxSize * scale;

  return (
    <DotModalRow dotSize={dotSize} onPress={onPress}>
      <Canvas style={{ width: iconSize, height: iconSize }}>
        <RectIconShape icon={icon} left={0} top={0} dotSize={dotSize} color={palette.icon.default} />
      </Canvas>
      <Text style={[styles.value, { color: palette.text.secondary, fontSize: 16 * scale, marginRight: 13 * scale }]}>{value}</Text>
      <ChevronIcon dotSize={dotSize} />
    </DotModalRow>
  );
};

const OptionList = ({ dotSize, options }: { dotSize: number; options: readonly string[] }): JSX.Element => {
  const [selected, setSelected] = useState(options[0]);

  return (
    <>
      {options.map((option) => (
        <DotModalCheckRow key={option} dotSize={dotSize} name={option} checked={option === selected} testID={option} onPress={() => setSelected(option)} />
      ))}
    </>
  );
};

const createScreens = (dotSize: number): Record<ModalView, DotModalScreen<ModalView>> => ({
  main: {
    render: ({ open }) => (
      <>
        <MenuRow dotSize={dotSize} icon={LANGUAGE_ICON} value="시스템 설정" onPress={() => open('language')} />
        <MenuRow dotSize={dotSize} icon={THEME_ICON} value="모닥불" onPress={() => open('theme')} />
      </>
    ),
  },
  language: {
    render: () => <OptionList dotSize={dotSize} options={['시스템 설정', '한국어', 'English']} />,
  },
  theme: {
    render: () => <OptionList dotSize={dotSize} options={['모닥불', '겨울']} />,
  },
});

const ModalStackPreview = ({ dotSize }: { dotSize: number }): JSX.Element => (
  <SafeAreaProvider>
    <View style={styles.frame}>
      <DotModalStack dotSize={dotSize} initial="main" screens={createScreens(dotSize)} onClose={() => {}} />
    </View>
  </SafeAreaProvider>
);

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
});
