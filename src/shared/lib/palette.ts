import { createContext, useContext } from 'react';

import { COLORS } from '@/shared/constants';

type WidenColors<TColors> = { readonly [TKey in keyof TColors]: TColors[TKey] extends string ? string : WidenColors<TColors[TKey]> };

/** 테마마다 값이 다른 색 표. 키 구조는 기본 팔레트 `COLORS`와 같음 */
export type Palette = WidenColors<typeof COLORS>;

// Provider 밖(테스트 등)에서 기본 팔레트로 처리
export const PaletteContext = createContext<Palette>(COLORS);

/**
 * 표시 중인 테마의 색 표
 *
 * @returns Provider가 지정한 팔레트. 없으면 기본 팔레트
 */
export const usePalette = (): Palette => useContext(PaletteContext);
