import type { AuthAction, AuthState } from './authTypes';

export const initialAuthState: AuthState = {
  sessionState: 'INITIALIZING',
  operationState: 'idle',
  currentUser: null,
  initialized: false,
  lastAuthError: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INITIALIZATION_COMPLETED_UNAUTHENTICATED':
      return {
        ...state,
        sessionState: 'UNAUTHENTICATED',
        operationState: 'idle',
        currentUser: null,
        initialized: true,
        lastAuthError: null,
      };

    case 'BOOTSTRAP_STARTED':
      return {
        ...state,
        sessionState: 'INITIALIZING',
        operationState: 'authenticating',
        lastAuthError: null,
      };

    case 'BOOTSTRAP_SUCCEEDED':
      return {
        ...state,
        sessionState: 'AUTHENTICATED',
        operationState: 'idle',
        currentUser: action.payload.user,
        initialized: true,
        canRetryBootstrap: false,
        lastAuthError: null,
      };

    case 'BOOTSTRAP_RECOVERABLE_FAILED':
      return {
        ...state,
        sessionState: 'INITIALIZING',
        operationState: 'error',
        lastAuthError: action.payload.error,
        canRetryBootstrap: true,
        initialized: true,
      };

    case 'BOOTSTRAP_TERMINAL_FAILED':
      return {
        ...state,
        sessionState: 'UNAUTHENTICATED',
        operationState: 'idle',
        currentUser: null,
        initialized: true,
        canRetryBootstrap: false,
        lastAuthError: null,
      };



    case 'LOGIN_STARTED':
      return {
        ...state,
        operationState: 'authenticating',
        lastAuthError: null,
      };

    case 'LOGIN_SUCCEEDED':
      return {
        ...state,
        sessionState: 'AUTHENTICATED',
        operationState: 'idle',
        currentUser: action.payload.user,
        initialized: true,
        lastAuthError: null,
      };

    case 'LOGIN_FAILED':
      return {
        ...state,
        sessionState: 'UNAUTHENTICATED',
        operationState: 'error',
        currentUser: null,
        initialized: true,
        lastAuthError: action.payload.error,
      };

    case 'LOGOUT_STARTED':
      return {
        ...state,
        operationState: 'signingOut',
      };

    case 'LOGOUT_COMPLETED': {
      const nextState: AuthState = {
        ...state,
        sessionState: 'UNAUTHENTICATED',
        operationState: 'idle',
        currentUser: null,
        initialized: true,
        lastAuthError: null,
      };
      delete nextState.canRetryBootstrap;
      return nextState;
    }

    case 'CLEAR_AUTH_ERROR':
      return {
        ...state,
        lastAuthError: null,
        operationState: state.operationState === 'error' ? 'idle' : state.operationState,
      };

    case 'USER_PROFILE_UPDATED':
      return {
        ...state,
        currentUser: action.payload.user,
      };

    default:
      return state;
  }
}
