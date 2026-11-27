/// <reference types="vite/client" />
import { type JSX, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { DOT_SIZE } from '@/shared/constants';
import { type Palette, usePalette } from '@/shared/lib';

import { DotSprite } from '@/shared/ui/dot-sprite';

import { RectIconShape } from './RectIconShape';
import { type GridIcon, type RectIcon } from './types';

// 아이콘 파일을 추가하면 목록에 자동 반영. index.ts는 같은 아이콘을 다시 내보내므로 제외
const ICON_MODULES = import.meta.glob<Record<string, unknown>>(['./*.ts', '!./index.ts', '!./*.test.ts'], { eager: true });

// 앱에서 icon.default 외의 색으로 그리는 아이콘. DotModalCheckRow와 ChevronIcon 기준
const ICON_COLOR_KEYS: Partial<Record<string, keyof Palette['icon']>> = { CHECK_ICON: 'check', CHEVRON_ICON: 'secondary' };

const isGridIcon = (value: unknown): value is GridIcon => Array.isArray(value) && value.every((row) => typeof row === 'string');

const isRectIcon = (value: unknown): value is RectIcon => typeof value === 'object' && value !== null && 'boxSize' in value && 'rects' in value;

const ICON_EXPORTS = Object.values(ICON_MODULES).flatMap((module) => Object.entries(module));

const IconCell = ({ name, children }: { name: string; children: ReactNode }): JSX.Element => {
  const palette = usePalette();

  return (
    <View style={styles.cell}>
      <View style={styles.icon}>{children}</View>
      <Text style={[styles.name, { color: palette.text.secondary }]}>{name}</Text>
    </View>
  );
};

const GridIconPreview = ({ grid, dotSize, color }: { grid: GridIcon; dotSize: number; color: string }): JSX.Element => {
  const width = Math.max(...grid.map((row) => row.length)) * dotSize;
  const height = grid.length * dotSize;

  return (
    <Canvas style={{ width, height }}>
      <DotSprite grid={grid} centerX={width / 2} centerY={height / 2} dotSize={dotSize} colors={{ I: color }} />
    </Canvas>
  );
};

const RectIconPreview = ({ icon, dotSize, color }: { icon: RectIcon; dotSize: number; color: string }): JSX.Element => {
  const size = (icon.boxSize * dotSize) / DOT_SIZE;

  return (
    <Canvas style={{ width: size, height: size }}>
      <RectIconShape icon={icon} left={0} top={0} dotSize={dotSize} color={color} />
    </Canvas>
  );
};

const IconPreview = ({ name, icon, dotSize }: { name: string; icon: unknown; dotSize: number }): JSX.Element | null => {
  const palette = usePalette();
  const color = palette.icon[ICON_COLOR_KEYS[name] ?? 'default'];

  if (isGridIcon(icon)) return <GridIconPreview grid={icon} dotSize={dotSize} color={color} />;
  if (isRectIcon(icon)) return <RectIconPreview icon={icon} dotSize={dotSize} color={color} />;

  return null;
};

const IconGallery = ({ dotSize }: { dotSize: number }): JSX.Element => (
  <View style={styles.gallery}>
    {ICON_EXPORTS.map(([name, icon]) => (
      <IconCell key={name} name={name}>
        <IconPreview name={name} icon={icon} dotSize={dotSize} />
      </IconCell>
    ))}
  </View>
);

const meta: Meta<typeof IconGallery> = {
  component: IconGallery,
  args: { dotSize: 2 },
};

export default meta;

export const All: StoryObj<typeof IconGallery> = {};

const styles = StyleSheet.create({
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  cell: {
    width: 140,
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    height: 48,
    justifyContent: 'center',
  },
  name: {
    fontSize: 11,
  },
});
