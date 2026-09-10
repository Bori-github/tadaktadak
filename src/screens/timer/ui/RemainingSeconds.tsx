import { type JSX } from 'react';
import { StyleSheet, Text } from 'react-native';

import { COLORS } from '@/shared/constants';

type RemainingSecondsProps = {
  seconds: number;
};

/** E2E 테스트에서 Skia를 읽지 못해 별도 컴포넌트로 분리 */
export const RemainingSeconds = ({ seconds }: RemainingSecondsProps): JSX.Element => (
  <Text testID="remaining-seconds" style={styles.label}>
    {seconds}
  </Text>
);

const styles = StyleSheet.create({
  label: {
    color: COLORS.focus.text,
    fontSize: 12,
  },
});
