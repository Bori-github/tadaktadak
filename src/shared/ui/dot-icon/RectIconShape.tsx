import { type JSX } from 'react';
import { Group, Rect } from '@shopify/react-native-skia';

import { DOT_SIZE } from '@/shared/constants';

import { type RectIcon } from './types';

type RectIconShapeProps = {
  icon: RectIcon;
  /** 아이콘 상자 왼쪽 위 (px) */
  left: number;
  top: number;
  /** 도트 한 변 (px) */
  dotSize: number;
  color: string;
};

export const RectIconShape = ({ icon, left, top, dotSize, color }: RectIconShapeProps): JSX.Element => {
  // 아이콘 좌표가 배율 1 기준. 지금 도트 크기가 배율 1의 몇 배인지가 곱할 값
  const scale = dotSize / DOT_SIZE;

  return (
    <Group antiAlias={false}>
      {icon.rects.map(([x, y, width, height]) => (
        <Rect key={`${x}-${y}-${width}-${height}`} x={left + x * scale} y={top + y * scale} width={width * scale} height={height * scale} color={color} />
      ))}
    </Group>
  );
};
