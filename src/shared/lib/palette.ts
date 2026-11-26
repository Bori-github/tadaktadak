import { createContext, useContext } from 'react';

import { COLOR_TOKENS } from '@/shared/constants';

/** 모든 테마 컬렉션에 있는 피그마 변수 이름 */
type PaletteTokenName = keyof typeof COLOR_TOKENS.campfire & keyof typeof COLOR_TOKENS.winter;

/**
 * 피그마 테마 컬렉션의 색 토큰으로 팔레트 생성
 *
 * @param tokens - 테마 컬렉션의 변수 이름별 색
 * @returns 테마의 색 표
 */
export const createPalette = (tokens: Record<PaletteTokenName, string>) =>
  ({
    canvas: tokens.canvas,
    glow: tokens.glow,
    focus: {
      arc: tokens['focus/arc'],
      text: tokens['focus/text'],
      thumbArm: tokens['focus/thumb-arm'],
      thumbCore: tokens['focus/thumb-core'],
      numeral: tokens['focus/numeral'],
      marker: tokens['focus/marker'],
    },
    rest: {
      arc: tokens['rest/arc'],
      text: tokens['rest/text'],
      thumbArm: tokens['rest/thumb-arm'],
      thumbCore: tokens['rest/thumb-core'],
    },
    button: {
      edge: tokens['button/edge'],
      face: tokens['button/face'],
      highlight: tokens['button/highlight'],
      shadow: tokens['button/shadow'],
      disabledEdge: tokens['button/disabled-edge'],
      disabledFace: tokens['button/disabled-face'],
      disabledShadow: tokens['button/disabled-shadow'],
    },
    icon: {
      check: tokens['icon/check'],
      default: tokens['icon/default'],
      disabled: tokens['icon/disabled'],
      secondary: tokens['icon/secondary'],
    },
    text: {
      primary: tokens['text/primary'],
      secondary: tokens['text/secondary'],
      tertiary: tokens['text/tertiary'],
    },
    modal: {
      edge: tokens['modal/edge'],
      face: tokens['modal/face'],
      skeleton: tokens['modal/skeleton'],
    },
    tooltip: {
      edge: tokens['tooltip/edge'],
      face: tokens['tooltip/face'],
      shadow: tokens['tooltip/shadow'],
    },
    toast: {
      edge: tokens['toast/edge'],
      face: tokens['toast/face'],
      shadow: tokens['toast/shadow'],
    },
    toggle: {
      on: tokens['toggle/on'],
    },
    particle: {
      start: tokens['particle/start'],
      middle: tokens['particle/middle'],
      end: tokens['particle/end'],
    },
  }) as const;

/** 테마마다 값이 다른 색 표 */
export type Palette = ReturnType<typeof createPalette>;

export const DEFAULT_PALETTE = createPalette(COLOR_TOKENS.campfire);

// Provider 밖(테스트 등)에서 기본 팔레트로 처리
export const PaletteContext = createContext<Palette>(DEFAULT_PALETTE);

/**
 * 표시 중인 테마의 색 표
 *
 * @returns Provider가 지정한 팔레트. 없으면 기본 팔레트
 */
export const usePalette = (): Palette => useContext(PaletteContext);
