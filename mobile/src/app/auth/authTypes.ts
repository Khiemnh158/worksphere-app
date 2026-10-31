import type { AuthUser } from '../../features/auth/api/authTypes';
import type { AuthPresentationError } from '../../features/auth/errors/authErrorMapper';

export type { AuthUser };

export type SessionState = 'INITIALIZING' | 'UNAUTHENTICATED' | 'AUTHENTICATED';

export type AuthOperationState =
  | 'idle'
  | 'authenticating'
  | 'signingOut'
  | 'error';

export interface AuthState {
  sessionState: SessionState;
  operationState: AuthOperationState;
  currentUser: AuthUser | null;
  initialized: boolean;
  lastAuthError: AuthPresentationError | null;
  canRetryBootstrap?: boolean;
}

export type AuthAction =
  | { type: 'INITIALIZATION_COMPLETED_UNAUTHENTICATED' }
  | { type: 'BOOTSTRAP_STARTED' }
  | { type: 'BOOTSTRAP_SUCCEEDED'; payload: { user: AuthUser } }
  | {
      type: 'BOOTSTRAP_RECOVERABLE_FAILED';
      payload: { error: AuthPresentationError };
    }
  | { type: 'BOOTSTRAP_TERMINAL_FAILED' }
  | { type: 'LOGIN_STARTED' }
  | { type: 'LOGIN_SUCCEEDED'; payload: { user: AuthUser } }
  | { type: 'LOGIN_FAILED'; payload: { error: AuthPresentationError } }
  | { type: 'LOGOUT_STARTED' }
  | { type: 'LOGOUT_COMPLETED' }
  | { type: 'USER_PROFILE_UPDATED'; payload: { user: AuthUser } }
  | { type: 'CLEAR_AUTH_ERROR' };

export interface AuthContextValue {
  sessionState: SessionState;
  operationState: AuthOperationState;
  currentUser: AuthUser | null;
  initialized: boolean;
  lastAuthError: AuthPresentationError | null;
  canRetryBootstrap?: boolean;
  login: (
    loginInput: string,
    passwordInput: string,
    mfaCode?: string,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutLocal: () => Promise<void>;
  logoutAll?: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
  clearAuthError: () => void;
  updateCurrentUser?: (user: AuthUser) => void;
}
