import { type JSX, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { useCanShowAdvertisement } from '@/entities/advertisement';

import { COLORS, DOT_SIZE } from '@/shared/constants';

// TODO: AdMob 광고 단위 ID 발급 후 `TestIds`를 실제 ID로 교체
const BANNER_UNIT_ID = TestIds.ADAPTIVE_BANNER;

/** `BannerAd` `maxHeight`와 로드 전 배너 영역 `minHeight` 값 (px) */
const BANNER_HEIGHT = 40;

type AdvertisementFooterProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  /** 배너 폭 (px) */
  width: number;
};

/**
 * 설정 화면 하단 구분선과 광고 배너
 *
 * @returns 구분선과 배너. 광고 표시 불가 또는 로드 실패 시 null
 */
export const AdvertisementFooter = ({ dotSize, width }: AdvertisementFooterProps): JSX.Element | null => {
  const canShowAdvertisement = useCanShowAdvertisement();
  const [hasLoadFailed, setHasLoadFailed] = useState(false);
  if (!canShowAdvertisement || hasLoadFailed) return null;

  const scale = dotSize / DOT_SIZE;

  const dividerStyle = { height: dotSize, marginBottom: 16 * scale };
  const bannerAreaStyle = { width, minHeight: BANNER_HEIGHT, marginBottom: 16 * scale };

  return (
    <View testID="advertisement-footer">
      <View style={[styles.divider, dividerStyle]} />
      <View testID="advertisement-banner-area" style={[styles.bannerArea, bannerAreaStyle]}>
        <BannerAd unitId={BANNER_UNIT_ID} size={BannerAdSize.INLINE_ADAPTIVE_BANNER} width={width} maxHeight={BANNER_HEIGHT} onAdFailedToLoad={() => setHasLoadFailed(true)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  divider: {
    backgroundColor: COLORS.modal.edge,
  },
  bannerArea: {
    alignSelf: 'center',
  },
});
