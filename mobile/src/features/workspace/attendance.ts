import { getSessionCredentialGeneration } from '../../app/auth/sessionCredentialCoordinator';
import { workspaceApi, PunchAction } from './api';
import { parseAttendanceQr } from './rules';

// A camera result can arrive after logout/account switch. Bind it before opening the camera,
// then keep the same generation through the request interceptor and refresh retry.
export async function scanAndPunch(
  scanner: () => Promise<string | null>,
  type: PunchAction,
) {
  const generation = getSessionCredentialGeneration();
  const result = await scanner();
  if (!result) return null;
  if (generation !== getSessionCredentialGeneration()) {
    throw new Error('Phiên đã thay đổi. Hãy đăng nhập và quét lại.');
  }
  return workspaceApi.punch(parseAttendanceQr(result), type, generation);
}
