/**
 * 닫기 아이콘 SVG
 *
 * @param color - 아이콘 색
 * @returns SVG 마크업
 */
export const createCloseIcon = (color: string): string => `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="14" cy="14" r="14" fill="${color}" fill-opacity="0.121569"/>
<rect x="9.93311" y="17.005" width="10" height="1.5" rx="0.75" transform="rotate(-45 9.93311 17.005)" fill="${color}" fill-opacity="0.8"/>
<rect x="10.9951" y="9.933" width="10" height="1.5" rx="0.75" transform="rotate(45 10.9951 9.933)" fill="${color}" fill-opacity="0.8"/>
</svg>`;

/**
 * 뒤로 아이콘 SVG
 *
 * @param color - 아이콘 색
 * @returns SVG 마크업
 */
export const createBackIcon = (color: string): string => `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="14" cy="14" r="14" fill="${color}" fill-opacity="0.121569"/>
<rect x="10.6899" y="14" width="7" height="1.5" rx="0.75" transform="rotate(-45 10.6899 14)" fill="${color}" fill-opacity="0.8"/>
<rect x="11.75" y="12.94" width="7" height="1.5" rx="0.75" transform="rotate(45 11.75 12.94)" fill="${color}" fill-opacity="0.8"/>
</svg>`;
