import { View } from 'react-native';
import { type Preview } from '@storybook/react-native-web-vite';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// Skia 모듈 평가 시점에 global.CanvasKit을 참조하므로 스토리 import 전 로드
await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });

const { THEMES } = await import('@/entities/theme');
const { PaletteContext } = await import('@/shared/lib');

const preview: Preview = {
  globalTypes: {
    theme: {
      description: '테마',
      toolbar: { title: '테마', items: ['campfire', 'winter'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'campfire' },
  decorators: [
    (Story, { globals }) => {
      const { palette } = THEMES[globals.theme as 'campfire' | 'winter'];

      return (
        <PaletteContext.Provider value={palette}>
          <View style={{ backgroundColor: palette.canvas }}>
            <Story />
          </View>
        </PaletteContext.Provider>
      );
    },
  ],
};

export default preview;
