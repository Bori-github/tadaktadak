import { describe, expect, it } from '@jest/globals';
import { Canvas } from '@shopify/react-native-skia';
import { render, screen } from '@testing-library/react-native';

import { DotSprite } from './DotSprite';

describe('DotSprite', () => {
  it('켜진 도트만 격자 좌표에 놓는다', async () => {
    // Canvas 밖에서는 Skia 노드가 만들어지지 않아 감싼다
    await render(
      <Canvas style={{ width: 200, height: 200 }}>
        <DotSprite grid={['#.', '.#']} centerX={100} centerY={100} dotSize={4} colors={{ '#': '#ffffff' }} />
      </Canvas>,
    );

    const rects = screen.container.queryAll((node) => node.type === 'skRect').map(({ props }) => ({ x: props.x, y: props.y }));

    expect(rects).toEqual([
      { x: 96, y: 96 },
      { x: 100, y: 100 },
    ]);
  });
});
