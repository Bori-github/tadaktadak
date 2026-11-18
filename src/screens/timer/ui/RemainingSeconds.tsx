import { type JSX } from 'react';
import { StyleSheet, Text } from 'react-native';

import { usePalette } from '@/shared/lib';

type RemainingSecondsProps = {
  seconds: number;
};

/** E2E 테스트에서 Skia를 읽지 못해 별도 컴포넌트로 분리 */
export const RemainingSeconds = ({ seconds }: RemainingSecondsProps): JSX.Element => {
  const palette = usePalette();

  return (
    <Text testID="remaining-seconds" style={[styles.label, { color: palette.focus.text }]}>
      {seconds}
    </Text>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
  },
});
