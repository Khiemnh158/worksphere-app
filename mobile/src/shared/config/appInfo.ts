/**
 * Application Metadata
 * Authoritative version source from package.json metadata.
 * Note: MOBILE_APP_VERSION_NATIVE_WIRING_DEFERRED is recorded as no cross-platform
 * native version bridge exists without adding third-party native dependencies.
 */

import packageJson from '../../../package.json';

export const APP_INFO = {
  name: 'WorkSphere Mobile',
  version: packageJson.version || '0.0.1',
  author: 'WorkSphere Team',
} as const;
