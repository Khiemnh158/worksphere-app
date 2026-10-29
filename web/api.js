let accessToken;
let refreshToken = sessionStorage.getItem("worksphere.refresh");
let refreshing;
let generation = 0;
function sameSession(expected) {
  if (expected !== generation)
    throw new Error(
      "Phiên làm việc đã thay đổi. Thao tác cũ không được gửi lại."
    );
}
export function clearSession() {
  generation++;
  accessToken = refreshToken = null;
  sessionStorage.removeItem("worksphere.refresh");
}
function remember(data) {
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  sessionStorage.setItem("worksphere.refresh", refreshToken);
}
async function rotate() {
  if (!refreshToken) throw new Error("Vui lòng đăng nhập.");
  if (!refreshing)
    refreshing = (async () => {
      const expected = generation;
      const r = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const d = await r.json();
      sameSession(expected);
      if (!r.ok) {
        if (r.status === 401 || r.status === 403) {
          clearSession();
          throw new Error("Phiên đã kết thúc. Vui lòng đăng nhập lại.");
        }
        throw new Error(
          d.message || "Máy chủ chưa sẵn sàng. Vui lòng thử lại."
        );
      }
      remember(d.data);
    })().finally(() => (refreshing = null));
  return refreshing;
}
export async function api(path, { method = "GET", body, retry = true } = {}) {
  const expected = generation;
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const r = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
        ? body
        : JSON.stringify(body),
  });
  sameSession(expected);
  if (r.status === 401 && retry && path != "/auth/login" && refreshToken) {
    try {
      await rotate();
    } catch (e) {
      if (!refreshToken) window.dispatchEvent(new Event("session-ended"));
      throw e;
    }
    sameSession(expected);
    return api(path, { method, body, retry: false });
  }
  if (r.status === 204) return null;
  const d = await r
    .json()
    .catch(() => ({ message: "Không đọc được phản hồi từ máy chủ." }));
  sameSession(expected);
  if (!r.ok || d.success === false) {
    const e = new Error(d.message || "Không thể thực hiện thao tác.");
    e.status = r.status;
    e.code = d.code;
    if (r.status === 401 && path != "/auth/login") {
      clearSession();
      window.dispatchEvent(new Event("session-ended"));
    }
    throw e;
  }
  return d.data;
}
export async function login(login, password) {
  clearSession();
  const d = await api("/auth/login", {
    method: "POST",
    body: { login, password, deviceName: "WorkSphere Web" },
  });
  remember(d);
  return d;
}
export async function restore() {
  if (!refreshToken) return false;
  try {
    await rotate();
    return true;
  } catch {
    return false;
  }
}
export async function logout() {
  const expected = generation;
  try {
    await api("/auth/logout", { method: "POST", body: { refreshToken } });
  } finally {
    if (expected === generation) clearSession();
  }
}
export async function download(url) {
  const expected = generation;
  let r = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  sameSession(expected);
  if (r.status === 401) {
    await rotate();
    sameSession(expected);
    r = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
  if (!r.ok) throw new Error("Không có quyền tải tệp.");
  const blob = await r.blob();
  sameSession(expected);
  return blob;
}
