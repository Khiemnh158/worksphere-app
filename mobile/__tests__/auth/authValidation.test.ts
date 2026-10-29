import {
  normalizeEmail,
  normalizeFullName,
  normalizeLogin,
  normalizePhoneNumber,
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateResetPassword,
  validateUpdateProfile,
} from '../../src/features/auth/validation/authValidation';

describe('Auth Form Validators and Normalizers', () => {
  describe('Normalization Policies', () => {
    it('normalizeLogin trims surrounding whitespace', () => {
      expect(normalizeLogin('  admin_user  ')).toBe('admin_user');
      expect(normalizeLogin('user@domain.com ')).toBe('user@domain.com');
    });

    it('normalizeEmail trims whitespace and converts to lowercase', () => {
      expect(normalizeEmail('  User.Name@Domain.COM  ')).toBe('user.name@domain.com');
      expect(normalizeEmail('TEST@EXAMPLE.VN')).toBe('test@example.vn');
    });

    it('normalizeFullName trims surrounding whitespace', () => {
      expect(normalizeFullName('  Nguyen Van A  ')).toBe('Nguyen Van A');
    });

    it('normalizePhoneNumber trims or converts empty to null', () => {
      expect(normalizePhoneNumber('  0901234567  ')).toBe('0901234567');
      expect(normalizePhoneNumber('   ')).toBeNull();
      expect(normalizePhoneNumber('')).toBeNull();
      expect(normalizePhoneNumber(undefined)).toBeNull();
      expect(normalizePhoneNumber(null)).toBeNull();
    });
  });

  describe('validateLogin', () => {
    it('returns errors when fields are empty', () => {
      const errors = validateLogin({});
      expect(errors.login).toBe('Vui lòng nhập tên đăng nhập hoặc email');
      expect(errors.password).toBe('Vui lòng nhập mật khẩu');
    });

    it('returns error when login is only whitespace', () => {
      const errors = validateLogin({ login: '   ', password: 'validPassword123' });
      expect(errors.login).toBe('Vui lòng nhập tên đăng nhập hoặc email');
      expect(errors.password).toBeUndefined();
    });

    it('returns error when login exceeds 255 characters', () => {
      const longLogin = 'a'.repeat(256);
      const errors = validateLogin({ login: longLogin, password: 'validPassword123' });
      expect(errors.login).toBe('Tên đăng nhập hoặc email không được vượt quá 255 ký tự');
    });

    it('accepts login with exactly 255 characters', () => {
      const maxLogin = 'a'.repeat(255);
      const errors = validateLogin({ login: maxLogin, password: 'validPassword123' });
      expect(errors.login).toBeUndefined();
    });

    it('returns error when password is shorter than 8 characters', () => {
      const errors = validateLogin({ login: 'user1', password: '1234567' });
      expect(errors.password).toBe('Mật khẩu phải có từ 8 đến 128 ký tự');
    });

    it('returns error when password exceeds 128 characters', () => {
      const longPass = 'p'.repeat(129);
      const errors = validateLogin({ login: 'user1', password: longPass });
      expect(errors.password).toBe('Mật khẩu phải có từ 8 đến 128 ký tự');
    });

    it('accepts boundary passwords (8 and 128 characters)', () => {
      const pass8 = '12345678';
      const pass128 = 'p'.repeat(128);
      expect(validateLogin({ login: 'user1', password: pass8 }).password).toBeUndefined();
      expect(validateLogin({ login: 'user1', password: pass128 }).password).toBeUndefined();
    });

    it('preserves password spaces without trimming', () => {
      // 6 chars + 2 surrounding spaces = 8 chars
      const passWithSpaces = ' 123456 ';
      const errors = validateLogin({ login: 'user1', password: passWithSpaces });
      expect(errors.password).toBeUndefined();
    });
  });

  describe('validateForgotPassword', () => {
    it('returns error when email is empty or whitespace', () => {
      expect(validateForgotPassword({}).email).toBe('Vui lòng nhập email');
      expect(validateForgotPassword({ email: '   ' }).email).toBe('Vui lòng nhập email');
    });

    it('returns error for invalid email formats', () => {
      expect(validateForgotPassword({ email: 'invalid-email' }).email).toBe('Email không đúng định dạng');
      expect(validateForgotPassword({ email: 'user@' }).email).toBe('Email không đúng định dạng');
      expect(validateForgotPassword({ email: '@domain.com' }).email).toBe('Email không đúng định dạng');
      expect(validateForgotPassword({ email: 'user@domain' }).email).toBe('Email không đúng định dạng');
    });

    it('returns error when email exceeds 255 characters', () => {
      const longEmail = 'a'.repeat(245) + '@domain.com'; // > 255 chars
      expect(validateForgotPassword({ email: longEmail }).email).toBe('Email không được vượt quá 255 ký tự');
    });

    it('accepts a valid email address', () => {
      const errors = validateForgotPassword({ email: 'employee@worksphere.local' });
      expect(errors.email).toBeUndefined();
    });
  });

  describe('validateResetPassword', () => {
    it('returns errors for empty fields', () => {
      const errors = validateResetPassword({});
      expect(errors.resetToken).toBe('Mã xác thực không được để trống');
      expect(errors.newPassword).toBe('Vui lòng nhập mật khẩu mới');
      expect(errors.confirmPassword).toBe('Vui lòng xác nhận mật khẩu mới');
    });

    it('validates password length bounds on newPassword', () => {
      const shortErr = validateResetPassword({
        resetToken: 'token123',
        newPassword: 'short',
        confirmPassword: 'short',
      });
      expect(shortErr.newPassword).toBe('Mật khẩu phải có từ 8 đến 128 ký tự');

      const longErr = validateResetPassword({
        resetToken: 'token123',
        newPassword: 'x'.repeat(129),
        confirmPassword: 'x'.repeat(129),
      });
      expect(longErr.newPassword).toBe('Mật khẩu phải có từ 8 đến 128 ký tự');
    });

    it('returns error when confirmPassword does not match newPassword', () => {
      const errors = validateResetPassword({
        resetToken: 'token-secret-xyz',
        newPassword: 'newValidPassword123',
        confirmPassword: 'differentPassword123',
      });
      expect(errors.confirmPassword).toBe('Mật khẩu xác nhận không khớp');
    });

    it('does not leak or reflect token value into error messages', () => {
      const sensitiveToken = 'SECRET_TOKEN_VALUE_NEVER_REFLECT';
      const errors = validateResetPassword({
        resetToken: sensitiveToken,
        newPassword: 'short',
        confirmPassword: 'short',
      });
      const errorJson = JSON.stringify(errors);
      expect(errorJson).not.toContain(sensitiveToken);
    });

    it('accepts a fully valid payload', () => {
      const errors = validateResetPassword({
        resetToken: 'valid-reset-token-12345',
        newPassword: 'newValidPassword123',
        confirmPassword: 'newValidPassword123',
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('validateChangePassword', () => {
    it('returns errors for empty fields', () => {
      const errors = validateChangePassword({});
      expect(errors.currentPassword).toBe('Vui lòng nhập mật khẩu hiện tại');
      expect(errors.newPassword).toBe('Vui lòng nhập mật khẩu mới');
      expect(errors.confirmPassword).toBe('Vui lòng xác nhận mật khẩu mới');
    });

    it('rejects new password that is identical to current password', () => {
      const errors = validateChangePassword({
        currentPassword: 'currentPassword123',
        newPassword: 'currentPassword123',
        confirmPassword: 'currentPassword123',
      });
      expect(errors.newPassword).toBe('Mật khẩu mới không được trùng mật khẩu hiện tại');
    });

    it('rejects confirmation mismatch', () => {
      const errors = validateChangePassword({
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword123',
      });
      expect(errors.confirmPassword).toBe('Mật khẩu xác nhận không khớp');
    });

    it('accepts valid password change payload', () => {
      const errors = validateChangePassword({
        currentPassword: 'currentPassword123',
        newPassword: 'brandNewPassword456',
        confirmPassword: 'brandNewPassword456',
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('validateUpdateProfile', () => {
    it('requires fullName', () => {
      expect(validateUpdateProfile({}).fullName).toBe('Vui lòng nhập họ và tên');
      expect(validateUpdateProfile({ fullName: '   ' }).fullName).toBe('Vui lòng nhập họ và tên');
    });

    it('enforces fullName max 150 characters', () => {
      const longName = 'A'.repeat(151);
      expect(validateUpdateProfile({ fullName: longName }).fullName).toBe(
        'Họ và tên không được vượt quá 150 ký tự'
      );
      expect(validateUpdateProfile({ fullName: 'A'.repeat(150) }).fullName).toBeUndefined();
    });

    it('allows optional phoneNumber but enforces max 20 characters', () => {
      expect(validateUpdateProfile({ fullName: 'Nguyen Van A', phoneNumber: null }).phoneNumber).toBeUndefined();
      expect(validateUpdateProfile({ fullName: 'Nguyen Van A', phoneNumber: '' }).phoneNumber).toBeUndefined();
      expect(validateUpdateProfile({ fullName: 'Nguyen Van A', phoneNumber: '0901234567' }).phoneNumber).toBeUndefined();

      const longPhone = '1'.repeat(21);
      expect(validateUpdateProfile({ fullName: 'Nguyen Van A', phoneNumber: longPhone }).phoneNumber).toBe(
        'Số điện thoại không được vượt quá 20 ký tự'
      );
    });
  });
});
