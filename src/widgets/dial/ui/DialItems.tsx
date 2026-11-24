import { Atlas, Circle, Group, RadialGradient, Skia, vec, type SkRect, type SkRSXform } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { DIAL_ITEM_STYLES } from '../config/items';
import { DOT_SAMPLING, SOFT_SAMPLING, drawSprites, packSprites } from '../lib/atlas';
import { TICK_NUMBERS } from '../config/ticks';
import { BLOOM_ALPHA, BLOOM_RADIUS, CENTER_BLOOM_ALPHA, CENTER_BLOOM_RATIO, HALO_ALPHA, HALO_RADIUS, bloomRadius, drawBloom, getBloomGradient, glowSprites } from '../lib/bloom';
import { pointOnDial } from '../lib/geometry';
import { clockwisePhase } from '../lib/phase';
import { useFlickerStep } from '../model/flicker';
import { useDisplayedTheme } from '@/entities/theme';
import { ignitionProgress } from '@/entities/timer';
import { DOT_SIZE, type BonfireHeightInDots } from '@/shared/constants';
import { topLeftOnGrid, type Palette } from '@/shared/lib';
import { MARKER, getSpriteColors } from '@/shared/ui/dot-sprite';

/** 아틀라스 내 스프라이트 인덱스. `FIRST_FRAME`부터 1분 눈금, 5분 눈금 `frames` 순 */
const LOG = 0;
const BONFIRE = 1;
const START_MARKER = 2;
const FIRST_FRAME = 3;

type DialItemsProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
  bonfireHeightInDots: BonfireHeightInDots;
  /** 남은 시간(분). 대기에서는 설정 시간이라 아무 눈금도 붙지 않음 */
  remainingMinutes: number;
  settingMinutes: number;
  /** 점화 개체 밝기 감소 상태. 일시정지 시 불꽃 프레임 정지. `DESIGN.md` §8 */
  dimming: 'none' | 'paused' | 'completed';
  /** 대기 상태 여부. 대기 상태에서 가운데 빛 번짐이 없음. `DESIGN.md` §6 */
  isReady: boolean;
  palette: Palette;
};

type Placement = { sprite: SkRect; transform: SkRSXform };

/** `Atlas`의 `sprites`·`transforms`에 그대로 넘길 두 배열 */
type AtlasBatch = { sprites: SkRect[]; transforms: SkRSXform[] };

const BLOOM_SPRITES = glowSprites(BLOOM_RADIUS);
const HALO_SPRITES = glowSprites(HALO_RADIUS);

/** 일시정지에서 잦아드는 불 밝기와 걸리는 시간. `DESIGN.md` §8 §9 */
const PAUSED_BRIGHTNESS = 0.35;
const FADE_MS = 500;

/** 설정 시간 밖 눈금 알파 */
const OUT_OF_SETTING_ALPHA = 0.55;

/** 가운데 빛 번짐이 나타나는 시간. `DESIGN.md` §9 */
const CENTER_BLOOM_FADE_IN_MS = 300;

const toBatch = (items: Placement[]): AtlasBatch => ({
  sprites: items.map((item) => item.sprite),
  transforms: items.map((item) => item.transform),
});

