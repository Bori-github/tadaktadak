import { memo } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';

import { SettingsRow } from './SettingsRow';

import { translate, useLanguage } from '@/entities/language';

import { COLORS, DOT_SIZE } from '@/shared/constants';

import { ChevronIcon } from '@/shared/ui/dot-icon';

const PRIVACY_POLICY_URL = 'https://qhflrnfl4324.notion.site/tadaktadak';

const openPrivacyPolicy = (): void => {
  // https 주소를 여는 앱이 없을 때만 실패해 알림 없이 무시함
  Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
};

type MoreListProps = {
  dotSize: number;
};

export const MoreList = memo(({ dotSize }: MoreListProps) => {
  const language = useLanguage();
  const fontStyle = { fontSize: 16 * (dotSize / DOT_SIZE) };

  return (
    <>
      <SettingsRow index={0} dotSize={dotSize}>
        <Text style={[styles.label, fontStyle]}>{translate('more.appVersion', language)}</Text>
        <Text style={[styles.value, fontStyle]}>{Constants.expoConfig?.version}</Text>
      </SettingsRow>
      <SettingsRow index={1} dotSize={dotSize} testID="more-privacy-policy" onPress={openPrivacyPolicy}>
        <Text style={[styles.label, fontStyle]}>{translate('more.privacyPolicy', language)}</Text>
        <ChevronIcon dotSize={dotSize} />
      </SettingsRow>
    </>
  );
});

MoreList.displayName = 'MoreList';

const styles = StyleSheet.create({
  label: {
    flex: 1,
    color: COLORS.text.primary,
  },
  value: {
    color: COLORS.text.secondary,
  },
});
