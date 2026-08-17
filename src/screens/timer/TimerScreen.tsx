import { Canvas, Fill } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '../../shared/constants/colors';

export function TimerScreen() {
  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill color={COLORS.canvas} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
});
