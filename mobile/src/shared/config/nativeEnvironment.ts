import { NativeModules } from 'react-native';

export interface NativeEnvironmentConstants {
  API_BASE_URL?: string;
  BUNDLED_LOCAL?: boolean;
}

/**
 * Accesses compile-time environment configuration exposed by native platform modules.
 * - Android: EnvironmentConfigModule (exposing BuildConfig.API_BASE_URL)
 * - iOS: EnvironmentConfigModule (exposing Info.plist WORKSPHERE_API_BASE_URL)
 */
export function getNativeEnvironmentConstants(): NativeEnvironmentConstants {
  const nativeModule = NativeModules.EnvironmentConfig as
    | {
        getConstants?: () => NativeEnvironmentConstants;
        API_BASE_URL?: string;
        BUNDLED_LOCAL?: boolean;
      }
    | undefined;

  if (!nativeModule) {
    return {};
  }

  const constants =
    typeof nativeModule.getConstants === 'function'
      ? nativeModule.getConstants()
      : nativeModule;

  return {
    API_BASE_URL: constants?.API_BASE_URL,
    BUNDLED_LOCAL: constants?.BUNDLED_LOCAL === true,
  };
}
