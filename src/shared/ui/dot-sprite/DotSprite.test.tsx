import { describe, expect, it } from '@jest/globals';
import { Canvas, Rect } from '@shopify/react-native-skia';
import TestRenderer from 'react-test-renderer';

import { DotSprite } from './DotSprite';

describe('DotSprite', () => {
  it('켜진 도트만 격자 좌표에 놓는다', () => {
    // Canvas 밖에서는 Skia 노드가 만들어지지 않아 감싼다
    let tree!: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <Canvas style={{ width: 200, height: 200 }}>
          <DotSprite grid={['#.', '.#']} centerX={100} centerY={100} dotSize={4} colors={{ '#': '#ffffff' }} />
        </Canvas>,
      );
    });

    const rects = tree.root.findAllByType(Rect).map(({ props }) => ({ x: props.x, y: props.y }));

    expect(rects).toEqual([
      { x: 96, y: 96 },
      { x: 100, y: 100 },
    ]);
  });
});
