/**
 * Phase 13A: Pure Authentication Form Validators and Normalization Policies
 * Pure functions with zero React or component dependencies.
 * Canonical Source: backend validation constraints on Identity DTOs.
 */

export type FieldErrors<TField extends string> = Partial<
  Record<TField, string>
>;

const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// NORMALIZATION POLICIES
// ============================================================================

/**
 * Normalizes user login input.
 * Strips surrounding whitespace.
 */
export function normalizeLogin(login: string): string {
  return login.trim();
}

/**
 * Normalizes email input.
 * Strips surrounding whitespace and converts to lowercase.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalizes full name input.
 * Strips surrounding whitespace.
 */
export function normalizeFullName(fullName: string): string {
  return fullName.trim();
}

/**
 * Normalizes phone number input.
 * Strips surrounding whitespace, returns null if empty string.
 */
export function normalizePhoneNumber(
  phoneNumber?: string | null,
): string | null {
  if (!phoneNumber) {
    return null;
  }
  const trimmed = phoneNumber.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// NOTE:
// Normalization of passwords (password.trim()) is STRICTLY FORBIDDEN.
// Surrounding or internal spaces are valid character positions in passwords.
// Normalization of resetToken must never log or reflect the token string.

// ============================================================================
// PURE FORM VALIDATORS
// ============================================================================

export interface LoginFormData {
  login?: string;
  password?: string;
}

/**
 * Validates Login form data.
 * - login: required after trim, max 255 chars
 * - password: required, 8-128 chars (never trimmed)
 */
export function validateLogin(
  data: LoginFormData,
): FieldErrors<'login' | 'password'> {
  const errors: FieldErrors<'login' | 'password'> = {};

  const loginTrimmed = data.login ? data.login.trim() : '';
  if (!loginTrimmed) {
    errors.login = 'Vui lòng nhập tên đăng nhập hoặc email';
  } else if (loginTrimmed.length > 255) {
    errors.login = 'Tên đăng nhập hoặc email không được vượt quá 255 ký tự';
  }

  const password = data.password ?? '';
  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu';
  } else if (password.length < 8 || password.length > 128) {
    errors.password = 'Mật khẩu phải có từ 8 đến 128 ký tự';
  }

  return errors;
}

export interface ForgotPasswordFormData {
  email?: string;
}

/**
 * Validates Forgot Password form data.
 * - email: required after trim, basic email format, max 255 chars
 * - Does NOT perform user enumeration checks.
 */
export function validateForgotPassword(
  data: ForgotPasswordFormData,
): FieldErrors<'email'> {
  const errors: FieldErrors<'email'> = {};

  const emailTrimmed = data.email ? data.email.trim() : '';
  if (!emailTrimmed) {
    errors.email = 'Vui lòng nhập email';
  } else if (!BASIC_EMAIL_REGEX.test(emailTrimmed)) {
    errors.email = 'Email không đúng định dạng';
  } else if (emailTrimmed.length > 255) {
    errors.email = 'Email không được vượt quá 255 ký tự';
  }

  return errors;
}

function utf8Bytes(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const point = char.codePointAt(0) ?? 0;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export interface ResetPasswordFormData {
  resetToken?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * Validates Reset Password form data.
 * - resetToken: required (token itself is never logged or included in error strings)
 * - newPassword: required, at least 12 characters and at most 72 UTF-8 bytes
 * - confirmPassword: required, must match newPassword
 */
export function validateResetPassword(
  data: ResetPasswordFormData,
): FieldErrors<'resetToken' | 'newPassword' | 'confirmPassword'> {
  const errors: FieldErrors<'resetToken' | 'newPassword' | 'confirmPassword'> =
    {};

  const tokenTrimmed = data.resetToken ? data.resetToken.trim() : '';
  if (!tokenTrimmed) {
    errors.resetToken = 'Mã xác thực không được để trống';
  }

  const newPassword = data.newPassword ?? '';
  if (!newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới';
  } else if (newPassword.length < 12 || utf8Bytes(newPassword) > 72) {
    errors.newPassword =
      'Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte UTF-8';
  }

  const confirmPassword = data.confirmPassword ?? '';
  if (!confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }

  return errors;
}

export interface ChangePasswordFormData {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * Validates Change Password form data.
 * - currentPassword: required
 * - newPassword: required, at least 12 characters and at most 72 UTF-8 bytes, must differ from currentPassword
 * - confirmPassword: required, must match newPassword
 */
export function validateChangePassword(
  data: ChangePasswordFormData,
): FieldErrors<'currentPassword' | 'newPassword' | 'confirmPassword'> {
  const errors: FieldErrors<
    'currentPassword' | 'newPassword' | 'confirmPassword'
  > = {};

  const currentPassword = data.currentPassword ?? '';
  if (!currentPassword) {
    errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
  }

  const newPassword = data.newPassword ?? '';
  if (!newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới';
  } else if (newPassword.length < 12 || utf8Bytes(newPassword) > 72) {
    errors.newPassword =
      'Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte UTF-8';
  } else if (currentPassword && newPassword === currentPassword) {
    errors.newPassword = 'Mật khẩu mới không được trùng mật khẩu hiện tại';
  }

  const confirmPassword = data.confirmPassword ?? '';
  if (!confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }

  return errors;
}

export interface UpdateProfileFormData {
  fullName?: string;
  phoneNumber?: string | null;
}

/**
 * Validates Update Profile form data.
 * - fullName: required after trim, max 150 chars
 * - phoneNumber: optional, max 20 chars if provided
 */
export function validateUpdateProfile(
  data: UpdateProfileFormData,
): FieldErrors<'fullName' | 'phoneNumber'> {
  const errors: FieldErrors<'fullName' | 'phoneNumber'> = {};

  const fullNameTrimmed = data.fullName ? data.fullName.trim() : '';
  if (!fullNameTrimmed) {
    errors.fullName = 'Vui lòng nhập họ và tên';
  } else if (fullNameTrimmed.length > 150) {
    errors.fullName = 'Họ và tên không được vượt quá 150 ký tự';
  }

  if (data.phoneNumber) {
    const phoneTrimmed = data.phoneNumber.trim();
    if (phoneTrimmed.length > 20) {
      errors.phoneNumber = 'Số điện thoại không được vượt quá 20 ký tự';
    }
  }

  return errors;
}
