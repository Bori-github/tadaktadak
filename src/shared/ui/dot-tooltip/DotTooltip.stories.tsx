import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { type Decorator, type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { RoundDotButton } from '@/shared/ui/dot-button';
import { SOUND_ICON } from '@/shared/ui/dot-icon';
import { PortalHost } from '@/shared/ui/portal';

import { DotTooltip } from './DotTooltip';

const withPortalHost: Decorator = (Story) => (
  <GestureHandlerRootView style={styles.frame}>
    <SafeAreaProvider>
      <PortalHost>
        <View style={styles.center}>
          <Story />
        </View>
      </PortalHost>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

const meta: Meta<typeof DotTooltip> = {
  component: DotTooltip,
  args: {
    dotSize: 2,
    text: '모닥불 소리를\n켜고 끌 수 있어요',
    arrowDirection: 'up',
    arrowAlign: 'center',
    isVisible: true,
    onClose: () => {},
  },
  decorators: [withPortalHost],
  render: (args) => (
    <DotTooltip {...args}>
      <RoundDotButton dotSize={args.dotSize} icon={SOUND_ICON} onPress={() => {}} />
    </DotTooltip>
  ),
};

export default meta;

export const ArrowUp: StoryObj<typeof DotTooltip> = {};
export const ArrowDown: StoryObj<typeof DotTooltip> = { args: { arrowDirection: 'down' } };
export const ArrowLeft: StoryObj<typeof DotTooltip> = { args: { arrowDirection: 'left' } };
export const ArrowRight: StoryObj<typeof DotTooltip> = { args: { arrowDirection: 'right' } };
export const ArrowStart: StoryObj<typeof DotTooltip> = { args: { arrowAlign: 'start' } };

const styles = StyleSheet.create({
  frame: {
    height: 400,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
