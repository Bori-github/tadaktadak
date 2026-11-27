import { memo } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';

import { showPrivacyOptions, usePrivacyOptionsRequired } from '@/entities/advertisement';
import { translate, useLanguage } from '@/entities/language';

import { DOT_SIZE } from '@/shared/constants';
import { usePalette } from '@/shared/lib';

import { ChevronIcon } from '@/shared/ui/dot-icon';
import { DotModalRow } from '@/shared/ui/dot-modal';

const PRIVACY_POLICY_URL = 'https://hello-tadaktadak.vercel.app/privacy';

const openPrivacyPolicy = (): void => {
  // https 주소를 여는 앱이 없을 때만 실패해 알림 없이 무시함
  Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
};

type MoreListProps = {
  dotSize: number;
};

/**
 * 더보기 화면 목록
 *
 * @returns 앱 버전 행, 개인정보 처리방침 행, 개인정보 옵션이 필요하면 개인정보 옵션 행
 */
export const MoreList = memo(({ dotSize }: MoreListProps) => {
  const language = useLanguage();
  const isPrivacyOptionsRequired = usePrivacyOptionsRequired();
  const palette = usePalette();
  const fontSize = 16 * (dotSize / DOT_SIZE);
  const labelStyle = { color: palette.text.primary, fontSize };
  const valueStyle = { color: palette.text.secondary, fontSize };

  return (
    <>
      <DotModalRow dotSize={dotSize}>
        <Text style={[styles.label, labelStyle]}>{translate('more.appVersion', language)}</Text>
        <Text style={valueStyle}>{Constants.expoConfig?.version}</Text>
      </DotModalRow>
      <DotModalRow dotSize={dotSize} testID="more-privacy-policy" onPress={openPrivacyPolicy}>
        <Text style={[styles.label, labelStyle]}>{translate('more.privacyPolicy', language)}</Text>
        <ChevronIcon dotSize={dotSize} />
      </DotModalRow>
      {isPrivacyOptionsRequired ? (
        <DotModalRow dotSize={dotSize} testID="more-privacy-options" onPress={showPrivacyOptions}>
          <Text style={[styles.label, labelStyle]}>{translate('more.privacyOptions', language)}</Text>
          <ChevronIcon dotSize={dotSize} />
        </DotModalRow>
      ) : null}
    </>
  );
});

MoreList.displayName = 'MoreList';

const styles = StyleSheet.create({
  label: {
    flex: 1,
  },
});
