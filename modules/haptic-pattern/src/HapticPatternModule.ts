import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class HapticPatternModule extends NativeModule {
  isSupported(): boolean;
}

export const hapticPattern = requireOptionalNativeModule<HapticPatternModule>('HapticPattern');
