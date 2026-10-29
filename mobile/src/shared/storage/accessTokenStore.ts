/**
 * In-Memory Access Token Store for WorkSphere Mobile
 *
 * Rules:
 * - Module-private variable; lives ONLY in runtime memory.
 * - NEVER persisted to AsyncStorage or Keychain.
 * - Zero token logging.
 * - Pure getter / setter / clearer.
 */

let inMemoryAccessToken: string | null = null;

export const accessTokenStore = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
  },

  clearAccessToken(): void {
    inMemoryAccessToken = null;
  },
};