export const DialItems = memo(({ centerX, centerY, radius, dotSize, bonfireHeightInDots, remainingMinutes, settingMinutes, dimming, isReady, palette }: DialItemsProps) => {
  // `useSyncExternalStore` 기반이라 Skia `Canvas` 내부에서도 조회 가능
  const style = DIAL_ITEM_STYLES[useDisplayedTheme()];
  const centerBloomGradient = useMemo(() => getBloomGradient(palette.glow), [palette]);
  const bloomGradient = useMemo(() => (style.bloomColor ? getBloomGradient(style.bloomColor) : centerBloomGradient), [style, centerBloomGradient]);
  const grids = useMemo(() => {
    const major = style.major[bonfireHeightInDots];
    return [style.minor.base, major.base, MARKER, ...style.minor.frames, ...major.frames];
  }, [style, bonfireHeightInDots]);

  const packed = useMemo(() => packSprites(grids), [grids]);
  const image = useMemo(() => drawSprites(grids, packed, { ...style.colors, ...getSpriteColors(palette) }), [grids, packed, style, palette]);
  const bloomImage = useMemo(() => drawBloom(bloomGradient, BLOOM_RADIUS), [bloomGradient]);
  const haloImage = useMemo(() => (style.haloColor ? drawBloom(getBloomGradient(style.haloColor), HALO_RADIUS) : null), [style]);

  // 스프라이트 사각형과 좌표는 시계판 크기로만 정해지므로 미리 만들어 두고 고르기만 함
  const prepared = useMemo(() => {
    const spriteOf = (kind: number): SkRect => {
      const box = packed.boxes[kind];
      return box ? Skia.XYWHRect(box.left, box.top, box.widthInDots, box.heightInDots) : Skia.XYWHRect(0, 0, 0, 0);
    };

    const transformOf = (kind: number, x: number, y: number): SkRSXform => {
      const box = packed.boxes[kind];
      if (!box) return Skia.RSXform(dotSize, 0, 0, 0);

      const { left, top } = topLeftOnGrid({ centerX: x, centerY: y, widthInDots: box.widthInDots, heightInDots: box.heightInDots, dotSize });
      return Skia.RSXform(dotSize, 0, left * dotSize, top * dotSize);
    };

    const minorFrames = style.minor.frames.map((_, index) => spriteOf(FIRST_FRAME + index));
    const majorFrames = style.major[bonfireHeightInDots].frames.map((_, index) => spriteOf(FIRST_FRAME + minorFrames.length + index));

    const base: Placement[] = [];
    const perTick = TICK_NUMBERS.map((tick) => {
      const isMajorTick = tick % 5 === 0;
      const point = style.centerOf?.(tick, { centerX, centerY, radius, dotSize }) ?? pointOnDial(centerX, centerY, radius, (tick - 0.5) * 6);
      const transform = transformOf(isMajorTick ? BONFIRE : LOG, point.x, point.y);

      const glow = { x: point.x, y: point.y + (style.glowOffsetInDots ?? 0) * dotSize };
      const haloScale = dotSize / DOT_SIZE;
      const haloSpread = (isMajorTick ? HALO_RADIUS.bonfire : HALO_RADIUS.log) * haloScale;
      const halo: Placement = {
        sprite: isMajorTick ? HALO_SPRITES.bonfire : HALO_SPRITES.log,
        transform: Skia.RSXform(haloScale, 0, glow.x - haloSpread, glow.y - haloSpread),
      };

      base.push({ sprite: spriteOf(isMajorTick ? BONFIRE : LOG), transform });

      return { tick, glow, halo, transform, hot: isMajorTick ? majorFrames : minorFrames };
    });

    // 불붙은 모닥불과 한 도트 겹치므로 나중에 그려 덮음. `DESIGN.md` §5 겹침 검산
    const marker = toBatch([{ sprite: spriteOf(START_MARKER), transform: transformOf(START_MARKER, centerX, centerY - radius) }]);

    return { base: toBatch(base), marker, perTick };
  }, [packed, style, bonfireHeightInDots, dotSize, centerX, centerY, radius]);

  const { baseInSetting, baseOutOfSetting } = useMemo(
    () => ({
      baseInSetting: { sprites: prepared.base.sprites.slice(0, settingMinutes), transforms: prepared.base.transforms.slice(0, settingMinutes) },
      baseOutOfSetting: { sprites: prepared.base.sprites.slice(settingMinutes), transforms: prepared.base.transforms.slice(settingMinutes) },
    }),
    [prepared, settingMinutes],
  );

  const lit = useMemo(() => TICK_NUMBERS.map((tick) => ignitionProgress({ tick, remainingMinutes, settingMinutes })), [remainingMinutes, settingMinutes]);

  const step = useFlickerStep(dimming !== 'paused' && lit.some((progress) => progress > 0), style.frameMs);

  const brightness = useSharedValue(1);
  const targetBrightness = { none: 1, paused: PAUSED_BRIGHTNESS, completed: style.completedBrightness }[dimming];

  useEffect(() => {
    brightness.value = withTiming(targetBrightness, { duration: FADE_MS, easing: Easing.inOut(Easing.quad) });
    // `useSharedValue`가 준 값은 고정 참조라 뺌. 넣으면 React Compiler 린트가 안에서 쓰는 것을 막음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetBrightness]);

  const centerBloom = useSharedValue(0);

  useEffect(() => {
    centerBloom.value = isReady ? 0 : withTiming(CENTER_BLOOM_ALPHA, { duration: CENTER_BLOOM_FADE_IN_MS, easing: Easing.inOut(Easing.quad) });
    // `useSharedValue`가 준 값은 고정 참조라 뺌. 넣으면 React Compiler 린트가 안에서 쓰는 것을 막음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const hot = useMemo(() => {
    const burning: Placement[] = [];
    const filling: (Placement & { progress: number; tick: number })[] = [];

    for (const [index, item] of prepared.perTick.entries()) {
      const progress = lit[index] ?? 0;
      if (progress === 0) continue;

      const sprite = item.hot[clockwisePhase(step, item.tick, item.hot.length)] ?? item.hot[0];
      if (!sprite) continue;

      if (progress === 1) burning.push({ sprite, transform: item.transform });
      else filling.push({ sprite, transform: item.transform, progress, tick: item.tick });
    }

    return { burning: toBatch(burning), filling };
  }, [prepared, lit, step]);

  const bloom = useMemo(() => {
    const bonfires: Placement[] = [];
    const logs: Placement[] = [];
    const filling: (Placement & { alpha: number; tick: number })[] = [];

    for (const [index, item] of prepared.perTick.entries()) {
      const progress = lit[index] ?? 0;
      if (progress === 0) continue;

      const isMajorTick = item.tick % 5 === 0;
      const spread = bloomRadius({ tick: item.tick, isMajorTick, progress, step, dotSize });
      const source = isMajorTick ? BLOOM_RADIUS.bonfire : BLOOM_RADIUS.log;
      const placement = {
        sprite: isMajorTick ? BLOOM_SPRITES.bonfire : BLOOM_SPRITES.log,
        transform: Skia.RSXform(spread / source, 0, item.glow.x - spread, item.glow.y - spread),
      };

      if (progress < 1) filling.push({ ...placement, alpha: (isMajorTick ? BLOOM_ALPHA.bonfire : BLOOM_ALPHA.log) * progress, tick: item.tick });
      else (isMajorTick ? bonfires : logs).push(placement);
    }

    return { bonfires: toBatch(bonfires), logs: toBatch(logs), filling };
  }, [prepared, lit, step, dotSize]);

  // 배치가 불꽃 프레임과 무관해 `step` 변경 시 재계산하지 않음
  const halo = useMemo(() => {
    const full: Placement[] = [];
    const filling: (Placement & { alpha: number; tick: number })[] = [];

    for (const [index, item] of prepared.perTick.entries()) {
      const progress = lit[index] ?? 0;
      if (progress === 0) continue;

      if (progress < 1) filling.push({ ...item.halo, alpha: HALO_ALPHA * progress, tick: item.tick });
      else full.push(item.halo);
    }

    return { full: toBatch(full), filling };
  }, [prepared, lit]);

  if (!image) return null;

  return (
    <>
      {bloomImage === null ? null : (
        <Group opacity={brightness}>
          {isReady ? null : (
            <Group opacity={centerBloom}>
              <Circle cx={centerX} cy={centerY} r={radius * CENTER_BLOOM_RATIO}>
                <RadialGradient c={vec(centerX, centerY)} r={radius * CENTER_BLOOM_RATIO} colors={centerBloomGradient} />
              </Circle>
            </Group>
          )}
          {bloom.bonfires.sprites.length === 0 ? null : (
            <Group opacity={BLOOM_ALPHA.bonfire}>
              <Atlas image={bloomImage} sprites={bloom.bonfires.sprites} transforms={bloom.bonfires.transforms} sampling={SOFT_SAMPLING} />
            </Group>
          )}
          {bloom.logs.sprites.length === 0 ? null : (
            <Group opacity={BLOOM_ALPHA.log}>
              <Atlas image={bloomImage} sprites={bloom.logs.sprites} transforms={bloom.logs.transforms} sampling={SOFT_SAMPLING} />
            </Group>
          )}
          {bloom.filling.map((item) => (
            <Group key={item.tick} opacity={item.alpha}>
              <Atlas image={bloomImage} sprites={[item.sprite]} transforms={[item.transform]} sampling={SOFT_SAMPLING} />
            </Group>
          ))}
          {haloImage === null ? null : (
            <>
              {halo.full.sprites.length === 0 ? null : (
                <Group opacity={HALO_ALPHA}>
                  <Atlas image={haloImage} sprites={halo.full.sprites} transforms={halo.full.transforms} sampling={SOFT_SAMPLING} />
                </Group>
              )}
              {halo.filling.map((item) => (
                <Group key={item.tick} opacity={item.alpha}>
                  <Atlas image={haloImage} sprites={[item.sprite]} transforms={[item.transform]} sampling={SOFT_SAMPLING} />
                </Group>
              ))}
            </>
          )}
        </Group>
      )}
      {baseInSetting.sprites.length === 0 ? null : (
        <Atlas image={image} sprites={baseInSetting.sprites} transforms={baseInSetting.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
      )}
      {!style.isOutOfSettingVisible || baseOutOfSetting.sprites.length === 0 ? null : (
        <Group opacity={OUT_OF_SETTING_ALPHA}>
          <Atlas image={image} sprites={baseOutOfSetting.sprites} transforms={baseOutOfSetting.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
        </Group>
      )}
      <Group opacity={brightness}>
        {hot.burning.sprites.length === 0 ? null : (
          <Atlas image={image} sprites={hot.burning.sprites} transforms={hot.burning.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
        )}
        {hot.filling.map((item) => (
          <Group key={item.tick} opacity={item.progress}>
            <Atlas image={image} sprites={[item.sprite]} transforms={[item.transform]} sampling={DOT_SAMPLING} antiAlias={false} />
          </Group>
        ))}
      </Group>
      <Atlas image={image} sprites={prepared.marker.sprites} transforms={prepared.marker.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
    </>
  );
});

DialItems.displayName = 'DialItems';
