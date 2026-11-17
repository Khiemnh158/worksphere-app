/**
 * Axios Request Metadata Module Augmentation
 * Extends AxiosRequestConfig with typed transport metadata used by WorkSphere API client.
 * Relocated from feature-scoped authTypes.ts to shared transport layer per D-060 and Phase 13A audit.
 */

import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    _retry?: boolean;
    _sessionGeneration?: number;
  }
}
