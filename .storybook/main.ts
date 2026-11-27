import { createRequire } from 'node:module';
import { type StorybookConfig } from '@storybook/react-native-web-vite';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  // preview.tsx의 LoadSkiaWeb 요청 경로 `/canvaskit.wasm`으로 제공
  staticDirs: [{ from: '../node_modules/canvaskit-wasm/bin/full', to: '/' }],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      // 문자열 리터럴 유니온 타입을 select 컨트롤로 표시
      shouldExtractLiteralValuesFromEnum: true,
      // node_modules에 선언된 props(React Native 기본 props) 제외
      propFilter: (prop) => (prop.parent ? !prop.parent.fileName.includes('node_modules') : true),
    },
  },
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      modulesToTranspile: ['@shopify/react-native-skia', 'react-native-reanimated', 'react-native-worklets'],
      pluginReactOptions: { babel: { plugins: ['react-native-worklets/plugin'] } },
    },
  },
  viteFinal: async (viteConfig) => {
    const assetRegistry = require.resolve('react-native-web/dist/modules/AssetRegistry');
    // Skia 웹 코드의 AssetRegistry require를 react-native-web 모듈 절대 경로로 resolve. 프레임워크 alias보다 우선 적용
    const resolveAssetRegistry = {
      name: 'skia-asset-registry',
      resolveId: (id: string) => (id === 'react-native/Libraries/Image/AssetRegistry' ? assetRegistry : undefined),
    };
    // Skia 웹 View의 style spread가 객체만 처리하므로 배열 style을 단일 객체로 병합
    const flattenSkiaStyle = {
      name: 'skia-flatten-style',
      transform: (code: string, id: string) => {
        if (!id.includes('react-native-skia') || !id.endsWith('Platform.web.js')) return undefined;

        const flattened = code.replace('...style\n', '...[style].flat(Infinity).reduce((merged, item) => Object.assign(merged, item || {}), {})\n');
        if (flattened === code) {
          throw new Error('Skia Platform.web.js에서 `...style`을 찾지 못함. 배열 style 병합 치환 수정 필요');
        }

        return flattened;
      },
    };
    const rolldownOptions = viteConfig.optimizeDeps?.rolldownOptions ?? {};
    // 정적 빌드의 builtin alias 플러그인 대응. Vite가 나중에 병합한 alias를 우선 적용하므로 vite-plugin-rnw 이후 config 훅에서 추가
    const aliasAssetRegistry = {
      name: 'skia-asset-registry-alias',
      enforce: 'post' as const,
      config: () => ({ resolve: { alias: [{ find: /^react-native\/Libraries\/Image\/AssetRegistry$/, replacement: assetRegistry }] } }),
    };

    return {
      ...viteConfig,
      plugins: [{ ...resolveAssetRegistry, enforce: 'pre' as const }, { ...flattenSkiaStyle, enforce: 'pre' as const }, ...(viteConfig.plugins ?? []), aliasAssetRegistry],
      optimizeDeps: {
        ...viteConfig.optimizeDeps,
        rolldownOptions: { ...rolldownOptions, plugins: [resolveAssetRegistry, flattenSkiaStyle, ...[rolldownOptions.plugins ?? []].flat()] },
      },
    };
  },
};

export default config;
