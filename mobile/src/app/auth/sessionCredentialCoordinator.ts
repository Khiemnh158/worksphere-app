import { secureStorage } from '../../shared/storage/secureStorage';
import { accessTokenStore } from '../../shared/storage/accessTokenStore';

/**
 * Global session credential coordinator.
 *
 * Provides serialized, FIFO credential commit & teardown transactions.
 * Rules:
 * 1. Exactly one credential mutation executes at any point in time.
 * 2. Monotonically increasing generation number tracks session validity.
 * 3. Every transaction verifies that its expectedGeneration is still current
 *    immediately before writing to Keychain.
 * 4. Stale transactions reject without mutating storage.
 * 5. Rejections or errors do not break or poison subsequent queued transactions.
 * 6. Never logs token values.
 */

let credentialGeneration = 1;
let credentialQueue: Promise<void> = Promise.resolve();

/**
 * Returns the current credential transaction generation.
 */
export function getSessionCredentialGeneration(): number {
  return credentialGeneration;
}

/**
 * Synchronously invalidates existing credential transactions and increments generation.
 * All in-flight or pending transactions expecting previous generations will reject.
 */
export function invalidateSessionCredentials(): number {
  credentialGeneration += 1;
  return credentialGeneration;
}

/**
 * Returns whether an in-memory access token is currently present.
 * Read-only inspection; does not mutate credentials.
 */
export function hasActiveAccessToken(): boolean {
  return accessTokenStore.getAccessToken() !== null;
}

/**
 * Enqueues an asynchronous credential transaction into the FIFO queue.
 * Ensures that if `operation` throws, future operations still execute.
 */
function enqueueCredentialTransaction<T>(operation: () => Promise<T>): Promise<T> {
  const result = credentialQueue.then(operation, operation);
  credentialQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

/**
 * Commits freshly authenticated login credentials.
 * Serialized in the credential queue.
 * Verifies generation immediately before Keychain mutation.
 * Commits access token to memory store ONLY after Keychain write succeeds.
 */
export async function commitLoginCredentials(
  expectedGeneration: number,
  refreshToken: string,
  accessToken: string
): Promise<void> {
  return enqueueCredentialTransaction(async () => {
    if (credentialGeneration !== expectedGeneration) {
      throw new Error('Phiên đăng nhập đã bị hủy bởi tác vụ xác thực mới hơn');
    }

    try {
      await secureStorage.setRefreshToken(refreshToken);
    } catch (storageError) {
      accessTokenStore.clearAccessToken();
      try {
        await secureStorage.clearRefreshToken();
      } catch {
        // Best-effort
      }
      throw storageError;
    }

    if (credentialGeneration !== expectedGeneration) {
      throw new Error('Phiên đăng nhập đã bị hủy bởi tác vụ xác thực mới hơn');
    }

    accessTokenStore.setAccessToken(accessToken);
  });
}

/**
 * Commits rotated refresh credentials.
 * Serialized in the credential queue.
 * Verifies generation immediately before Keychain mutation.
 * Commits access token to memory store ONLY after Keychain write succeeds.
 */
export async function commitRefreshedCredentials(
  expectedGeneration: number,
  refreshToken: string,
  accessToken: string
): Promise<void> {
  return enqueueCredentialTransaction(async () => {
    if (credentialGeneration !== expectedGeneration) {
      throw new Error('Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn');
    }

    try {
      await secureStorage.setRefreshToken(refreshToken);
    } catch (storageError) {
      if (credentialGeneration === expectedGeneration) {
        accessTokenStore.clearAccessToken();
        try {
          await secureStorage.clearRefreshToken();
        } catch {
          // Best-effort
        }
      }
      throw storageError;
    }

    if (credentialGeneration !== expectedGeneration) {
      throw new Error('Phiên làm mới đã bị hủy bởi tác vụ xác thực mới hơn');
    }

    accessTokenStore.setAccessToken(accessToken);
  });
}

/**
 * Clears credentials from both Keychain and memory store.
 * Serialized in the credential queue.
 * If expectedGeneration is provided, clear only proceeds if generation still matches.
 * If expectedGeneration is omitted, clear proceeds unconditionally as part of explicit teardown.
 */
export async function clearSessionCredentials(expectedGeneration?: number): Promise<void> {
  return enqueueCredentialTransaction(async () => {
    if (expectedGeneration !== undefined && credentialGeneration !== expectedGeneration) {
      return;
    }

    accessTokenStore.clearAccessToken();
    try {
      await secureStorage.clearRefreshToken();
    } catch {
      // Best-effort Keychain clear
    }
  });
}

/**
 * Narrowly scoped bootstrap helper: clears stale in-memory access token only.
 * Serialized in the credential queue.
 * Does NOT clear the Keychain refresh token, preserving persistent session for bootstrap.
 * Verifies generation if expectedGeneration is provided.
 */
export async function clearAccessTokenForBootstrap(expectedGeneration?: number): Promise<void> {
  return enqueueCredentialTransaction(async () => {
    if (expectedGeneration !== undefined && credentialGeneration !== expectedGeneration) {
      return;
    }

    accessTokenStore.clearAccessToken();
  });
}

/**
 * Test helper: waits for credential queue to drain and resets state.
 * NOT exported to feature barrels or production code.
 */
export async function resetSessionCredentialCoordinatorForTests(): Promise<void> {
  await credentialQueue;
  credentialGeneration = 1;
  credentialQueue = Promise.resolve();
}
