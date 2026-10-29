/**
 * Canonical Corner Radius / Shape Scale for WorkSphere Mobile
 * Source: design/05_DESIGN_SYSTEM.md
 */

export const radii = {
  small: 4,
  medium: 8,
  large: 16,
  full: 9999,
} as const;

export type RadiiTokens = typeof radii;
export type RadiiKey = keyof typeof radii;
