export function recoveryToken(
  value: string,
  purpose: 'activate' | 'reset',
): string {
  const input = value.trim();
  const marker = `#${purpose}/`;
  if (input.includes(marker))
    return input.slice(input.indexOf(marker) + marker.length).split(/[?&]/)[0];
  return input;
}
