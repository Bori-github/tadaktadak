import { type JSX, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useCanShowAdvertisement } from '@/entities/advertisement';

import { COLORS, DOT_SIZE } from '@/shared/constants';

// TODO: AdMob 광고 단위 ID 발급 후 `TestIds`를 실제 ID로 교체
const BANNER_UNIT_ID = TestIds.ADAPTIVE_BANNER;

/** `BannerAd` `maxHeight`와 로드 전 배너 영역 `minHeight` 값 (px) */
const BANNER_HEIGHT = 40;

/** 스켈레톤 opacity 최솟값 */
const SKELETON_MIN_OPACITY = 0.45;

/** 스켈레톤 opacity 1 → 최솟값 전환 duration (ms) */
const SKELETON_HALF_PERIOD_MS = 800;

/**
 * 광고 로드 전 배너 영역 스켈레톤
 *
 * @returns opacity 1 ↔ `SKELETON_MIN_OPACITY` 무한 반복 `Animated.View`
 */
const AdvertisementSkeleton = (): JSX.Element => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    const easing = Easing.inOut(Easing.quad);
    opacity.value = withRepeat(
      withSequence(withTiming(SKELETON_MIN_OPACITY, { duration: SKELETON_HALF_PERIOD_MS, easing }), withTiming(1, { duration: SKELETON_HALF_PERIOD_MS, easing })),
      -1,
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View testID="advertisement-skeleton" style={[styles.skeleton, animatedStyle]} />;
};

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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasLoadFailed, setHasLoadFailed] = useState(false);
  if (!canShowAdvertisement || hasLoadFailed) return null;

  const scale = dotSize / DOT_SIZE;

  const dividerStyle = { height: dotSize, marginBottom: 16 * scale };
  const bannerAreaStyle = { width, minHeight: BANNER_HEIGHT, marginBottom: 16 * scale };

  return (
    <View testID="advertisement-footer">
      <View style={[styles.divider, dividerStyle]} />
      <View testID="advertisement-banner-area" style={[styles.bannerArea, bannerAreaStyle]}>
        {hasLoaded ? null : <AdvertisementSkeleton />}
        <BannerAd
          unitId={BANNER_UNIT_ID}
          size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
          width={width}
          maxHeight={BANNER_HEIGHT}
          onAdLoaded={() => setHasLoaded(true)}
          onAdFailedToLoad={() => setHasLoadFailed(true)}
        />
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
  skeleton: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.modal.skeleton,
  },
});
