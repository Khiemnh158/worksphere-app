/**
 * Canonical Color Tokens for WorkSphere Mobile
 * Source: design/05_DESIGN_SYSTEM.md
 */

export const colors = {
  primary: '#1E3A8A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#DBEAFE',
  onPrimaryContainer: '#1E40AF',
  secondary: '#0D9488',
  onSecondary: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#CBD5E1',
  borderFocus: '#2563EB',
  error: '#DC2626',
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  warning: '#D97706',
  warningContainer: '#FEF3C7',
  success: '#16A34A',
  successContainer: '#DCFCE7',
  info: '#0284C7',
  infoContainer: '#E0F2FE',
  disabled: '#94A3B8',
  disabledContainer: '#E2E8F0',
} as const;

export type ColorTokens = { [K in keyof typeof colors]: string };
export type ColorKey = keyof typeof colors;
