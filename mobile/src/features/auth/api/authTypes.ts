/**
 * Phase 13A: Mobile Authentication DTOs and Runtime Guards
 * Factually aligned with backend Spring Boot Identity Module DTO contracts.
 * Canonical Source: backend/src/main/java/com/worksphere/identity/api/dto/**
 */

/**
 * Login Request DTO
 * Aligned with LoginRequest.java
 */
export interface LoginRequest {
  login: string;
  password: string;
  deviceName?: string;
  mfaCode?: string;
}

/**
 * Department Summary within Auth response
 * Aligned with AuthResponse.DepartmentInfo
 */
export interface AuthDepartment {
  id: string;
  name: string;
}

/**
 * Authenticated User Profile Summary within Auth response
 * Aligned with AuthResponse.UserInfo
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  department?: AuthDepartment | null;
  roles: string[];
  permissions: string[];
}

/**
 * Authentication Response DTO
 * Aligned with AuthResponse.java
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  user: AuthUser;
}

/**
 * Token Refresh Request DTO
 * Aligned with RefreshTokenRequest.java
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Token Refresh Response DTO
 * Aligned with RefreshResponse.java
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

/**
 * Logout Request DTO
 * Aligned with LogoutRequest.java
 */
export interface LogoutRequest {
  refreshToken: string;
}

/**
 * Forgot Password Request DTO
 * Aligned with ForgotPasswordRequest.java
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset Password Request DTO
 * Aligned with ResetPasswordRequest.java
 */
export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change Password Request DTO
 * Aligned with ChangePasswordRequest.java
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Update Profile Request DTO
 * Aligned with UpdateProfileRequest.java
 */
export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
  avatarFileId?: string | null;
}

/**
 * Department Detail within UserProfileResponse
 * Aligned with UserProfileResponse.DepartmentInfo
 */
export interface UserProfileDepartment {
  id: string;
  code?: string;
  name: string;
}

/**
 * Full User Profile Response DTO
 * Aligned with UserProfileResponse.java
 */
export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  status: string;
  department?: UserProfileDepartment | null;
  roles: string[];
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string | null;
}

// ============================================================================
// RUNTIME TYPE GUARDS
// ============================================================================

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function isPositiveFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val > 0;
}

function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every(item => typeof item === 'string');
}

/**
 * Structural runtime guard for AuthDepartment.
 */
export function isAuthDepartment(val: unknown): val is AuthDepartment {
  if (!val || typeof val !== 'object') {
    return false;
  }
  const obj = val as Record<string, unknown>;
  return typeof obj.id === 'string' && typeof obj.name === 'string';
}

/**
 * Structural runtime guard for AuthUser.
 * Rejects malformed user payloads without logging or reflecting sensitive data.
 */
export function isAuthUser(val: unknown): val is AuthUser {
  if (!val || typeof val !== 'object') {
    return false;
  }
  const obj = val as Record<string, unknown>;
  if (
    typeof obj.id !== 'string' ||
    typeof obj.username !== 'string' ||
    typeof obj.email !== 'string' ||
    typeof obj.fullName !== 'string' ||
    !isStringArray(obj.roles) ||
    !isStringArray(obj.permissions)
  ) {
    return false;
  }
  if (
    obj.department !== null &&
    obj.department !== undefined &&
    !isAuthDepartment(obj.department)
  ) {
    return false;
  }
  if (
    obj.avatarUrl !== null &&
    obj.avatarUrl !== undefined &&
    typeof obj.avatarUrl !== 'string'
  ) {
    return false;
  }
  return true;
}

/**
 * Structural runtime guard for AuthResponse.
 * Ensures access and refresh tokens are non-empty strings and expiry numbers are valid.
 */
export function isAuthResponse(val: unknown): val is AuthResponse {
  if (!val || typeof val !== 'object') {
    return false;
  }
  const obj = val as Record<string, unknown>;
  return (
    isNonEmptyString(obj.accessToken) &&
    isNonEmptyString(obj.refreshToken) &&
    typeof obj.tokenType === 'string' &&
    isPositiveFiniteNumber(obj.accessTokenExpiresIn) &&
    isPositiveFiniteNumber(obj.refreshTokenExpiresIn) &&
    isAuthUser(obj.user)
  );
}

/**
 * Structural runtime guard for RefreshResponse.
 */
export function isRefreshResponse(val: unknown): val is RefreshResponse {
  if (!val || typeof val !== 'object') {
    return false;
  }
  const obj = val as Record<string, unknown>;
  return (
    isNonEmptyString(obj.accessToken) &&
    isNonEmptyString(obj.refreshToken) &&
    typeof obj.tokenType === 'string' &&
    isPositiveFiniteNumber(obj.accessTokenExpiresIn) &&
    isPositiveFiniteNumber(obj.refreshTokenExpiresIn)
  );
}
