import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  ReactNode,
} from 'react';
import { authReducer, initialAuthState } from './authReducer';
import type { AuthContextValue, AuthState, AuthUser } from './authTypes';
import { authApi } from '../../features/auth/api/authApi';
import { mapAuthError } from '../../features/auth/errors/authErrorMapper';
import { secureStorage } from '../../shared/storage/secureStorage';
import {
  registerTokenRefreshHandler,
  registerUnauthorizedHandler,
} from '../../shared/api/apiClient';
import { refreshAccessToken } from './refreshCoordinator';
import {
  invalidateSessionCredentials,
  commitLoginCredentials,
  clearSessionCredentials,
  clearAccessTokenForBootstrap,
  hasActiveAccessToken,
} from './sessionCredentialCoordinator';
import { isNormalizedApiError } from '../../shared/api/apiError';

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  initialState?: Partial<AuthState>;
}

export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const [state, dispatch] = useReducer(
    authReducer,
    initialState ? { ...initialAuthState, ...initialState } : initialAuthState,
  );

  const mountedRef = useRef(true);
  const loginInFlightRef = useRef(false);
  const logoutInFlightRef = useRef(false);
  const bootstrapInFlightRef = useRef(false);
  // Monotonically increasing session generation ID to discard stale async callbacks
  const sessionEpochRef = useRef(1);
  // Exactly-once terminal cleanup promise coalescing concurrent 401 callers
  const terminalCleanupPromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Internal terminal cleanup helper: cleans memory & keychain and notifies reducer.
   * Deduplicated via terminalCleanupPromiseRef so concurrent 401 failures share a single cleanup execution.
   */
  const handleTerminalCleanup = useCallback(async (): Promise<void> => {
    if (terminalCleanupPromiseRef.current) {
      return terminalCleanupPromiseRef.current;
    }

    const cleanupPromise = (async () => {
      sessionEpochRef.current += 1;
      invalidateSessionCredentials();
      await clearSessionCredentials();
      if (mountedRef.current) {
        dispatch({ type: 'BOOTSTRAP_TERMINAL_FAILED' });
      }
    })();

    terminalCleanupPromiseRef.current = cleanupPromise;

    try {
      await cleanupPromise;
    } finally {
      terminalCleanupPromiseRef.current = null;
    }
  }, []);

  /**
   * Cold-start session bootstrap:
   * 1. Checks Keychain for existing refresh token
   * 2. If absent -> UNAUTHENTICATED
   * 3. If present -> calls single-flight refreshCoordinator to rotate token & get accessToken
   * 4. Calls authApi.getCurrentUser() (/me) to populate profile
   * 5. If network/timeout fails -> BOOTSTRAP_RECOVERABLE_FAILED (retains refresh token)
   * 6. If terminal 401/invalid token -> clears session and sets UNAUTHENTICATED
   */
  const runBootstrap = useCallback(async (): Promise<void> => {
    if (bootstrapInFlightRef.current) {
      return;
    }

    bootstrapInFlightRef.current = true;
    const currentEpoch = sessionEpochRef.current;

    if (mountedRef.current) {
      dispatch({ type: 'BOOTSTRAP_STARTED' });
    }

    try {
      // 1. Clear any stale in-memory token from previous lifecycle via coordinator
      await clearAccessTokenForBootstrap();

      // 2. Read refreshToken from Keychain
      const existingRefreshToken = await secureStorage.getRefreshToken();
      if (!existingRefreshToken) {
        if (mountedRef.current && currentEpoch === sessionEpochRef.current) {
          dispatch({ type: 'INITIALIZATION_COMPLETED_UNAUTHENTICATED' });
        }
        return;
      }

      // 3. Call refresh coordinator to rotate token and set access token
      await refreshAccessToken();

      // Check mount and epoch
      if (!mountedRef.current || currentEpoch !== sessionEpochRef.current) {
        return;
      }

      // 4. Fetch user profile from /me
      const userProfile = await authApi.getCurrentUser();

      if (mountedRef.current && currentEpoch === sessionEpochRef.current) {
        dispatch({
          type: 'BOOTSTRAP_SUCCEEDED',
          payload: { user: userProfile },
        });
      }
    } catch (error) {
      if (!mountedRef.current || currentEpoch !== sessionEpochRef.current) {
        return;
      }

      // Classify error: recoverable (network/timeout) vs terminal (401, expired, revoked)
      const mapped = mapAuthError(error);
      const isRecoverable =
        mapped.retryable ||
        (isNormalizedApiError(error) &&
          (error.kind === 'NETWORK_ERROR' || error.kind === 'TIMEOUT'));

      if (isRecoverable) {
        // Keep refresh token in Keychain so user can retry later
        dispatch({
          type: 'BOOTSTRAP_RECOVERABLE_FAILED',
          payload: { error: mapped },
        });
      } else {
        // Terminal failure: clear storage and transition to UNAUTHENTICATED
        await handleTerminalCleanup();
      }
    } finally {
      bootstrapInFlightRef.current = false;
    }
  }, [handleTerminalCleanup]);

  // Wire transport handlers and run cold-start bootstrap on mount
  useEffect(() => {
    mountedRef.current = true;

    // Register refresh coordinator with apiClient transport (ownership protected)
    const unregisterRefresh = registerTokenRefreshHandler(refreshAccessToken);

    // Register 401 unauthorized cleanup handler (ownership protected)
    const unregisterUnauthorized = registerUnauthorizedHandler(
      handleTerminalCleanup,
    );

    // Execute cold-start bootstrap if uninitialized
    runBootstrap();

    return () => {
      mountedRef.current = false;
      unregisterRefresh();
      unregisterUnauthorized();
    };
  }, [handleTerminalCleanup, runBootstrap]);

  const login = async (
    loginInput: string,
    passwordInput: string,
    mfaCode?: string,
  ): Promise<boolean> => {
    if (loginInFlightRef.current || state.operationState === 'authenticating') {
      return false;
    }

    loginInFlightRef.current = true;
    sessionEpochRef.current += 1;
    const loginGeneration = invalidateSessionCredentials();
    const loginEpoch = sessionEpochRef.current;

    if (mountedRef.current) {
      dispatch({ type: 'LOGIN_STARTED' });
    }

    try {
      const response = await authApi.login({
        login: loginInput,
        ...(mfaCode ? { mfaCode: mfaCode.trim() } : {}),
        password: passwordInput,
      });

      if (!mountedRef.current || loginEpoch !== sessionEpochRef.current) {
        await clearSessionCredentials(loginGeneration);
        return false;
      }

      // Serialized credential commit through sessionCredentialCoordinator
      try {
        await commitLoginCredentials(
          loginGeneration,
          response.refreshToken,
          response.accessToken,
        );
      } catch (storageError) {
        if (mountedRef.current && loginEpoch === sessionEpochRef.current) {
          const mappedStorageError = mapAuthError(storageError);
          dispatch({
            type: 'LOGIN_FAILED',
            payload: { error: mappedStorageError },
          });
        }
        return false;
      }

      if (!mountedRef.current || loginEpoch !== sessionEpochRef.current) {
        await clearSessionCredentials(loginGeneration);
        return false;
      }

      if (mountedRef.current && loginEpoch === sessionEpochRef.current) {
        dispatch({
          type: 'LOGIN_SUCCEEDED',
          payload: { user: response.user },
        });
      }
      return true;
    } catch (apiError) {
      if (mountedRef.current && loginEpoch === sessionEpochRef.current) {
        const mappedError = mapAuthError(apiError);
        dispatch({
          type: 'LOGIN_FAILED',
          payload: { error: mappedError },
        });
      }
      return false;
    } finally {
      loginInFlightRef.current = false;
    }
  };

  /**
   * Remote logout:
   * 1. Acquires synchronous lock
   * 2. Reads existing refreshToken
   * 3. Calls POST /auth/logout with skipAuthRefresh
   * 4. Regardless of network/server response, cleans memory & Keychain through coordinator
   * 5. Dispatches LOGOUT_COMPLETED
   */
  const logout = async (): Promise<void> => {
    if (logoutInFlightRef.current || state.operationState === 'signingOut') {
      return;
    }

    logoutInFlightRef.current = true;
    sessionEpochRef.current += 1;
    invalidateSessionCredentials();

    if (mountedRef.current) {
      dispatch({ type: 'LOGOUT_STARTED' });
    }

    try {
      const token = await secureStorage.getRefreshToken();
      if (token && hasActiveAccessToken()) {
        try {
          await authApi.logout({ refreshToken: token });
        } catch {
          // Remote failure does not prevent local session teardown
        }
      }
    } finally {
      await clearSessionCredentials();
      if (mountedRef.current) {
        dispatch({ type: 'LOGOUT_COMPLETED' });
      }
      logoutInFlightRef.current = false;
    }
  };

  /**
   * Remote logout all devices:
   * Calls POST /auth/logout-all then always tears down local session through coordinator
   */
  const logoutAll = async (): Promise<void> => {
    if (logoutInFlightRef.current || state.operationState === 'signingOut') {
      return;
    }

    logoutInFlightRef.current = true;
    sessionEpochRef.current += 1;
    invalidateSessionCredentials();

    if (mountedRef.current) {
      dispatch({ type: 'LOGOUT_STARTED' });
    }

    try {
      if (hasActiveAccessToken()) {
        try {
          await authApi.logoutAll();
        } catch {
          // Remote failure does not prevent local session teardown
        }
      }
    } finally {
      await clearSessionCredentials();
      if (mountedRef.current) {
        dispatch({ type: 'LOGOUT_COMPLETED' });
      }
      logoutInFlightRef.current = false;
    }
  };

  /**
   * Local logout only (legacy / offline fallback)
   */
  const logoutLocal = async (): Promise<void> => {
    if (logoutInFlightRef.current || state.operationState === 'signingOut') {
      return;
    }

    logoutInFlightRef.current = true;
    sessionEpochRef.current += 1;
    invalidateSessionCredentials();

    if (mountedRef.current) {
      dispatch({ type: 'LOGOUT_STARTED' });
    }

    try {
      await clearSessionCredentials();
    } finally {
      if (mountedRef.current) {
        dispatch({ type: 'LOGOUT_COMPLETED' });
      }
      logoutInFlightRef.current = false;
    }
  };

  const retryBootstrap = async (): Promise<void> => {
    await runBootstrap();
  };

  const clearAuthError = (): void => {
    if (mountedRef.current) {
      dispatch({ type: 'CLEAR_AUTH_ERROR' });
    }
  };

  const updateCurrentUser = useCallback((user: AuthUser): void => {
    if (mountedRef.current) {
      dispatch({ type: 'USER_PROFILE_UPDATED', payload: { user } });
    }
  }, []);

  const contextValue: AuthContextValue = {
    sessionState: state.sessionState,
    operationState: state.operationState,
    currentUser: state.currentUser,
    initialized: state.initialized,
    lastAuthError: state.lastAuthError,
    canRetryBootstrap: state.canRetryBootstrap,
    login,
    logout,
    logoutLocal,
    logoutAll,
    retryBootstrap,
    clearAuthError,
    updateCurrentUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
