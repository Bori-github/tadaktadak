import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class WindowControlsModule extends NativeModule {
  /** 창 제어 버튼을 제외한 safe area 왼쪽 inset(pt). iOS 26 미만은 safeAreaInsets.left */
  getLeftInsetAsync(): Promise<number>;
}

export const windowControls = requireOptionalNativeModule<WindowControlsModule>('WindowControls');
