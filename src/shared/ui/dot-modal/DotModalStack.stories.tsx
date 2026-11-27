import { type JSX, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Canvas } from '@shopify/react-native-skia';
import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { DOT_SIZE } from '@/shared/constants';
import { usePalette } from '@/shared/lib';

import { ChevronIcon, LANGUAGE_ICON, RectIconShape, THEME_ICON, type RectIcon } from '@/shared/ui/dot-icon';

import { DotModalStack, type DotModalScreen } from './DotModalStack';

type ModalView = 'main' | 'language' | 'theme';

/** 배율 1의 논리 픽셀. 피그마 `설정 화면 · 페이지` 행 높이 */
const ROW_HEIGHT = 56;

type RowProps = {
  dotSize: number;
  onPress?: () => void;
  children: ReactNode;
};

const Row = ({ dotSize, onPress, children }: RowProps): JSX.Element => {
  const scale = dotSize / DOT_SIZE;

  return (
    <Pressable style={[styles.row, { height: ROW_HEIGHT * scale, paddingHorizontal: 20 * scale }]} onPress={onPress}>
      {children}
    </Pressable>
  );
};

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
    <Row dotSize={dotSize} onPress={onPress}>
      <Canvas style={{ width: iconSize, height: iconSize }}>
        <RectIconShape icon={icon} left={0} top={0} dotSize={dotSize} color={palette.icon.default} />
      </Canvas>
      <Text style={[styles.value, { color: palette.text.secondary, fontSize: 16 * scale, marginRight: 13 * scale }]}>{value}</Text>
      <ChevronIcon dotSize={dotSize} />
    </Row>
  );
};

const OptionRow = ({ dotSize, label }: { dotSize: number; label: string }): JSX.Element => {
  const palette = usePalette();

  return (
    <Row dotSize={dotSize}>
      <Text style={{ color: palette.text.primary, fontSize: (16 * dotSize) / DOT_SIZE }}>{label}</Text>
    </Row>
  );
};

const createScreens = (dotSize: number): Record<ModalView, DotModalScreen<ModalView>> => ({
  main: {
    render: ({ open }) => (
      <>
        <MenuRow dotSize={dotSize} icon={LANGUAGE_ICON} value="한국어" onPress={() => open('language')} />
        <MenuRow dotSize={dotSize} icon={THEME_ICON} value="모닥불" onPress={() => open('theme')} />
      </>
    ),
  },
  language: {
    render: () => (
      <>
        <OptionRow dotSize={dotSize} label="시스템 설정" />
        <OptionRow dotSize={dotSize} label="한국어" />
        <OptionRow dotSize={dotSize} label="English" />
      </>
    ),
  },
  theme: {
    render: () => (
      <>
        <OptionRow dotSize={dotSize} label="모닥불" />
        <OptionRow dotSize={dotSize} label="겨울" />
      </>
    ),
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
});
