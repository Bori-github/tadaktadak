import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { type Decorator, type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { WARNING_ICON } from '@/shared/ui/dot-icon';
import { PortalHost } from '@/shared/ui/portal';

import { DotToast } from './DotToast';

const withPortalHost: Decorator = (Story) => (
  <GestureHandlerRootView style={styles.frame}>
    <PortalHost>
      <View style={styles.frame}>
        <Story />
      </View>
    </PortalHost>
  </GestureHandlerRootView>
);

const meta: Meta<typeof DotToast> = {
  component: DotToast,
  args: { dotSize: 2, text: '이미 타이머가 진행 중이에요', icon: WARNING_ICON, top: 40, isVisible: true, onClose: () => {} },
  decorators: [withPortalHost],
};

export default meta;

export const Visible: StoryObj<typeof DotToast> = {};

const styles = StyleSheet.create({
  frame: {
    height: 200,
  },
});
