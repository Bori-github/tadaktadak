import { type JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { type Decorator, type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { usePalette } from '@/shared/lib';

import { DotModal } from './DotModal';

const ModalBody = (): JSX.Element => <Text style={{ color: usePalette().text.primary }}>모달 내용</Text>;

const withSafeArea: Decorator = (Story) => (
  <SafeAreaProvider>
    <View style={styles.frame}>
      <Story />
    </View>
  </SafeAreaProvider>
);

const meta: Meta<typeof DotModal> = {
  component: DotModal,
  args: { dotSize: 2, onClose: () => {}, children: <ModalBody /> },
  decorators: [withSafeArea],
};

export default meta;

export const Default: StoryObj<typeof DotModal> = {};
export const WithBack: StoryObj<typeof DotModal> = { args: { onBack: () => {} } };

const styles = StyleSheet.create({
  frame: {
    height: 600,
  },
});
