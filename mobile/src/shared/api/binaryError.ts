import { isApiResponse } from './apiEnvelope';

// Binary downloads can still fail with a JSON API envelope. Decode only bounded JSON errors,
// never successful files, so 401 refresh/version/permission errors retain their normal policy.
export function binaryErrorEnvelope(
  value: unknown,
  contentType: unknown,
): unknown {
  if (
    !(value instanceof ArrayBuffer) ||
    value.byteLength > 65536 ||
    typeof contentType !== 'string' ||
    !contentType.toLowerCase().includes('application/json')
  )
    return value;
  try {
    const escaped = Array.from(
      new Uint8Array(value),
      b => '%' + b.toString(16).padStart(2, '0'),
    ).join('');
    const parsed = JSON.parse(decodeURIComponent(escaped));
    return isApiResponse(parsed) ? parsed : value;
  } catch {
    return value;
  }
}
