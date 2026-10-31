import { createPeopleUI } from "./people.js";
import { api, login, logout, restore, clearSession, download } from "./api.js";
const $ = (s) => document.querySelector(s),
  app = $("#app"),
  dialog = $("#dialog");
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
const paths = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  work: "M8 4h8v4H8z M8 6H5v15h14V6h-3 M8 12h8 M8 16h5",
  calendar: "M4 5h16v16H4z M7 3v4 M17 3v4 M4 10h16 M8 14h1 M15 14h1 M8 18h1",
  request: "M4 4h16v13H9l-5 4z M8 8h8 M8 12h5",
  queue: "M3 6h18 M3 12h18 M3 18h11 M18 16l3 3-3 3",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-4 M16 3a4 4 0 0 1 0 8",
  building:
    "M4 21V5l8-3 8 3v16 M2 21h20 M8 7h1 M15 7h1 M8 11h1 M15 11h1 M10 21v-6h4v6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  plus: "M12 5v14 M5 12h14",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  back: "M19 12H5 M11 6l-6 6 6 6",
  check: "M5 12l4 4L19 6",
  close: "M6 6l12 12 M18 6 6 18",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6",
  logout: "M9 4H4v16h5 M10 12h11 M16 7l5 5-5 5",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2",
  shield: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z M8 12l3 3 5-6",
  file: "M5 2h9l5 5v15H5z M14 2v6h5 M8 12h8 M8 16h6",
  refresh: "M20 8a8 8 0 1 0 0 8 M20 3v5h-5",
  settings: "M4 7h16 M4 17h16 M8 4v6 M16 14v6",
  money: "M3 5h18v14H3z M12 8a3 3 0 1 0 0 8 3 3 0 0 0 0-8",
  handover: "M3 8h15 M14 4l4 4-4 4 M21 16H6 M10 12l-4 4 4 4",
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${
    paths[n] || paths.file
  }"/></svg>`;
const labels = {
  BLOCKED: "Đang vướng",
  BLOCK: "Báo vướng mắc",
  REQUEST_CANCEL: "Đề nghị hủy",
  APPROVE_CANCEL: "Đồng ý hủy",
  DENY_CANCEL: "Không chấp nhận hủy",
  REVIEW_HANDOVER: "Rà soát bàn giao",
  EDIT: "Sửa công việc",
  APPROVED: "Đã duyệt",
  CONFIRMED: "Đã xác nhận thực tế",
  DRAFT: "Tạm tính",
  LEAVE_PAID: "Nghỉ hưởng lương",
  LEAVE_UNPAID: "Nghỉ không lương",
  OVERTIME: "Tăng ca",
  TIME_CORRECTION: "Bổ sung công",
  ASSIGNED: "Đã giao",
  IN_PROGRESS: "Đang thực hiện",
  REVIEW: "Chờ nghiệm thu",
  COMPLETED: "Hoàn tất",
  HANDOVER: "Cần bàn giao",
  OPEN: "Chờ tiếp nhận",
  WAITING_FOR_USER: "Chờ bổ sung",
  RESOLVED: "Chờ xác nhận",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã hủy",
  REJECTED: "Từ chối tiếp nhận",
  LOW: "Thấp",
  MEDIUM: "Bình thường",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
  CRITICAL: "Khẩn cấp",
  ACTIVE: "Hoạt động",
  LOCKED: "Đang khóa",
  DISABLED: "Ngừng truy cập",
  PENDING: "Chưa kích hoạt",
  START: "Nhận và bắt đầu",
  PROGRESS: "Cập nhật tiến độ",
  SUBMIT: "Gửi nghiệm thu",
  APPROVE: "Xác nhận hoàn tất",
  RETURN: "Yêu cầu làm lại",
  HANDOVER_ACTION: "Chuyển bàn giao",
  DISPATCH_INFO: "Yêu cầu bổ sung",
  DISPATCH_RESUME: "Tiếp nhận lại",
  TRANSFER: "Chuyển phòng",
  DECLINE: "Từ chối tiếp nhận",
  ACCEPT_HANDOVER: "Rà soát và tiếp nhận",
  COMMENT: "Trao đổi",
  ASSIGN: "Phân công",
  WAIT_FOR_USER: "Yêu cầu bổ sung",
  RESOLVE: "Gửi kết quả xử lý",
  RESUME: "Tiếp tục xử lý",
  CONFIRM: "Xác nhận kết quả",
  CANCEL: "Hủy yêu cầu",
  REJECT_RESOLUTION: "Yêu cầu xử lý lại",
  CREATED: "Tạo công việc",
  OFFBOARDING: "Chuyển vào danh sách bàn giao",
};
const workLabels = {
  ...labels,
  RESUME: "Tiếp tục thực hiện",
  CANCEL: "Hủy công việc",
};
const pill = (code, custom) =>
  `<span class="pill ${
    ["COMPLETED", "CLOSED", "ACTIVE"].includes(code)
      ? "lime"
      : [
          "HIGH",
          "URGENT",
          "CRITICAL",
          "LOCKED",
          "DISABLED",
          "REJECTED",
        ].includes(code)
      ? "red"
      : ["HANDOVER", "REVIEW", "RESOLVED"].includes(code)
      ? "purple"
      : "blue"
  }">${esc(custom || labels[code] || code)}</span>`;
const fmt = (date, time = false) =>
  date
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        ...(time
          ? { hour: "2-digit", minute: "2-digit" }
          : { year: "numeric" }),
      }).format(new Date(date))
    : "—";
const initials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
const avatar = (name, cls = "") =>
  `<span class="avatar ${cls}">${esc(initials(name))}</span>`;
const btn = (action, text, cls = "", id = "") =>
  `<button class="btn ${cls}" data-action="${action}" ${
    action === "week-prev"
      ? 'aria-label="Tuần trước"'
      : action === "week-next"
      ? 'aria-label="Tuần sau"'
      : ""
  }${id ? ` data-id="${esc(id)}"` : ""}>${text}</button>`;
const empty = (text) => `<div class="empty">${icon("work")}${esc(text)}</div>`;
const brand = `<button type="button" class="brand" data-action="sidebar" aria-label="Mở hoặc thu gọn điều hướng"><span class="brand-mark">w·</span><span class="brand-text">worksphere<small>KHÔNG GIAN NỘI BỘ</small></span></button>`;
let periodValue = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
}).format(new Date());
let C,
  works = [],
  notices = [],
  current,
  view = "home",
  filter = "all",
  search = "",
  page = 0,
  weekOffset = 0,
  routeSerial = 0,
  toastTimer;
let collapsed = localStorage.getItem("worksphere.sidebar") === "collapsed";
let theme = localStorage.getItem("worksphere.theme") || "dark";
let authEpoch = 0;
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('[data-action="theme"]').forEach((b) => {
    b.innerHTML = icon(theme === "dark" ? "sun" : "moon");
    b.setAttribute(
      "aria-label",
      theme === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"
    );
  });
}
function toast(text, error = false) {
  const el = $("#toast");
  el.textContent = text;
  el.className = `show${error ? " error" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "";
    el.textContent = "";
  }, 4000);
}
function themeButton() {
  return `<button class="icon-btn" data-action="theme" aria-label="Đổi giao diện">${icon(
    theme === "dark" ? "sun" : "moon"
  )}</button>`;
}
function loginView(message = "") {
  authEpoch++;
  routeSerial++;
  C = null;
  peopleUI.reset();
  current = null;
  works = [];
  notices = [];
  clearTimeout(toastTimer);
  $("#toast").className = "";
  $("#toast").textContent = "";
  dialog.close();
  dialog.innerHTML = "";
  document.body.className = "";
  app.innerHTML = `<div class="login"><section class="login-story">${brand}<div><span class="eyebrow">AN PHÁT · KHÔNG GIAN LÀM VIỆC</span><h1>Công việc rõ ràng.<br><em>Phối hợp nhịp nhàng.</em></h1><p>Một nơi để tiếp nhận yêu cầu, cùng xử lý công việc và tiếp nối những điều đang làm.</p><div class="flow-preview"><div class="row between"><span class="pill purple">Cùng một tiến độ</span>${icon(
    "handover"
  )}</div><h3 style="margin-top:18px">Bàn giao để tiếp tục.</h3><p style="font-size:12px;margin-top:7px">Giữ lịch sử. Rà soát phần đã làm. Rõ người phụ trách.</p><div class="progress"><span style="width:65%"></span></div><footer><span>Tiếp nối công việc</span><span>Rõ trách nhiệm ${icon(
    "check"
  )}</span></footer></div></div><small>KẾT NỐI CON NGƯỜI · TIẾP NỐI CÔNG VIỆC</small></section><section class="login-main">${themeButton()}<div class="login-form"><span class="eyebrow">CHÀO MỪNG BẠN TRỞ LẠI</span><h2>Đăng nhập</h2><p>Vào không gian làm việc bằng tài khoản do doanh nghiệp cấp.</p><form id="login-form"><label class="field">Tên đăng nhập hoặc email<input name="login" autocomplete="username" required maxlength="255" placeholder="Nhập tài khoản của bạn"></label><label class="field">Mật khẩu<input name="password" type="password" autocomplete="current-password" required maxlength="128" placeholder="Nhập mật khẩu"></label><label class="field">Mã xác thực hai bước (nếu đã bật)<input name="mfaCode" autocomplete="one-time-code" maxlength="64" placeholder="Mã ứng dụng xác thực hoặc mã dự phòng"></label><div class="form-error" role="alert">${esc(
    message
  )}</div><button class="btn primary" type="submit">Đăng nhập ${icon(
    "arrow"
  )}</button></form><p class="login-foot"><a href="#forgot">Quên mật khẩu?</a><br>Tài khoản mới: mở liên kết kích hoạt trong email.</p></div></section></div>`;
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget,
      b = f.querySelector("button");
    b.disabled = true;
    f.querySelector(".form-error").textContent = "";
    try {
      await login(
        f.login.value.trim(),
        f.password.value,
        f.mfaCode.value.trim()
      );
      f.password.value = "";
      if (!(await loadContext())) return;
      if (location.hash !== "#home") location.hash = "home";
      else await route();
    } catch (err) {
      f.querySelector(".form-error").textContent = err.message;
    } finally {
      b.disabled = false;
    }
  });
  applyTheme();
}
async function loadContext() {
  const expected = authEpoch;
  const result = await Promise.all([
    api("/workplace/context"),
    api("/workplace/work"),
    api("/workplace/notices"),
  ]);
  if (expected !== authEpoch) return false;
  [C, works, notices] = result;
  return true;
}
function navItem(key, label, ico) {
  return `<a class="nav ${
    view === key ? "active" : ""
  }" href="#${key}" title="${label}"${
    view === key ? ' aria-current="page"' : ""
  }>${icon(ico)}<span class="nav-text">${label}</span></a>`;
}
let navigationScroll = 0;
function shell() {
  navigationScroll =
    document.querySelector(".sidebar-scroll")?.scrollTop ?? navigationScroll;
  const managed = C.managedDepartments.length > 0;
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  const title =
    {
      home: "Tổng quan",
      work: "Công việc",
      calendar: "Lịch công việc",
      requests: "Yêu cầu của tôi",
      assigned: "Yêu cầu tôi xử lý",
      queue: "Hàng đợi của phòng",
      handover: "Bàn giao công việc",
      departments: "Phòng ban",
      accounts: "Tài khoản & quyền",
      categories: "Loại yêu cầu",
      audit: "Nhật ký quản trị",
      notifications: "Thông báo",
      profile: "Hồ sơ cá nhân",
      stations: "Điểm chấm công QR",
      people: "Phòng ban của tôi",
      personnel: "Hồ sơ nhân sự",
      access: "Yêu cầu quản trị",
      delegations: "Phụ trách thay",
      approvals: "Việc cần phê duyệt",
      security: "Bảo mật",
      import: "Nhập tài khoản",
      hr: "Hồ sơ ngừng làm việc",
      time: "Công & tăng ca",
      salary: "Thu nhập của tôi",
      payroll: "Đối soát thu nhập",
    }[view] || "Chi tiết";
  app.innerHTML = `<button class="mobile-cover" data-action="sidebar" aria-label="Đóng điều hướng"></button><aside class="sidebar">${brand}<div class="company">${avatar(
    "An Phát",
    "lime"
  )}<span><strong>An Phát</strong><small>Thương mại & dịch vụ</small></span></div><div class="sidebar-scroll" tabindex="0" aria-label="Điều hướng chức năng">${navigation()}</div><div class="sidebar-bottom"><div class="row">${avatar(
    C.user.full_name
  )}<div class="user-copy"><div class="person-name">${esc(
    C.user.full_name
  )}</div><small class="muted">${esc(
    C.admin
      ? "Quản trị hệ thống"
      : C.executive
      ? "Ban lãnh đạo"
      : C.departments.some((d) => d.manager_id === C.user.id)
      ? "Trưởng phòng"
      : managed
      ? "Phụ trách thay"
      : C.user.department_name || "Chưa gán phòng"
  )}</small></div><button class="icon-btn" data-action="logout" aria-label="Đăng xuất" title="Đăng xuất">${icon(
    "logout"
  )}</button></div><p class="side-copy">Một nơi làm việc. Cùng một tiến độ.</p></div></aside><div class="shell"><header class="topbar"><div class="row"><button class="icon-btn" data-action="sidebar" aria-label="Thu gọn hoặc mở điều hướng" aria-expanded="${
    matchMedia("(max-width:760px)").matches
      ? document.body.classList.contains("mobile-open")
      : !collapsed
  }">${icon(
    "menu"
  )}</button><div class="breadcrumb">Không gian nội bộ <span>/ ${esc(
    title
  )}</span></div></div><div class="top-actions"><span class="date-chip">${fmt(
    new Date()
  )}</span>${themeButton()}<a class="icon-btn" href="#notifications" aria-label="Thông báo">${icon(
    "bell"
  )}${
    notices.some((n) => !n.read_at) ? '<span class="badge-dot"></span>' : ""
  }</a><a href="#profile" aria-label="Hồ sơ cá nhân">${avatar(
    C.user.full_name,
    "lime"
  )}</a></div></header><main id="main" class="main" tabindex="-1"><div class="view-loading"><span class="spinner"></span>Đang tải dữ liệu…</div></main></div>`;
  const navigationNode = document.querySelector(".sidebar-scroll");
  if (navigationNode) navigationNode.scrollTop = navigationScroll;
  syncNavigationState();
  applyTheme();
}
function syncNavigationState() {
  const aside = document.querySelector(".sidebar");
  if (!aside) return;
  const narrow = matchMedia("(max-width:760px)").matches,
    opened = narrow
      ? document.body.classList.contains("mobile-open")
      : !collapsed;
  aside.inert = narrow && !opened;
  document
    .querySelectorAll('[data-action="sidebar"]:not(.mobile-cover)')
    .forEach((b) => b.setAttribute("aria-expanded", String(opened)));
}
window.addEventListener("resize", syncNavigationState);
function navigation() {
  const group = (label, items) =>
    `<p class="nav-label">${label}</p><nav class="nav-group">${items
      .filter(Boolean)
      .map(([v, t, i]) => navItem(v, t, i))
      .join("")}</nav>`;
  if (C.admin)
    return group("QUẢN TRỊ HỆ THỐNG", [
      ["home", "Tổng quan", "home"],
      ["accounts", "Tài khoản & quyền", "shield"],
      ["import", "Nhập tài khoản", "people"],
      ["departments", "Phòng ban & chức vụ", "building"],
      ["access", "Yêu cầu quản trị", "queue"],
      ["categories", "Danh mục tiếp nhận", "settings"],
      ["audit", "Nhật ký quản trị", "file"],
      ["security", "Bảo mật", "shield"],
    ]);
  const management = C.managedDepartments.length > 0;
  return (
    group("KHÔNG GIAN LÀM VIỆC", [
      ["home", "Tổng quan", "home"],
      [
        "work",
        management ? "Công việc phụ trách" : "Công việc của tôi",
        "work",
      ],
      ["calendar", "Lịch công việc", "calendar"],
      ["requests", "Yêu cầu hỗ trợ đã gửi", "request"],
      C.assignedSupport > 0 && ["assigned", "Hỗ trợ được giao", "settings"],
      ["people", "Phòng ban của tôi", "people"],
      ["time", "Công, nghỉ & tăng ca", "clock"],
      [
        "personnel",
        C.capabilities.includes("HR_MANAGE") || C.executive
          ? "Hồ sơ nhân sự"
          : "Đề nghị nhân sự",
        "people",
      ],
      ["access", "Đề nghị truy cập", "shield"],
      ["security", "Bảo mật", "shield"],
    ]) +
    (management
      ? group("ĐIỀU PHỐI & PHÊ DUYỆT", [
          C.supportDepartments.length > 0 && [
            "queue",
            "Hàng đợi hỗ trợ",
            "queue",
          ],
          ["handover", "Bàn giao công việc", "handover"],
          ["delegations", "Phụ trách thay", "people"],
          C.executive && ["approvals", "Việc cần phê duyệt", "check"],
        ])
      : "") +
    (C.capabilities.includes("TIME_REVIEW")
      ? group("ĐIỂM CHẤM CÔNG", [["stations", "Điểm chấm công QR", "clock"]])
      : "") +
    (C.capabilities.includes("PAYROLL_MANAGE") ||
    C.capabilities.includes("PAYROLL_APPROVE")
      ? group("NGHIỆP VỤ CHUYÊN TRÁCH", [
          ["payroll", "Bảng tính lương", "money"],
        ])
      : "")
  );
}

function heading(title, description = "", action = "") {
  return `<div class="page-head"><div><p class="eyebrow" style="margin:0 0 8px">${esc(
    C.user.department_name || "AN PHÁT"
  )}</p><h1>${esc(title)}</h1>${
    description ? `<p>${esc(description)}</p>` : ""
  }</div>${action}</div>`;
}
function workCard(w) {
  const overdue =
    new Date(w.due_at) < new Date() &&
    !["COMPLETED", "CANCELLED"].includes(w.status);
  return `<a class="work-card" href="#work/${
    w.id
  }"><div class="row between">${pill(w.priority)}${icon(
    w.status === "HANDOVER" ? "handover" : "arrow"
  )}</div><h3>${esc(w.title)}</h3><p>${esc(
    w.description
  )}</p><div class="progress"><span style="width:${Number(
    w.progress
  )}%"></span></div><div class="row between"><small class="muted">${esc(
    labels[w.status]
  )}</small><small>${Number(
    w.progress
  )}%</small></div><div class="row card-footer"><span class="row">${avatar(
    w.assignee_name || "Chờ nhận"
  )}<span>${esc(
    w.assignee_name || "Chờ người nhận"
  )}</span></span><span class="${overdue ? "overdue" : "muted"}">${icon(
    "calendar"
  )} ${fmt(w.due_at)}</span></div></a>`;
}
function metric(label, value, ico, accent = false) {
  return `<div class="metric${
    accent ? " accent" : ""
  }"><div class="row between"><small>${label}</small>${icon(
    ico
  )}</div><strong>${value}</strong><small>${
    label === "Cần xử lý" ? "Công việc chưa hoàn tất" : "Trong phạm vi của bạn"
  }</small></div>`;
}
function home() {
  if (C.admin) return adminHome();
  const open = works.filter(
      (w) => !["COMPLETED", "CANCELLED"].includes(w.status)
    ),
    handover = works.filter((w) => w.status === "HANDOVER"),
    review = works.filter((w) => w.status === "REVIEW"),
    overdue = open.filter((w) => new Date(w.due_at) < new Date());
  const manager = C.managedDepartments.length > 0;
  return (
    heading(
      `Chào ${C.user.full_name.split(" · ")[0]},`,
      manager
        ? "Nắm tiến độ của phòng, phân công rõ ràng và tiếp nối công việc."
        : "Sắp xếp một ngày làm việc rõ ràng, từng việc một.",
      btn("new-request", icon("plus") + " Gửi yêu cầu", "primary")
    ) +
    `<section class="hero"><div><span class="eyebrow">${
      manager ? "KHÔNG GIAN ĐIỀU PHỐI" : "KHÔNG GIAN CỦA BẠN"
    }</span><h2>${
      manager
        ? "Đúng người.<br>Đúng việc. Đúng tiến độ."
        : "Một ngày tập trung.<br>Mọi việc trong tầm tay."
    }</h2><p>${
      manager
        ? "Hàng đợi, công việc và bàn giao được kết nối trong cùng một không gian."
        : "Xem việc được giao, trao đổi khi vướng và ghi nhận kết quả khi sẵn sàng."
    }</p><div style="margin-top:20px"><a class="btn small" href="#${
      manager ? "queue" : "work"
    }">${manager ? "Mở hàng đợi" : "Xem công việc"} ${icon(
      "arrow"
    )}</a></div></div><div class="hero-art" aria-hidden="true"><div class="art-bar"><span>01</span></div><div class="art-bar"><span>02</span></div><div class="art-bar"><span>↗</span></div></div></section><div class="metrics">${metric(
      "Cần xử lý",
      open.length,
      "work",
      true
    )}${metric("Chờ nghiệm thu", review.length, "check")}${metric(
      "Cần bàn giao",
      handover.length,
      "handover"
    )}${metric(
      "Quá hạn",
      overdue.length,
      "clock"
    )}</div><div class="columns"><section><div class="section-head"><h2>${
      manager ? "Tiến độ của phòng" : "Công việc gần nhất"
    }</h2><a class="link muted" href="#work">Xem tất cả ↗</a></div><div class="cards">${
      open.slice(0, 4).map(workCard).join("") ||
      empty("Chưa có công việc đang mở.")
    }</div></section><aside><section class="panel"><div class="section-head"><h3>Nhịp làm việc</h3>${icon(
      "calendar"
    )}</div>${
      open
        .slice(0, 3)
        .map(
          (w) =>
            `<div class="list-row">${icon(
              "clock"
            )}<div><a class="link" href="#work/${w.id}">${esc(
              w.title
            )}</a><p>${fmt(w.due_at, true)}</p></div></div>`
        )
        .join("") || '<p class="muted">Chưa có hạn công việc.</p>'
    }</section><section class="panel"><div class="section-head"><h3>Thông báo gần đây</h3><a href="#notifications" aria-label="Xem thông báo">${icon(
      "arrow"
    )}</a></div>${
      notices
        .slice(0, 3)
        .map(
          (n) =>
            `<div class="list-row"><span class="pill ${
              n.read_at ? "" : "lime"
            }">${
              n.read_at ? "Đã đọc" : "Mới"
            }</span><div><button class="link" data-action="notice" data-id="${
              n.id
            }">${esc(n.title)}</button><p>${fmt(
              n.created_at,
              true
            )}</p></div></div>`
        )
        .join("") || '<p class="muted">Bạn chưa có thông báo.</p>'
    }</section></aside></div>`
  );
}
function workList(handover = false) {
  let list = works;
  if (handover) list = list.filter((w) => w.status === "HANDOVER");
  else if (filter === "mine")
    list = list.filter((w) => w.assignee_id === C.user.id);
  else if (filter !== "all") list = list.filter((w) => w.status === filter);
  list = list.filter((w) =>
    (w.title + " " + w.description + " " + (w.assignee_name || ""))
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    heading(
      handover ? "Bàn giao để tiếp tục" : "Công việc",
      handover
        ? "Giữ tiến độ và lịch sử. Người nhận rà soát trước khi tiếp tục thực hiện."
        : "Cập nhật thực tế, gửi kết quả và kiểm tra trước khi hoàn tất.",
      C.managedDepartments.length
        ? btn("new-work", icon("plus") + " Giao công việc", "primary")
        : ""
    ) +
    `<div class="filters">${(handover
      ? []
      : [
          ["all", "Tất cả"],
          ["mine", "Tôi phụ trách"],
          ["IN_PROGRESS", "Đang thực hiện"],
          ["REVIEW", "Chờ nghiệm thu"],
          ["COMPLETED", "Hoàn tất"],
        ]
    )
      .map(
        ([f, l]) =>
          `<button class="filter ${
            filter === f ? "active" : ""
          }" data-action="work-filter" data-id="${f}">${l}</button>`
      )
      .join("")}<label class="search">${icon(
      "search"
    )}<input id="work-search" aria-label="Tìm công việc" placeholder="Tìm công việc…" value="${esc(
      search
    )}"></label></div><div class="cards" id="work-cards">${
      list.map(workCard).join("") || empty("Không có công việc phù hợp.")
    }</div>`
  );
}
function calendar() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    let d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  return (
    heading(
      "Lịch công việc",
      "Các mốc dưới đây là hạn công việc, không phải dữ liệu chấm công.",
      `<div class="row">${btn("week-prev", icon("back"), "small")}${btn(
        "week-today",
        "Hôm nay",
        "small"
      )}${btn("week-next", icon("arrow"), "small")}</div>`
    ) +
    `<div class="section-head"><h2>${fmt(days[0])} — ${fmt(
      days[6]
    )}</h2><span class="muted">${
      C.managedDepartments.length ? "Phạm vi quản lý" : "Lịch của bạn"
    }</span></div><div class="calendar-wrap"><div class="calendar">${days
      .map((d) => {
        const list = works.filter(
          (w) => new Date(w.due_at).toDateString() === d.toDateString()
        );
        return `<section class="day ${
          d.toDateString() === new Date().toDateString() ? "today" : ""
        }"><div class="day-head">${new Intl.DateTimeFormat("vi-VN", {
          weekday: "long",
        }).format(d)}<strong>${d.getDate()}</strong></div>${
          list
            .map(
              (w) =>
                `<a class="calendar-job" href="#work/${w.id}">${pill(
                  w.priority
                )}<strong>${esc(w.title)}</strong><small>${esc(
                  w.assignee_name || "Chờ bàn giao"
                )} · ${fmt(w.due_at, true)}</small></a>`
            )
            .join("") || '<small class="muted">Chưa có hạn công việc</small>'
        }</section>`;
      })
      .join("")}</div></div>`
  );
}
function workDetail(w) {
  current = { type: "work", data: w };
  const actions = w.allowedActions || [];
  return (
    heading(
      w.title,
      "Công việc nội bộ · " + w.department_name,
      `<a class="btn small" href="#work">${icon("back")} Công việc</a>`
    ) +
    `<div class="detail-grid"><section><div class="panel ${""}"><div class="row wrap">${pill(
      w.status
    )}${pill(w.priority)}</div>${
      w.status === "HANDOVER"
        ? `<div class="handover-banner" style="margin-top:20px"><h3>${icon(
            "handover"
          )} Tiếp nối tiến độ ${
            w.progress
          }%</h3><p>Đọc lịch sử và ghi nhận phần cần kiểm tra. Tiếp nhận không đồng nghĩa với nghiệm thu phần việc trước.</p></div>`
        : ""
    }<p class="detail-copy">${esc(w.description)}</p>${
      w.attachments?.length
        ? `<div class="stack" style="margin-bottom:18px">${w.attachments
            .map((f) =>
              btn(
                "download",
                icon("file") + " " + esc(f.original_name),
                "small",
                f.id
              )
            )
            .join("")}</div>`
        : ""
    }<div class="meta-grid"><div><label>Người phụ trách</label><p>${esc(
      w.assignee_name || "Chưa có người nhận"
    )}</p></div><div><label>Người kiểm tra</label><p>${esc(
      w.reviewer_name
    )}</p></div><div><label>Hạn công việc</label><p>${fmt(
      w.due_at,
      true
    )}</p></div><div><label>Tiến độ được giữ lại</label><p>${
      w.progress
    }%</p></div></div><div class="progress"><span style="width:${Number(
      w.progress
    )}%"></span></div><div class="row wrap" style="margin-top:23px">${actions
      .filter((a) => a !== "COMMENT")
      .map((a) =>
        btn(
          "work-command",
          `${icon(
            a === "ACCEPT_HANDOVER"
              ? "handover"
              : a === "APPROVE"
              ? "check"
              : "arrow"
          )} ${workLabels[a === "HANDOVER" ? "HANDOVER_ACTION" : a]}`,
          ["START", "SUBMIT", "APPROVE", "ACCEPT_HANDOVER"].includes(a)
            ? "primary small"
            : "small",
          a
        )
      )
      .join(
        ""
      )}</div></div><div class="panel"><h3>Lịch sử & trao đổi</h3><div class="timeline">${w.events
      .map(
        (e) =>
          `<article class="event"><small>${esc(e.actor_name)} · ${fmt(
            e.created_at,
            true
          )} · ${esc(labels[e.event_type] || e.event_type)}</small><p>${esc(
            e.content
          )}</p></article>`
      )
      .join("")}</div>${
      actions.includes("COMMENT")
        ? btn("work-comment", icon("plus") + " Viết trao đổi", "small")
        : ""
    }</div></section><aside><div class="panel"><h3>Lịch sử bàn giao</h3>${
      w.handovers.length
        ? w.handovers
            .map(
              (h) =>
                `<div class="list-row"><div>${pill(
                  h.accepted_at ? "COMPLETED" : "HANDOVER",
                  h.accepted_at ? "Đã tiếp nhận" : "Chờ rà soát"
                )}<p>${esc(h.from_name || "Hàng đợi bàn giao")} → ${esc(
                  h.to_name
                )}</p><p>Tiến độ lúc chuyển: ${h.progress_snapshot}%</p>${
                  h.review_note
                    ? `<p class="detail-copy">${esc(h.review_note)}</p>`
                    : ""
                }</div></div>`
            )
            .join("")
        : '<p class="muted" style="margin-top:12px">Chưa có lần bàn giao.</p>'
    }</div></aside></div>`
  );
}
function requestTable(data) {
  return data.items.length
    ? `<div class="table-wrap"><table><thead><tr><th>Yêu cầu</th><th>Phòng tiếp nhận</th><th>Người xử lý</th><th>Trạng thái</th><th>Ưu tiên</th></tr></thead><tbody>${data.items
        .map(
          (r) =>
            `<tr><td><a href="#request/${r.id}"><small>${esc(
              r.request_number
            )}</small><strong>${esc(r.title)}</strong><small>${esc(
              r.requester_name
            )} · ${fmt(r.created_at)}</small></a></td><td>${esc(
              r.department_name || "Chưa định tuyến"
            )}<br><small>${esc(r.category_name)}</small></td><td>${esc(
              r.assignee_name || "Chờ phân công"
            )}${
              r.assignee_status && r.assignee_status !== "ACTIVE"
                ? `<br>${pill(r.assignee_status)}`
                : ""
            }</td><td>${pill(r.status)}</td><td>${pill(r.priority)}</td></tr>`
        )
        .join("")}</tbody></table></div>`
    : empty("Chưa có yêu cầu trong phạm vi này.");
}
async function requestsView() {
  const scope = { requests: "mine", assigned: "assigned", queue: "queue" }[
    view
  ];
  const data = await api(
    `/workplace/requests?scope=${scope}&page=${page}&search=${encodeURIComponent(
      search
    )}`
  );
  return (
    heading(
      view === "queue"
        ? "Hàng đợi của phòng"
        : view === "assigned"
        ? "Yêu cầu tôi xử lý"
        : "Yêu cầu của tôi",
      view === "queue"
        ? "Tiếp nhận và phân công cho đúng nhân viên trong phòng."
        : view === "assigned"
        ? "Xử lý, trao đổi và gửi kết quả để người gửi xác nhận."
        : "Theo dõi từ lúc gửi đến khi kiểm tra và xác nhận kết quả.",
      view === "requests"
        ? btn("new-request", icon("plus") + " Gửi yêu cầu", "primary")
        : ""
    ) +
    `<div class="filters"><label class="search">${icon(
      "search"
    )}<input id="request-search" aria-label="Tìm yêu cầu" value="${esc(
      search
    )}" placeholder="Tìm tiêu đề hoặc mã…"></label>${btn(
      "request-search",
      "Tìm kiếm",
      "small"
    )}<span class="muted">${data.totalItems} yêu cầu</span></div>${requestTable(
      data
    )}<div class="pager"><button class="btn small" aria-label="Trang trước" data-action="page-prev" ${
      !data.hasPrevious ? "disabled" : ""
    }>${icon("back")}</button><span>Trang ${
      data.page + 1
    }</span><button class="btn small" aria-label="Trang sau" data-action="page-next" ${
      !data.hasNext ? "disabled" : ""
    }>${icon("arrow")}</button></div>`
  );
}
function requestDetail(r) {
  const lastResolution = (r.histories || [])
    .filter((h) => h.toStatus === "RESOLVED")
    .at(-1);
  const resultSection = lastResolution
    ? `<div class="handover-banner"><h3>Kết quả xử lý được báo gần nhất</h3><p class="detail-copy">${esc(
        lastResolution.comment
      )}</p><small class="muted">${esc(lastResolution.changedByName)} · ${fmt(
        lastResolution.changedAt,
        true
      )}</small></div>`
    : "";
  const workflowBanner =
    (r.workflow?.cancellation?.state === "PENDING"
      ? `<div class="handover-banner" style="margin-top:18px"><h3>Đề nghị hủy đang chờ xem xét</h3><p>${esc(
          r.workflow.cancellation.reason
        )}</p></div>`
      : "") +
    (r.workflow?.handovers?.length
      ? `<div class="handover-banner" style="margin-top:18px"><h3>Tiếp nối xử lý</h3>${r.workflow.handovers
          .map(
            (h) =>
              `<p>${esc(h.previous_name)} → ${esc(h.receiver_name)} · ${
                h.reviewed_at ? "Đã rà soát" : "Chờ rà soát"
              }${h.review_note ? "<br>" + esc(h.review_note) : ""}</p>`
          )
          .join("")}</div>`
      : "");
  current = { type: "request", data: r };
  const acts = r.allowedActions || [],
    department = C.departments.find((d) => d.id === r.receivingDepartmentId);
  return (
    heading(
      r.title,
      r.requestNumber +
        ` · ${department?.name || "Yêu cầu kế thừa chưa định tuyến"}`,
      `<a class="btn small" href="#requests">${icon("back")} Yêu cầu</a>`
    ) +
    `<div class="detail-grid"><section><div class="panel"><div class="row wrap">${pill(
      r.status
    )}${pill(r.priority)}</div>${workflowBanner}<p class="detail-copy">${esc(
      r.description
    )}</p>${resultSection}<div class="meta-grid"><div><label>Người gửi</label><p>${esc(
      r.requester?.fullName
    )}</p></div><div><label>Người xử lý</label><p>${esc(
      r.assignee?.fullName || "Chờ phân công"
    )}</p></div><div><label>Loại yêu cầu</label><p>${esc(
      r.category?.name
    )}</p></div><div><label>Ngày tạo</label><p>${fmt(
      r.createdAt,
      true
    )}</p></div></div>${
      r.attachments?.length
        ? `<div class="stack">${r.attachments
            .map((f) =>
              btn(
                "download",
                icon("file") + " " + esc(f.originalName),
                "small",
                f.id
              )
            )
            .join("")}</div>`
        : ""
    }<div class="row wrap" style="margin-top:23px">${acts
      .filter((a) => !["COMMENT", "RATE", "UPDATE"].includes(a))
      .map((a) =>
        btn(
          "request-command",
          icon(a === "CONFIRM" ? "check" : "arrow") + " " + esc(labels[a] || a),
          ["START", "RESOLVE", "CONFIRM"].includes(a)
            ? "primary small"
            : a === "CANCEL"
            ? "danger small"
            : "small",
          a
        )
      )
      .join("")}${
      acts.includes("UPDATE")
        ? btn("edit-request", icon("settings") + " Sửa yêu cầu", "small")
        : ""
    }</div></div><div class="panel"><h3>Trao đổi</h3>${
      r.comments
        ?.map(
          (c) =>
            `<div class="list-row">${avatar(c.authorName)}<div><strong>${esc(
              c.authorName
            )}</strong>${
              c.isInternal ? pill("REVIEW", "Nội bộ") : ""
            }<p class="detail-copy">${esc(
              c.content
            )}</p><small class="muted">${fmt(
              c.createdAt,
              true
            )}</small></div></div>`
        )
        .join("") ||
      '<p class="muted" style="margin-top:14px">Chưa có trao đổi.</p>'
    }<div style="margin-top:18px">${
      acts.includes("COMMENT")
        ? btn("request-comment", icon("plus") + " Viết trao đổi", "small")
        : ""
    }</div></div></section><aside><section class="panel"><h3>Lịch sử xử lý</h3><div class="timeline">${
      r.histories
        ?.map(
          (h) =>
            `<article class="event"><small>${esc(h.changedByName)} · ${fmt(
              h.changedAt,
              true
            )}</small><p>${esc(
              labels[h.toStatus] || h.toStatus
            )}</p><p class="muted">${esc(h.comment)}</p></article>`
        )
        .join("") || ""
    }</div></section></aside></div>`
  );
}
function departmentsView() {
  return (
    heading(
      "Phòng ban",
      "Danh mục có thể mở rộng. Chỉ phòng có người phụ trách hoạt động mới nhận yêu cầu.",
      btn("new-department", icon("plus") + " Thêm phòng ban", "primary")
    ) +
    `<div class="cards">${C.departments
      .map(
        (d) =>
          `<section class="panel"><div class="row between">${avatar(
            d.code,
            "lime"
          )}${pill(
            d.is_active ? "ACTIVE" : "DISABLED",
            d.is_active ? "Đang hoạt động" : "Ngừng hoạt động"
          )}</div><h2 style="margin-top:20px">${esc(
            d.name
          )}</h2><p class="muted">${esc(
            d.code
          )}</p><p class="detail-copy">${esc(
            d.description || "Chưa có mô tả."
          )}</p><div class="row between"><small class="muted">${esc(
            d.manager_name || "Chưa chỉ định trưởng phòng"
          )}</small>${btn("edit-department", "Cấu hình", "small", d.id)}${btn(
            "p-authority",
            "Lãnh đạo phụ trách",
            "small",
            d.id
          )}</div></section>`
      )
      .join("")}</div>`
  );
}
async function accountsView() {
  const staff = await api("/workplace/staff");
  current = { type: "staff", data: staff };
  return (
    heading(
      "Tài khoản & quyền",
      "Vai trò hệ thống, phòng ban và quyền chuyên trách được quản lý riêng.",
      btn("new-account", icon("plus") + " Tạo tài khoản", "primary")
    ) +
    `<div class="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Phòng ban</th><th>Quyền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${staff
      .map(
        (u) =>
          `<tr><td><strong>${esc(u.full_name)}</strong><small>${esc(
            u.username
          )} · ${esc(u.email)}</small></td><td>${esc(
            u.department_name || "Chưa gán"
          )}</td><td>${u.roles
            .map((r) =>
              pill(
                "REVIEW",
                {
                  ADMIN: "Admin hệ thống",
                  EMPLOYEE: "Người dùng nội bộ",
                  PROJECT_MANAGER: "Quản lý dự án",
                  TEAM_LEADER: "Trưởng nhóm",
                }[r] || r
              )
            )
            .join(" ")}${
            C.departments.some((d) => d.manager_id === u.id)
              ? pill("ACTIVE", "Trưởng phòng")
              : ""
          }<br><small>${u.capabilities
            .map(
              (c) =>
                ({
                  HR_MANAGE: "Nhân sự",
                  TIME_REVIEW: "Đối soát công",
                  PAYROLL_MANAGE: "Lập bảng tính lương",
                  PAYROLL_APPROVE: "Phê duyệt bảng tính",
                  EXECUTIVE: "Ban lãnh đạo",
                }[c])
            )
            .join(", ")}</small></td><td>${pill(
            u.status
          )}</td><td><div class="row wrap">${btn(
            "edit-account",
            "Sửa quyền",
            "small",
            u.id
          )}${
            u.status === "PENDING"
              ? btn("p-invite", "Gửi lại kích hoạt", "small", u.id)
              : u.status === "ACTIVE"
              ? btn("lock-account", "Khóa", "danger small", u.id)
              : u.status === "LOCKED"
              ? btn("unlock-account", "Mở khóa", "small", u.id)
              : ""
          }</div></td></tr>`
      )
      .join("")}</tbody></table></div>`
  );
}
async function categoriesView() {
  const list = await api("/workplace/categories");
  current = { type: "categories", data: list };
  return (
    heading(
      "Danh mục hỗ trợ & nơi tiếp nhận",
      "Đổi cấu hình chỉ áp dụng cho yêu cầu mới; lịch sử phòng nhận của yêu cầu cũ được giữ.",
      btn("new-category", icon("plus") + " Thêm loại yêu cầu", "primary")
    ) +
    `<div class="table-wrap"><table><thead><tr><th>Loại yêu cầu</th><th>Phòng tiếp nhận</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${list
      .map(
        (c) =>
          `<tr><td><strong>${esc(c.name)}</strong><small>${esc(
            c.code
          )}</small></td><td>${esc(
            C.departments.find((d) => d.id === c.receiving_department_id)
              ?.name || "Chưa cấu hình"
          )}</td><td>${pill(c.is_active ? "ACTIVE" : "DISABLED")}</td><td>${btn(
            "route-category",
            "Chọn phòng",
            "small",
            c.id
          )}</td></tr>`
      )
      .join("")}</tbody></table></div>`
  );
}
function noticesView() {
  return (
    heading(
      "Thông báo",
      "Các cập nhật liên quan tới bạn và công việc trong phạm vi được giao."
    ) +
    `<div class="panel" style="padding:0">${
      notices
        .map(
          (n) =>
            `<article class="notice ${!n.read_at ? "unread" : ""}">${icon(
              "bell"
            )}<div style="flex:1"><button class="link" data-action="notice" data-id="${
              n.id
            }"><strong>${esc(n.title)}</strong></button><time>${fmt(
              n.created_at,
              true
            )}</time></div>${!n.read_at ? pill("ACTIVE", "Mới") : ""}</article>`
        )
        .join("") || empty("Bạn chưa có thông báo.")
    }</div>`
  );
}
function profileView() {
  return (
    heading(
      "Hồ sơ cá nhân",
      "Thông tin phòng ban và quyền do người có thẩm quyền quản lý."
    ) +
    `<div class="profile-grid"><section class="panel"><div class="row">${avatar(
      C.user.full_name,
      "lime"
    )}<div><h2>${esc(C.user.full_name)}</h2><p class="muted">${esc(
      C.user.email
    )}</p></div></div><div class="meta-grid" style="margin-top:30px"><div><label>Tên đăng nhập</label><p>${esc(
      C.user.username
    )}</p></div><div><label>Phòng ban</label><p>${esc(
      C.user.department_name || "Chưa gán phòng"
    )}</p></div><div><label>Trạng thái</label><p>${pill(
      C.user.status
    )}</p></div></div></section><section class="panel"><h3>Bảo vệ tài khoản</h3><p class="detail-copy">Đổi mật khẩu và chủ động kết thúc các phiên đăng nhập khi cần.</p><div class="row wrap">${btn(
      "change-password",
      "Đổi mật khẩu",
      "small"
    )}${btn(
      "logout-all",
      "Đăng xuất mọi thiết bị",
      "danger small"
    )}</div></section></div>`
  );
}
async function auditView() {
  const events = await api("/workplace/audit");
  return (
    heading(
      "Nhật ký quản trị",
      "Lịch sử các thao tác quản trị của cổng web. Hiển thị tối đa 200 bản ghi gần nhất."
    ) +
    `<section class="panel"><div class="timeline">${
      events
        .map(
          (e) =>
            `<article class="event"><small>${esc(e.actor_name)} · ${fmt(
              e.created_at,
              true
            )} · ${esc(e.event_type)}</small><p>${esc(e.content)}</p></article>`
        )
        .join("") || empty("Chưa có thao tác quản trị.")
    }</div></section>`
  );
}
async function route() {
  peopleUI.stop();
  if (!C) return;
  const serial = ++routeSerial;
  const [target, id] = location.hash.replace(/^#/, "").split("/");
  view = target || "home";
  if (["forgot", "reset", "activate"].includes(view))
    return recoveryView(view, id);
  document.body.classList.remove("mobile-open");
  shell();
  try {
    if (
      C.admin &&
      ![
        "home",
        "accounts",
        "departments",
        "categories",
        "audit",
        "access",
        "profile",
        "security",
        "notifications",
        "import",
      ].includes(view)
    )
      throw new Error(
        "Tài khoản quản trị dùng cho quản trị hệ thống. Dùng tài khoản làm việc riêng để xử lý nghiệp vụ."
      );
    if (
      ["accounts", "departments", "categories", "audit"].includes(view) &&
      !C.admin
    )
      throw new Error("Bạn không có quyền quản trị chức năng này.");
    if (view === "queue" && !C.managedDepartments.length)
      throw new Error("Bạn không phụ trách hàng đợi phòng ban.");
    let html;
    if (view === "work" && id)
      html = workDetail(await api("/workplace/work/" + encodeURIComponent(id)));
    else if (view === "request" && id)
      html = requestDetail(
        await api("/service-requests/" + encodeURIComponent(id))
      );
    else if (view === "home")
      html = C.executive ? await peopleUI.render("approvals") : home();
    else if (view === "work" || view === "handover")
      html = workList(view === "handover");
    else if (view === "calendar") html = calendar();
    else if (["requests", "assigned", "queue"].includes(view))
      html = await requestsView();
    else if (view === "departments") html = departmentsView();
    else if (view === "accounts") html = await accountsView();
    else if (view === "categories") html = await categoriesView();
    else if (view === "notifications") html = noticesView();
    else if (
      [
        "people",
        "stations",
        "delegations",
        "personnel",
        "access",
        "approvals",
        "security",
        "import",
      ].includes(view)
    )
      html = await peopleUI.render(view);
    else if (view === "profile") html = profileView();
    else if (view === "audit") html = await auditView();
    else if (view === "hr") {
      location.hash = "personnel";
      return;
    } else if (view === "time") html = await timeView();
    else if (view === "salary" || view === "payroll") html = await incomeView();
    else html = empty("Không tìm thấy trang này.");
    if (serial === routeSerial && C) {
      $("#main").innerHTML = html;
      document.title = `WorkSphere · ${$("#main h1")?.textContent || "Nội bộ"}`;
    }
  } catch (e) {
    if (serial === routeSerial && C)
      $("#main").innerHTML = `<div class="error-box" role="alert">${esc(
        e.message
      )}</div><div style="margin-top:16px">${btn(
        "reload",
        icon("refresh") + " Tải lại",
        "small"
      )}</div>`;
  }
}
function field(name, label, type = "text", options = {}) {
  const {
    value = "",
    choices = [],
    required = true,
    hint = "",
    min,
    max,
  } = options;
  const attr = `name="${name}" id="f-${name}" ${required ? "required" : ""}`;
  let control;
  if (type === "select")
    control = `<select ${attr}>${choices
      .map(
        (c) =>
          `<option value="${esc(c.value)}" ${
            String(c.value) === String(value) ? "selected" : ""
          }>${esc(c.label)}</option>`
      )
      .join("")}</select>`;
  else if (type === "textarea")
    control = `<textarea ${attr} maxlength="${max || 10000}">${esc(
      value
    )}</textarea>`;
  else
    control = `<input ${attr} type="${type}" value="${esc(value)}" ${
      min !== undefined ? `min="${min}"` : ""
    } ${
      max !== undefined
        ? type === "number"
          ? `max="${max}"`
          : `maxlength="${max}"`
        : ""
    } ${type === "password" ? 'autocomplete="new-password"' : ""}>`;
  return `<label class="field" for="f-${name}">${label}${control}${
    hint ? `<small>${hint}</small>` : ""
  }</label>`;
}
function form(
  title,
  fields,
  onSubmit,
  { submit = "Xác nhận", intro = "", after } = {}
) {
  dialog.innerHTML = `<div id="dialog-content"><div class="dialog-head"><h2 id="dialog-title">${esc(
    title
  )}</h2><button class="icon-btn" data-action="close" aria-label="Đóng">${icon(
    "close"
  )}</button></div><form class="dialog-body" id="action-form">${
    intro ? `<p class="muted" style="font-size:12px">${esc(intro)}</p>` : ""
  }${fields}<div class="form-error" role="alert"></div><div class="form-actions"><button type="button" class="btn" data-action="close">Hủy</button><button type="submit" class="btn primary">${esc(
    submit
  )}</button></div></form></div>`;
  dialog.setAttribute("aria-labelledby", "dialog-title");
  dialog.showModal();
  $("#action-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget,
      b = f.querySelector('[type="submit"]');
    b.disabled = true;
    f.querySelector(".form-error").textContent = "";
    try {
      await onSubmit(Object.fromEntries(new FormData(f)), f);
      dialog.close();
      if (!C) return;
      if (!(await loadContext())) return;
      await route();
      if (after) after();
      else toast("Đã lưu thay đổi.");
    } catch (err) {
      f.querySelector(".form-error").textContent = err.message;
      if (err.status === 409)
        f.querySelector(".form-error").textContent +=
          " Đóng cửa sổ và tải lại để lấy bản mới.";
    } finally {
      b.disabled = false;
    }
  });
}
const departmentsOptions = (includeBlank = false, managedOnly = false) => [
  ...(includeBlank ? [{ value: "", label: "Chưa gán phòng" }] : []),
  ...C.departments
    .filter(
      (d) =>
        d.is_active && (!managedOnly || C.managedDepartments.includes(d.id))
    )
    .map((d) => ({ value: d.id, label: d.name })),
];
function peopleOptions(department, exclude = []) {
  return C.people
    .filter(
      (u) =>
        (!department || u.department_id === department) &&
        !exclude.includes(u.id)
    )
    .map((u) => ({ value: u.id, label: u.full_name }));
}
function newWork() {
  const departments = departmentsOptions(false, true),
    dept = departments[0]?.value;
  if (!dept) return toast("Chưa có phòng phụ trách.", true);
  form(
    "Giao công việc",
    field("departmentId", "Phòng thực hiện", "select", {
      choices: departments,
    }) +
      field("title", "Tên công việc", "text", { max: 255 }) +
      field("description", "Nội dung và kết quả cần đạt", "textarea") +
      field("assigneeId", "Người phụ trách", "select", {
        choices: peopleOptions(dept, [C.user.id]),
      }) +
      field("priority", "Ưu tiên", "select", {
        value: "MEDIUM",
        choices: ["LOW", "MEDIUM", "HIGH", "URGENT"].map((v) => ({
          value: v,
          label: labels[v],
        })),
      }) +
      field("dueAt", "Hạn hoàn thành", "datetime-local"),
    async (v) => {
      const w = await api("/workplace/work", {
        method: "POST",
        body: { ...v, dueAt: new Date(v.dueAt).toISOString() },
      });
      location.hash = "work/" + w.id;
    },
    { submit: "Giao công việc" }
  );
  $("#f-departmentId").addEventListener(
    "change",
    (e) =>
      ($("#f-assigneeId").innerHTML = peopleOptions(e.target.value, [C.user.id])
        .map((u) => `<option value="${u.value}">${esc(u.label)}</option>`)
        .join(""))
  );
}
function workCommand(action) {
  const w = current.data;
  if (action === "EDIT") {
    const local = new Date(w.due_at);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    form(
      "Sửa công việc",
      field("title", "Tên công việc", "text", { value: w.title, max: 255 }) +
        field("description", "Nội dung", "textarea", { value: w.description }) +
        field("priority", "Ưu tiên", "select", {
          value: w.priority,
          choices: ["LOW", "MEDIUM", "HIGH", "URGENT"].map((v) => ({
            value: v,
            label: labels[v],
          })),
        }) +
        field("dueAt", "Hạn hoàn thành", "datetime-local", {
          value: local.toISOString().slice(0, 16),
        }) +
        field("reason", "Lý do thay đổi", "textarea", { max: 1000 }),
      (v) =>
        api("/workplace/work/" + w.id, {
          method: "PUT",
          body: {
            ...v,
            dueAt: new Date(v.dueAt).toISOString(),
            version: w.version,
          },
        })
    );
    return;
  }
  let fields = "",
    intro = "",
    submit = workLabels[action === "HANDOVER" ? "HANDOVER_ACTION" : action];
  if (action === "PROGRESS")
    fields += field("progress", "Tiến độ (%)", "number", {
      value: w.progress,
      min: 0,
      max: 100,
    });
  if (action === "HANDOVER")
    fields += field("userId", "Người tiếp nhận", "select", {
      choices: peopleOptions(w.department_id, [w.assignee_id, w.reviewer_id]),
    });
  if (action === "ACCEPT_HANDOVER") {
    intro = `Tiến độ ${w.progress}% được giữ nguyên sau khi tiếp nhận.`;
    fields +=
      '<div class="checks"><label><input type="checkbox" required> Tôi đã đọc lịch sử và các nội dung đã thực hiện.</label><label><input type="checkbox" required> Tôi đã xác định phần tiếp tục và vấn đề cần kiểm tra.</label></div>';
  }
  if (!["START", "APPROVE"].includes(action))
    fields += field(
      "content",
      action === "ACCEPT_HANDOVER"
        ? "Kết quả rà soát, vấn đề và phần tiếp tục"
        : action === "SUBMIT"
        ? "Kết quả thực hiện"
        : action === "RETURN"
        ? "Lý do cần làm lại"
        : action === "HANDOVER"
        ? "Nội dung bàn giao"
        : "Nội dung",
      "textarea",
      { required: action !== "PROGRESS" }
    );
  else
    fields +=
      '<p class="muted">' +
      (action === "START"
        ? "Nhận trách nhiệm và bắt đầu xử lý công việc này?"
        : "Xác nhận đã kiểm tra và chấp nhận kết quả công việc?") +
      "</p>";
  if (["COMMENT", "SUBMIT"].includes(action))
    fields += field("attachment", "Tệp đính kèm", "file", { required: false });
  form(
    submit,
    fields,
    async (v, f) => {
      const file = f.querySelector('[name="attachment"]')?.files[0];
      await api(`/workplace/work/${w.id}/commands`, {
        method: "POST",
        body: {
          ...v,
          action,
          version: w.version,
          progress: v.progress === undefined ? null : Number(v.progress),
          fileIds: file ? [await upload(file, "TASK_ATTACHMENT")] : [],
        },
      });
    },
    {
      submit,
      intro,
      after: ["ACCEPT_HANDOVER", "START"].includes(action)
        ? () => {
            $("#main .panel")?.classList.add("accept-effect");
            toast(
              action === "START"
                ? "Đã nhận việc. Bắt đầu từng bước nhé."
                : `Đã tiếp nhận. Tiến độ ${w.progress}% được giữ nguyên.`
            );
          }
        : undefined,
    }
  );
}
async function upload(file, purpose = "SERVICE_ATTACHMENT") {
  const data = new FormData();
  data.append("file", file);
  data.append("purpose", purpose);
  return (await api("/files", { method: "POST", body: data })).id;
}
function requestForm(edit = false) {
  const r = edit ? current.data : null;
  const categories = C.categories;
  if (!categories.length)
    return toast("Chưa có loại yêu cầu được cấu hình phòng tiếp nhận.", true);
  form(
    edit ? "Sửa yêu cầu" : "Gửi yêu cầu hỗ trợ",
    field("categoryId", "Loại yêu cầu · phòng tiếp nhận", "select", {
      value: r?.category?.id,
      choices: categories.map((c) => ({
        value: c.id,
        label: c.name + " · " + c.department_name,
      })),
    }) +
      field("title", "Tiêu đề", "text", { value: r?.title, max: 255 }) +
      field("description", "Nội dung cần hỗ trợ", "textarea", {
        value: r?.description,
      }) +
      field("priority", "Mức ưu tiên đề nghị", "select", {
        value: r?.priority || "MEDIUM",
        choices: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((v) => ({
          value: v,
          label: labels[v],
        })),
      }) +
      (edit
        ? ""
        : field("attachment", "Tệp đính kèm (không bắt buộc)", "file", {
            required: false,
            hint: "Tệp sẽ được kiểm tra loại và dung lượng trước khi lưu.",
          })),
    async (v, f) => {
      if (edit) {
        await api("/service-requests/" + r.id, {
          method: "PUT",
          body: { ...v, version: r.version },
        });
      } else {
        const file = f.querySelector('[name="attachment"]').files[0];
        const attachmentFileIds = file ? [await upload(file)] : [];
        const created = await api("/service-requests", {
          method: "POST",
          body: { ...v, attachmentFileIds },
        });
        location.hash = "request/" + created.id;
      }
    },
    { submit: edit ? "Lưu thay đổi" : "Gửi yêu cầu" }
  );
}
function requestCommand(action) {
  const r = current.data;
  if (
    [
      "REQUEST_CANCEL",
      "APPROVE_CANCEL",
      "DENY_CANCEL",
      "REVIEW_HANDOVER",
    ].includes(action)
  ) {
    const checks =
      action === "REVIEW_HANDOVER"
        ? '<div class="checks"><label><input type="checkbox" required> Tôi đã đọc lịch sử, kết quả và trao đổi của người xử lý trước.</label><label><input type="checkbox" required> Tôi đã xác định phần cần tiếp tục và vấn đề cần kiểm tra.</label></div>'
        : "";
    form(
      labels[action],
      checks +
        field(
          "reason",
          action === "REVIEW_HANDOVER"
            ? "Kết quả rà soát và phần tiếp tục"
            : "Lý do / kết quả xem xét",
          "textarea",
          { max: 2000 }
        ),
      (v) =>
        api("/workplace/requests/" + r.id + "/operations", {
          method: "POST",
          body: { ...v, action, version: r.version },
        }),
      {
        submit: labels[action],
        intro:
          action === "REQUEST_CANCEL"
            ? "Yêu cầu vẫn giữ trạng thái xử lý trong lúc chờ người có quyền xem xét."
            : action === "REVIEW_HANDOVER"
            ? "Lịch sử của người xử lý trước được giữ nguyên; tiếp nhận không phải nghiệm thu."
            : "",
      }
    );
    return;
  }

  if (
    ["TRANSFER", "DECLINE", "DISPATCH_INFO", "DISPATCH_RESUME"].includes(action)
  ) {
    const fields =
      (action === "TRANSFER"
        ? field(
            "categoryId",
            "Chuyển tới loại yêu cầu ở phòng khác",
            "select",
            {
              choices: C.categories
                .filter(
                  (c) => c.receiving_department_id !== r.receivingDepartmentId
                )
                .map((c) => ({
                  value: c.id,
                  label: c.name + " · " + c.department_name,
                })),
            }
          )
        : "") +
      field(
        "reason",
        action === "DISPATCH_INFO"
          ? "Thông tin cần bổ sung"
          : "Lý do điều phối",
        "textarea",
        { max: 1000 }
      );
    form(labels[action], fields, (v) =>
      api("/workplace/requests/" + r.id + "/dispatch", {
        method: "POST",
        body: { ...v, action, version: r.version },
      })
    );
    return;
  }
  let fields = "",
    title = labels[action],
    status = {
      START: "IN_PROGRESS",
      WAIT_FOR_USER: "WAITING_FOR_USER",
      RESUME: "IN_PROGRESS",
      RESOLVE: "RESOLVED",
      CONFIRM: "CLOSED",
      CANCEL: "CANCELLED",
    }[action];
  if (action === "ASSIGN")
    fields = field("assigneeId", "Người xử lý trong phòng", "select", {
      choices: peopleOptions(r.receivingDepartmentId, [r.requester.id]),
    });
  else if (
    ["REJECT_RESOLUTION", "RESOLVE", "WAIT_FOR_USER", "CANCEL"].includes(action)
  )
    fields = field(
      "content",
      action === "RESOLVE"
        ? "Kết quả và hướng dẫn kiểm tra"
        : action === "WAIT_FOR_USER"
        ? "Thông tin cần người gửi bổ sung"
        : "Lý do",
      "textarea",
      { max: 1000 }
    );
  else
    fields =
      '<p class="muted">' +
      (action === "CONFIRM"
        ? "Bạn đã kiểm tra và xác nhận vấn đề được xử lý đầy đủ?"
        : "Xác nhận chuyển sang bước tiếp theo?") +
      "</p>";
  form(
    title,
    fields,
    async (v) => {
      if (action === "ASSIGN")
        await api(`/service-requests/${r.id}/assignments`, {
          method: "POST",
          body: { assigneeId: v.assigneeId, version: r.version },
        });
      else if (action === "REJECT_RESOLUTION")
        await api(`/service-requests/${r.id}/reject-resolution`, {
          method: "POST",
          body: { reason: v.content, version: r.version },
        });
      else
        await api(`/service-requests/${r.id}/status`, {
          method: "PUT",
          body: { status, comment: v.content, version: r.version },
        });
    },
    { submit: title }
  );
}
function requestComment() {
  const r = current.data;
  form(
    "Trao đổi về yêu cầu",
    field("content", "Nội dung", "textarea") +
      field("attachment", "Tệp đính kèm", "file", { required: false }),
    async (v, f) => {
      const file = f.querySelector('[name="attachment"]').files[0];
      await api(`/service-requests/${r.id}/comments`, {
        method: "POST",
        body: {
          content: v.content,
          isInternal: false,
          attachmentFileIds: file ? [await upload(file)] : [],
        },
      });
    },
    { submit: "Gửi trao đổi" }
  );
}
async function departmentForm(id) {
  const staff = await api("/workplace/staff");
  const members = (dept) =>
    staff
      .filter(
        (u) =>
          u.status === "ACTIVE" &&
          u.department_id === dept &&
          !u.roles.includes("ADMIN")
      )
      .map((u) => ({ value: u.id, label: u.full_name }));
  const d = C.departments.find((x) => x.id === id);
  form(
    d ? "Cấu hình phòng ban" : "Thêm phòng ban",
    (!d ? field("code", "Mã phòng ban", "text", { max: 50 }) : "") +
      field("name", "Tên phòng ban", "text", { value: d?.name, max: 150 }) +
      field("description", "Mô tả", "textarea", {
        value: d?.description,
        required: false,
        max: 500,
      }) +
      (d
        ? field("managerId", "Trưởng phòng", "select", {
            value: d.manager_id || "",
            choices: [{ value: "", label: "Chưa chỉ định" }, ...members(d.id)],
          })
        : "") +
      field("active", "Trạng thái", "select", {
        value: d ? String(d.is_active) : "true",
        choices: [
          { value: "true", label: "Hoạt động" },
          { value: "false", label: "Ngừng hoạt động" },
        ],
      }),
    async (v) => {
      await api("/workplace/departments" + (d ? "/" + d.id : ""), {
        method: d ? "PUT" : "POST",
        body: {
          ...v,
          managerId: v.managerId || null,
          active: v.active === "true",
          version: d?.version,
        },
      });
    },
    {
      intro: d
        ? "Đổi trưởng phòng sẽ chuyển trách nhiệm kiểm tra công việc đang mở sang người mới."
        : "Sau khi tạo, hãy gán nhân viên rồi chỉ định trưởng phòng để mở tiếp nhận yêu cầu.",
    }
  );
}
function accountForm(id) {
  const u = id ? current.data.find((x) => x.id === id) : null;
  if (u) {
    form(
      "Phòng ban & quyền · " + u.full_name,
      field("jobTitle", "Chức danh", "text", { value: u.job_title, max: 100 }) +
        field("departmentId", "Phòng ban", "select", {
          value: u.department_id || "",
          choices: departmentsOptions(true),
        }) +
        field("role", "Vai trò hệ thống", "select", {
          value: u.roles.includes("ADMIN") ? "ADMIN" : "EMPLOYEE",
          choices: [
            { value: "EMPLOYEE", label: "Người dùng nghiệp vụ" },
            { value: "ADMIN", label: "Admin hệ thống" },
          ],
        }) +
        `<section class="business-capabilities"><p class="muted">Nhiệm vụ chuyên trách là tùy chọn, chỉ cấp theo phân công có căn cứ. Nhân viên không bắt buộc có các quyền dưới đây.</p><div class="checks">${[
          ["HR_MANAGE", "Xử lý hồ sơ nhân sự"],
          ["TIME_REVIEW", "Đối soát công"],
          ["PAYROLL_MANAGE", "Lập và đối soát bảng tính lương"],
          ["PAYROLL_APPROVE", "Kiểm tra/phê duyệt bảng tính độc lập"],
          ["EXECUTIVE", "Ban lãnh đạo — cần chỉ định phòng phụ trách"],
        ]
          .map(
            ([code, label]) =>
              `<label><input name="capabilities" value="${code}" type="checkbox" ${
                u.capabilities.includes(code) ? "checked" : ""
              }>${label}</label>`
          )
          .join("")}</div></section><p class="muted">Chức vụ quản lý: ${esc(
          C.departments.some((d) => d.manager_id === u.id)
            ? "Trưởng phòng"
            : "Chưa được bổ nhiệm trưởng phòng"
        )}. Bổ nhiệm/thay trưởng phòng tại Phòng ban & chức vụ; tên chức danh không tự cấp quyền.</p>` +
        field("reason", "Căn cứ/lý do thay đổi", "textarea", { max: 1000 }),
      async (v, f) => {
        await api("/workplace/staff/" + u.id, {
          method: "PUT",
          body: {
            ...v,
            departmentId: v.departmentId || null,
            capabilities: [
              ...f.querySelectorAll('[name="capabilities"]:checked'),
            ].map((x) => x.value),
            version: u.version,
          },
        });
      },
      {
        intro:
          "Chuyển phòng yêu cầu xử lý hết trách nhiệm đang giữ. Quyền chuyên trách phải được xem xét lại.",
      }
    );
    syncRoleForm();
    return;
  }
  form(
    "Tạo tài khoản nội bộ",
    field("fullName", "Họ tên", "text", { max: 150 }) +
      field("username", "Tên đăng nhập", "text", { max: 50 }) +
      field("email", "Email", "email") +
      field("departmentId", "Phòng ban", "select", {
        choices: departmentsOptions(true),
      }) +
      field("role", "Vai trò hệ thống", "select", {
        choices: [
          { value: "EMPLOYEE", label: "Người dùng nghiệp vụ" },
          { value: "ADMIN", label: "Admin hệ thống" },
        ],
      }),
    async (v) => {
      await api("/workplace/staff", {
        method: "POST",
        body: { ...v, departmentId: v.departmentId || null },
      });
    },
    {
      submit: "Tạo tài khoản",
      intro:
        "Tài khoản ở trạng thái chưa kích hoạt. Chủ tài khoản nhận email riêng để xác minh, chọn tên đăng nhập và đặt mật khẩu. Trưởng phòng được chỉ định tại Phòng ban.",
    }
  );
  syncRoleForm();
}
function syncRoleForm() {
  const role = document.querySelector("#f-role"),
    dept = document.querySelector("#f-departmentId"),
    specialties = document.querySelector(".business-capabilities");
  const sync = () => {
    const admin = role.value === "ADMIN";
    if (specialties) {
      specialties.hidden = admin;
      if (admin)
        specialties
          .querySelectorAll("input")
          .forEach((x) => (x.checked = false));
    }
    if (dept) {
      dept.disabled = admin;
      if (admin) dept.value = "";
    }
  };
  role.addEventListener("change", sync);
  sync();
}
function accountState(id, action) {
  const u = current.data.find((x) => x.id === id);
  form(
    (action === "LOCK"
      ? "Khóa truy cập"
      : action === "UNLOCK"
      ? "Mở khóa"
      : "Ngừng truy cập") +
      " · " +
      u.full_name,
    field("content", "Căn cứ/lý do", "textarea", { max: 2000 }),
    (v) =>
      api("/workplace/staff/" + id + "/state", {
        method: "POST",
        body: { ...v, action, version: u.version },
      }),
    {
      intro:
        action === "UNLOCK"
          ? "Người dùng cần đăng nhập lại; phiên cũ không được khôi phục."
          : "Các phiên hiện có sẽ bị thu hồi. Lịch sử công việc được giữ lại.",
    }
  );
}
function adminHome() {
  return (
    heading(
      "Quản trị không gian nội bộ",
      "Tổ chức tài khoản, phòng ban và quyền truy cập rõ ràng.",
      btn("new-account", icon("plus") + " Tạo tài khoản", "primary")
    ) +
    `<section class="hero"><div><span class="eyebrow">QUẢN TRỊ HỆ THỐNG</span><h2>Đúng quyền truy cập.<br>Rõ người phụ trách.</h2><p>Phòng ban có thể mở rộng. Quyền chuyên trách được cấp theo trách nhiệm, không suy ra từ tên vai trò.</p></div><div class="hero-art" aria-hidden="true"><div class="art-bar"></div><div class="art-bar"></div><div class="art-bar"></div></div></section><div class="metrics">${metric(
      "Tài khoản hoạt động",
      C.peopleCount,
      "people",
      true
    )}${metric(
      "Phòng đang hoạt động",
      C.departments.filter((d) => d.is_active).length,
      "building"
    )}${metric(
      "Phòng có người phụ trách",
      C.departments.filter((d) => d.manager_id && d.is_active).length,
      "shield"
    )}${metric(
      "Loại yêu cầu đang tiếp nhận",
      C.categories.length,
      "request"
    )}</div><div class="cards">${[
      [
        "accounts",
        "Tài khoản & quyền",
        "Quản lý truy cập và quyền chuyên trách.",
        "shield",
      ],
      [
        "departments",
        "Phòng ban",
        "Tạo phòng, chỉ định trưởng phòng và theo dõi trạng thái.",
        "building",
      ],
      [
        "categories",
        "Danh mục hỗ trợ & nơi tiếp nhận",
        "Cấu hình nơi tiếp nhận cho từng loại hỗ trợ.",
        "settings",
      ],
      [
        "audit",
        "Nhật ký quản trị",
        "Kiểm tra các thay đổi đã được ghi nhận.",
        "file",
      ],
    ]
      .map(
        ([v, t, d, i]) =>
          `<a class="work-card" href="#${v}">${icon(
            i
          )}<h3>${t}</h3><p>${d}</p><div class="row between card-footer"><span>Mở chức năng</span>${icon(
            "arrow"
          )}</div></a>`
      )
      .join("")}</div>`
  );
}
const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
const hours = (value) =>
  `${Math.floor(Number(value) / 60)} giờ ${
    Number(value) % 60 ? (Number(value) % 60) + " phút" : ""
  }`;
function periodControl() {
  return `<div class="row"><label class="field">Kỳ công<input id="period-select" type="month" value="${esc(
    periodValue
  )}" aria-label="Kỳ công"></label>${btn(
    "change-period",
    "Xem kỳ",
    "small"
  )}</div>`;
}
function canReview(user, dept) {
  if (user === C.user.id) return false;
  if (C.departments.some((d) => d.id === dept && d.manager_id === user))
    return (
      C.executive &&
      C.authorities.some(
        (a) => a.department_id === dept && a.executive_id === C.user.id
      )
    );
  return (
    C.timeDepartments.includes(dept) || C.capabilities.includes("TIME_REVIEW")
  );
}
async function timeView() {
  const data = await api("/workplace/time?period=" + periodValue);
  current = { type: "time", data };
  return (
    heading(
      "Công, nghỉ & tăng ca",
      "Bản ghi chờ kiểm tra được tách khỏi công đã xác nhận. Thiếu dữ liệu không tự kết luận là vắng.",
      C.user.department_id
        ? btn("time-request", icon("plus") + " Gửi đơn", "primary")
        : ""
    ) +
    `<div class="filters">${periodControl()}${
      C.capabilities.includes("TIME_REVIEW")
        ? btn("calendar-config", "Cấu hình lịch công", "small") +
          btn("time-import", "Nhập bản ghi công", "small") +
          btn("csv-import", "Nhập CSV", "small") +
          btn("correction-for", "Đề nghị điều chỉnh thay", "small")
        : ""
    }${
      C.capabilities.includes("HR_MANAGE")
        ? btn("leave-balance", "Cấu hình quỹ nghỉ", "small")
        : ""
    }${
      C.managedDepartments.length || C.capabilities.includes("TIME_REVIEW")
        ? btn("confirm-absence", "Xác nhận vắng", "small")
        : ""
    }</div><div class="metrics">${metric(
      "Bản ghi trong kỳ",
      data.attendance.length,
      "clock",
      true
    )}${metric(
      "Công đã xác nhận",
      data.attendance.filter((r) => r.status === "APPROVED").length,
      "check"
    )}${metric(
      "Đơn chờ xem xét",
      data.requests.filter((r) => r.status === "PENDING").length,
      "file"
    )}${metric(
      "Tăng ca chờ xác nhận thực tế",
      data.requests.filter(
        (r) => r.request_type === "OVERTIME" && r.status === "APPROVED"
      ).length,
      "clock"
    )}</div><section class="panel"><h2>Chấm công hôm nay</h2><p>${esc(
      data.today?.message || ""
    )}</p><p>${
      data.today?.status === "NOT_STARTED" &&
      ["WEEKLY_OFF", "HOLIDAY"].includes(data.today?.calendar?.day_kind)
        ? "Ngày nghỉ theo lịch · công thường không mở"
        : {
        NOT_STARTED: "Chưa vào ca",
        WORKING: "Đã vào — chưa ra ca",
        COMPLETED: "Đã kết thúc ca",
      }[data.today?.status] || ""
    } · quét bằng ứng dụng tại văn phòng.</p><p class="muted">Muộn ${
      data.today?.lateMinutes || 0
    } phút · Về sớm ${
      data.today?.earlyMinutes || 0
    } phút. Không tự sinh khoản phạt.</p>${
      data.today?.calendar &&
      !["WEEKLY_OFF", "HOLIDAY"].includes(data.today.calendar.day_kind)
        ? `<p class="muted">Ca ${esc(data.today.calendar.shift_start)}–${esc(
            data.today.calendar.shift_end
          )} · Nghỉ ${esc(
            data.today.calendar.break_start || "chưa cấu hình"
          )}–${esc(data.today.calendar.break_end || "")}</p>`
        : ""
    }</section>
    <div class="section-head"><h2>Lượt quét đã lưu</h2><span class="muted">Giờ máy chủ · Vào ca vẫn hiện khi chưa có lượt Ra</span></div>
    ${
      (data.punches || []).length
        ? `<div class="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Thao tác / thời gian</th><th>Điểm / mạng</th></tr></thead><tbody>${data.punches
            .map(
              (p) =>
                `<tr><td>${esc(p.full_name)}</td><td>${esc(
                  {
                    IN: "Vào ca",
                    OUT: "Ra ca",
                    OT_IN: "Bắt đầu OT",
                    OT_OUT: "Kết thúc OT",
                  }[p.punch_type]
                )}<br>${fmt(p.recorded_at, true)}</td><td>${esc(
                  p.station_name
                )}<br>${esc(
                  {
                    MATCH: "Khớp mạng cấu hình",
                    MISMATCH: "Khác mạng — cần xác minh",
                    UNCONFIGURED: "Chưa cấu hình mạng",
                    UNVERIFIED: "Lượt cũ chưa kiểm tra mạng",
                  }[p.network_status]
                )}</td></tr>`
            )
            .join("")}</tbody></table></div>`
        : empty("Chưa có lượt quét trong kỳ.")
    }
    ${
      !data.calendar.length
        ? '<div class="error-box" style="margin-bottom:20px">Kỳ này chưa có lịch công. Người phụ trách đối soát công cần cấu hình trước khi ghi nhận và tính thu nhập.</div>'
        : ""
    }<div class="section-head"><h2>Bản ghi công</h2><span class="muted">Nguồn nhập có đối soát · Chưa kết nối máy vân tay</span></div>${
      data.attendance.length
        ? `<div class="table-wrap"><table><thead><tr><th>Nhân viên / ngày</th><th>Vào — ra</th><th>Công đề nghị</th><th>Nguồn / trạng thái</th><th>Đối soát</th></tr></thead><tbody>${data.attendance
            .map(
              (r) =>
                `<tr><td><strong>${esc(r.full_name)}</strong><small>${fmt(
                  r.work_date
                )}</small></td><td>${fmt(r.clock_in, true)}<br>${fmt(
                  r.clock_out,
                  true
                )}</td><td>${hours(r.regular_minutes)}<br><small>Muộn: ${
                  r.late_minutes || 0
                } phút · Về sớm: ${r.early_minutes || 0} phút</small>${
                  r.network_review_required
                    ? '<br><span class="pill red">Cần xác minh mạng</span>'
                    : ""
                }</td><td><small>${esc(r.source_reference)}</small><br>${pill(
                  r.status
                )}</td><td>${
                  r.status === "PENDING" && r.canReview
                    ? btn("review-attendance", "Kiểm tra", "small", r.id)
                    : `<small class="muted">${esc(
                        r.review_note || "Chờ người có quyền kiểm tra"
                      )}</small>`
                }</td></tr>`
            )
            .join("")}</tbody></table></div>`
        : empty("Chưa có bản ghi công trong kỳ.")
    }<div class="section-head" style="margin-top:28px"><h2>Đơn nghỉ, bổ sung công & tăng ca</h2></div>${
      data.requests.length
        ? `<div class="table-wrap"><table><thead><tr><th>Nhân viên / ngày</th><th>Loại đơn</th><th>Đề nghị</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${data.requests
            .map(
              (r) =>
                `<tr><td><strong>${esc(r.full_name)}</strong><small>${fmt(
                  r.work_date
                )}</small></td><td>${esc(
                  labels[r.request_type]
                )}<br><small>${esc(r.reason)}</small>${
                  r.exception_reason
                    ? `<p class="muted">Ngoại lệ OT: ${esc(
                        r.exception_reason
                      )}</p>`
                    : ""
                }${
                  r.approval_mode === "EXCEPTION"
                    ? '<span class="pill purple">OT ngoại lệ</span>'
                    : ""
                }</td><td>${hours(r.requested_minutes)}<br><small>${fmt(
                  r.starts_at,
                  true
                )} → ${fmt(r.ends_at, true)}</small></td><td>${pill(r.status)}${
                  r.actual_minutes != null
                    ? `<br><small>Thực tế: ${hours(r.actual_minutes)}</small>`
                    : ""
                }</td><td>${
                  r.canReview && r.status === "PENDING"
                    ? btn("review-time-request", "Xem xét", "small", r.id)
                    : r.canReview &&
                      r.status === "APPROVED" &&
                      r.request_type === "OVERTIME"
                    ? btn("confirm-overtime", "Xác nhận thực tế", "small", r.id)
                    : `<small class="muted">${esc(
                        r.review_note || "Chờ xử lý"
                      )}</small>`
                }</td></tr>`
            )
            .join("")}</tbody></table></div>`
        : empty("Chưa có đơn trong kỳ.")
    }<div class="columns" style="margin-top:24px"><section class="panel"><h3>Quỹ nghỉ hưởng lương đã xác nhận</h3>${
      data.balances
        .map(
          (b) =>
            `<div class="list-row"><div><strong>${esc(
              b.full_name
            )}</strong><p>${b.leave_year} · Quỹ được cấp: ${hours(
              b.allowance_minutes
            )}</p></div></div>`
        )
        .join("") ||
      '<p class="muted">Chưa có quỹ nghỉ được cấu hình trong phạm vi của bạn.</p>'
    }</section><section class="panel"><h3>Ghi nhận vắng đã xác minh</h3>${
      data.absences
        .map(
          (a) =>
            `<div class="list-row"><div><strong>${esc(a.full_name)} · ${fmt(
              a.work_date
            )}</strong><p>${hours(a.absent_minutes)} · ${esc(
              a.reason
            )}</p></div></div>`
        )
        .join("") || '<p class="muted">Chưa có ghi nhận vắng.</p>'
    }</section></div>`
  );
}
async function incomeView() {
  if (
    view === "payroll" &&
    !C.capabilities.includes("PAYROLL_MANAGE") &&
    !C.capabilities.includes("PAYROLL_APPROVE")
  )
    throw new Error("Bạn chưa có quyền đối soát thu nhập.");
  const rows = await api("/workplace/time/incomes?period=" + periodValue);
  current = { type: "incomes", data: rows };
  return (
    heading(
      view === "payroll" ? "Bảng tính lương" : "Thu nhập của tôi",
      "Thu nhập theo lương công việc và tăng ca đã xác nhận; chưa phải lương thực nhận sau bảo hiểm, thuế và các khoản khác.",
      view === "payroll" && C.capabilities.includes("PAYROLL_MANAGE")
        ? btn(
            "income-config",
            icon("plus") + " Khai báo mức lương kỳ",
            "primary"
          )
        : ""
    ) +
    `<div class="filters">${periodControl()}</div><div class="error-box" style="color:var(--muted);background:var(--panel);margin-bottom:22px">Bảng này không tự phạt tiền hoặc khấu trừ do lỗi công việc. Chỉ tăng ca đã xác nhận thực tế mới được tính. Chốt phiếu sẽ khóa dữ liệu công của nhân viên trong kỳ.</div>${
      rows
        .map((r) => {
          const c = r.calculation;
          return `<section class="panel"><div class="section-head"><div><h2>${esc(
            r.full_name
          )}</h2><small class="muted">${esc(r.period)} · ${fmt(
            r.employment_from
          )} — ${fmt(r.employment_to)}</small></div>${pill(
            r.status,
            r.status === "LOCKED" ? "Đã chốt đối soát" : "Tạm tính"
          )}</div>${
            c.ready
              ? `<div class="metrics" style="margin-top:20px;margin-bottom:18px">${metric(
                  "Lương công việc theo công",
                  money(c.basePay),
                  "money",
                  true
                )}${metric(
                  "Tiền tăng ca xác nhận",
                  money(c.overtimePay),
                  "clock"
                )}${metric(
                  "Tổng trước các khoản khác",
                  money(c.grossEstimate),
                  "money"
                )}${metric(
                  "Mục chưa đối soát",
                  c.pendingItems,
                  "file"
                )}</div><div class="meta-grid"><div><label>Mức lương công việc của tháng</label><p>${money(
                  r.monthly_work_pay
                )}</p></div><div><label>Công chuẩn cả tháng</label><p>${hours(
                  c.standardMinutes
                )}</p></div><div><label>Thời gian được tính hưởng</label><p>${hours(
                  c.paidMinutes
                )}</p></div><div><label>Tăng ca thực tế được xác nhận</label><p>${hours(
                  c.overtimeMinutes
                )}</p></div></div>${
                  Number(c.missingDays) > 0
                    ? `<p class="muted">${c.missingDays} ngày chưa có dữ liệu đối soát đủ; hệ thống chưa tự kết luận là nghỉ không lương.</p>`
                    : ""
                }<details style="margin-top:16px"><summary class="muted">Xem cách tính theo ngày</summary><div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Ngày</th><th>Loại ngày</th><th>Công hưởng</th><th>Tăng ca</th><th>Hệ số tăng ca</th></tr></thead><tbody>${c.days
                  .map(
                    (d) =>
                      `<tr><td>${fmt(d.date)}</td><td>${
                        {
                          NORMAL: "Ngày thường",
                          WEEKLY_OFF: "Nghỉ hằng tuần",
                          HOLIDAY: "Ngày lễ",
                        }[d.kind]
                      }</td><td>${hours(d.paidMinutes)}</td><td>${hours(
                        d.overtimeMinutes
                      )}</td><td>${d.factor}×</td></tr>`
                  )
                  .join("")}</tbody></table></div></details>`
              : `<p class="detail-copy">${esc(c.message)}</p>`
          }${view === "payroll" ? incomeActions(r) : ""}</section>`;
        })
        .join("") ||
      empty(
        "Chưa có thông số lương cho kỳ này. Người phụ trách thu nhập cần khai báo trước; hệ thống không tự đặt mức lương."
      )
    }`
  );
}
function incomeActions(r) {
  const cap = (c) => C.capabilities.includes(c),
    self = r.user_id === C.user.id;
  let html = `<p class="muted">Quy trình: ${
    {
      DRAFT: "Nháp",
      SUBMITTED: "Chờ kiểm tra",
      APPROVED: "Đã được duyệt",
      PUBLISHED: "Đã phát hành",
    }[r.approval_state] || r.approval_state
  } · ${esc(r.approval_reason || "")}</p><div class="row wrap">`;
  if (!self && r.approval_state === "DRAFT" && cap("PAYROLL_MANAGE"))
    html +=
      btn("edit-income", "Sửa thông số", "small", r.id) +
      btn("income-flow", "Gửi kiểm tra", "primary small", r.id + "|SUBMIT");
  if (
    !self &&
    r.approval_state === "SUBMITTED" &&
    cap("PAYROLL_APPROVE") &&
    C.user.id !== r.configured_by &&
    C.user.id !== r.submitted_by
  )
    html += btn("income-flow", "Phê duyệt", "primary small", r.id + "|APPROVE");
  if (
    !self &&
    ["SUBMITTED", "APPROVED"].includes(r.approval_state) &&
    cap("PAYROLL_APPROVE")
  )
    html += btn("income-flow", "Trả lại", "small", r.id + "|RETURN");
  if (
    !self &&
    r.approval_state === "APPROVED" &&
    cap("PAYROLL_MANAGE") &&
    r.approved_by !== C.user.id
  )
    html += btn("lock-income", "Phát hành phiếu", "primary small", r.id);
  if (!self && r.status === "LOCKED" && cap("PAYROLL_MANAGE"))
    html += btn("income-flow", "Điều chỉnh bổ sung", "small", r.id + "|ADJUST");
  html += "</div>";
  for (const a of r.adjustments || [])
    html += `<div class="list-row"><p>${money(a.amount)} · ${esc(
      a.reason
    )} · ${esc(a.status)}</p>${
      !self &&
      a.status === "PENDING" &&
      cap("PAYROLL_APPROVE") &&
      a.created_by !== C.user.id
        ? btn("income-adjustment", "Duyệt", "small", a.id + "|APPROVE") +
          btn("income-adjustment", "Từ chối", "small", a.id + "|REJECT")
        : ""
    }</div>`;
  return html;
}
function dateFields() {
  return (
    field("workDate", "Ngày", "date") +
    field("startTime", "Giờ bắt đầu / vào ca", "time") +
    field("endTime", "Giờ kết thúc / ra ca", "time")
  );
}
function toInterval(v) {
  return {
    workDate: v.workDate,
    startsAt: new Date(`${v.workDate}T${v.startTime}:00+07:00`).toISOString(),
    endsAt: new Date(`${v.workDate}T${v.endTime}:00+07:00`).toISOString(),
  };
}
function timeRequest() {
  form(
    "Gửi đơn công, nghỉ hoặc tăng ca",
    field("requestType", "Loại đơn", "select", {
      choices: [
        "TIME_CORRECTION",
        "LEAVE_PAID",
        "LEAVE_UNPAID",
        "OVERTIME",
      ].map((v) => ({ value: v, label: labels[v] })),
    }) +
      dateFields() +
      field("requestedMinutes", "Thời gian đề nghị (phút)", "number", {
        min: 1,
        max: 960,
      }) +
      field("reason", "Lý do và nội dung cần xem xét", "textarea", {
        max: 2000,
      }) +
      field(
        "exceptionReason",
        "Giải trình OT phát sinh sau giờ bắt đầu (nếu có)",
        "textarea",
        { required: false, max: 2000 }
      ),
    (v) =>
      api("/workplace/time/requests", {
        method: "POST",
        body: {
          ...toInterval(v),
          requestType: v.requestType,
          requestedMinutes: Number(v.requestedMinutes),
          reason: v.reason,
          exceptionReason: v.exceptionReason || null,
        },
      }),
    {
      intro:
        "Mỗi đơn cho một ngày. Bản đầu hỗ trợ ca ban ngày 06:00–22:00; đơn tăng ca được duyệt vẫn cần xác nhận thời gian thực tế.",
    }
  );
}
function calendarConfig() {
  form(
    "Cấu hình lịch công của kỳ",
    field("period", "Tháng", "month", { value: periodValue }) +
      field("weekdays", "Ngày làm việc trong tuần", "select", {
        choices: [
          { value: "1,2,3,4,5", label: "Thứ Hai đến thứ Sáu" },
          { value: "1,2,3,4,5,6", label: "Thứ Hai đến thứ Bảy" },
        ],
      }) +
      field("shiftStart", "Giờ bắt đầu ca", "time", {
        value: current?.data?.calendar?.[0]?.shift_start?.slice(0, 5),
      }) +
      field("shiftEnd", "Giờ kết thúc ca", "time", {
        value: current?.data?.calendar?.[0]?.shift_end?.slice(0, 5),
      }) +
      field("breakStart", "Bắt đầu nghỉ giữa ca", "time", {
        value:
          current?.data?.calendar?.[0]?.break_start?.slice(0, 5) || "11:30",
        required: false,
      }) +
      field("breakEnd", "Kết thúc nghỉ giữa ca", "time", {
        value: current?.data?.calendar?.[0]?.break_end?.slice(0, 5) || "12:30",
        required: false,
      }) +
      field(
        "lateGraceMinutes",
        "Dung sai báo đi muộn (phút, không cộng thêm công)",
        "number",
        { value: 0, min: 0, max: 120 }
      ) +
      field("breakMinutes", "Nghỉ giữa ca không tính công (phút)", "number", {
        value: current?.data?.calendar?.[0]?.break_minutes ?? 60,
        min: 0,
        max: 480,
      }) +
      field(
        "holidays",
        "Ngày lễ/nghỉ hưởng lương (YYYY-MM-DD, cách nhau bằng dấu phẩy)",
        "text",
        { required: false }
      ),
    (v) =>
      api("/workplace/time/calendar", {
        method: "PUT",
        body: {
          ...v,
          weekdays: v.weekdays.split(",").map(Number),
          breakMinutes: Number(v.breakMinutes),
          lateGraceMinutes: Number(v.lateGraceMinutes),
          breakStart: v.breakStart || null,
          breakEnd: v.breakEnd || null,
          holidays: v.holidays.trim()
            ? v.holidays.split(",").map((s) => s.trim())
            : [],
        },
      }),
    {
      intro:
        "Cấu hình theo lịch doanh nghiệp đã chọn. Khi đã có công hoặc đơn trong tháng, lịch được giữ để tránh thay đổi cách hiểu dữ liệu cũ.",
    }
  );
}
async function correctionFor() {
  const list = await api("/workplace/time/people");
  form(
    "Đề nghị điều chỉnh công thay nhân viên",
    field("userId", "Nhân viên", "select", {
      choices: list
        .filter((u) => u.id !== C.user.id)
        .map((u) => ({ value: u.id, label: u.full_name })),
    }) +
      dateFields() +
      field("requestedMinutes", "Số phút công đề nghị", "number", {
        min: 1,
        max: 480,
      }) +
      field("reason", "Căn cứ và nguồn đối chiếu", "textarea"),
    (v) =>
      api("/workplace/time/corrections", {
        method: "POST",
        body: {
          ...v,
          ...toInterval(v),
          requestedMinutes: Number(v.requestedMinutes),
        },
      }),
    {
      intro:
        "Khoảng công phải trước mốc kết thúc đã xác nhận. Người tạo đơn không tự duyệt.",
    }
  );
}
async function importTime() {
  const eligiblePeople = await api("/workplace/time/people");
  form(
    "Nhập một bản ghi công",
    field("userId", "Nhân viên", "select", {
      choices: eligiblePeople.map((u) => ({ value: u.id, label: u.full_name })),
    }) +
      dateFields() +
      field("regularMinutes", "Số phút công thường theo nguồn", "number", {
        min: 0,
        max: 480,
      }) +
      field("sourceReference", "Nguồn / mã bản ghi để đối chiếu", "text", {
        max: 255,
      }),
    (v) => {
      const t = toInterval(v);
      return api("/workplace/time/imports", {
        method: "POST",
        body: [
          {
            userId: v.userId,
            workDate: v.workDate,
            clockIn: t.startsAt,
            clockOut: t.endsAt,
            regularMinutes: Number(v.regularMinutes),
            sourceReference: v.sourceReference,
          },
        ],
      });
    },
    {
      intro:
        "Nhập từ chứng từ hoặc dữ liệu xuất của máy chấm công. Đây chưa phải kết nối tự động với thiết bị. Bản ghi vẫn cần người khác đối soát.",
    }
  );
}
function reviewTime(action, id) {
  const record = action === "review-attendance";
  const r = current.data[record ? "attendance" : "requests"].find(
    (x) => x.id === id
  );
  const confirm = action === "confirm-overtime";
  form(
    confirm
      ? "Xác nhận tăng ca thực tế"
      : "Kiểm tra " + (record ? "bản ghi công" : "đơn nhân viên"),
    `<p class="muted">${esc(r.full_name)} · ${fmt(r.work_date)}${
      r.reason ? " · " + esc(r.reason) : ""
    }</p>` +
      (confirm
        ? field("actualMinutes", "Số phút tăng ca thực tế", "number", {
            value: r.requested_minutes,
            min: 0,
            max: r.requested_minutes,
          })
        : field("action", "Kết quả kiểm tra", "select", {
            choices: [
              { value: "APPROVE", label: "Đồng ý" },
              { value: "REJECT", label: "Từ chối, cần giải trình" },
            ],
          })) +
      field("reason", "Nhận xét / căn cứ xác nhận", "textarea", { max: 2000 }) +
      ((record && r.network_review_required) || confirm
        ? field(
            "acknowledgeNetwork",
            "Đã xác minh cảnh báo mạng của lượt chấm?",
            "select",
            {
              choices: [
                { value: "false", label: "Chưa xác minh" },
                {
                  value: "true",
                  label: "Đã kiểm tra thực tế, ghi căn cứ ở trên",
                },
              ],
            }
          )
        : "") +
      (!record && r.request_type === "OVERTIME" && !confirm
        ? field(
            "exceptionReason",
            "Căn cứ duyệt OT ngoại lệ sau giờ bắt đầu (nếu có)",
            "textarea",
            { required: false, max: 2000 }
          )
        : ""),
    (v) =>
      api(`/workplace/time/${record ? "records" : "requests"}/${id}/review`, {
        method: "POST",
        body: {
          action: confirm ? "CONFIRM" : v.action,
          actualMinutes: confirm ? Number(v.actualMinutes) : null,
          reason: v.reason,
          version: r.version,
          acknowledgeNetwork: v.acknowledgeNetwork === "true",
          exceptionReason: v.exceptionReason || null,
        },
      }),
    {
      intro: confirm
        ? "Khoảng tăng ca phải nằm trong bản ghi công đã được xác nhận. Không cộng tiền chỉ dựa trên đơn đăng ký."
        : "",
    }
  );
}
async function absenceForm() {
  const eligiblePeople = await api("/workplace/time/people");
  const candidates = eligiblePeople.filter((u) =>
    canReview(u.id, u.department_id)
  );
  form(
    "Ghi nhận vắng sau xác minh",
    field("userId", "Nhân viên", "select", {
      choices: candidates.map((u) => ({ value: u.id, label: u.full_name })),
    }) +
      field("workDate", "Ngày đã kết thúc", "date") +
      field("absentMinutes", "Số phút vắng được xác minh", "number", {
        min: 1,
        max: 480,
      }) +
      field("reason", "Căn cứ và kết quả xác minh", "textarea", { max: 2000 }),
    (v) =>
      api("/workplace/time/absences", {
        method: "POST",
        body: { ...v, absentMinutes: Number(v.absentMinutes) },
      }),
    {
      intro:
        "Không dùng việc thiếu lượt quét để tự kết luận vắng. Nhân viên được thông báo và có thể gửi đề nghị kiểm tra lại.",
    }
  );
}
async function balanceForm() {
  const eligiblePeople = await api("/workplace/time/people");
  form(
    "Khai báo quỹ nghỉ hưởng lương",
    field("userId", "Nhân viên", "select", {
      choices: eligiblePeople
        .filter((u) => u.id !== C.user.id)
        .map((u) => ({ value: u.id, label: u.full_name })),
    }) +
      field("year", "Năm", "number", {
        value: periodValue.slice(0, 4),
        min: 2000,
        max: 2100,
      }) +
      field(
        "allowanceMinutes",
        "Tổng quỹ nghỉ được xác nhận (phút)",
        "number",
        { min: 0, max: 175680 }
      ) +
      field("reason", "Căn cứ xác định quỹ nghỉ", "textarea", { max: 2000 }),
    (v) =>
      api("/workplace/time/leave-balances", {
        method: "PUT",
        body: {
          ...v,
          year: Number(v.year),
          allowanceMinutes: Number(v.allowanceMinutes),
        },
      }),
    {
      intro:
        "Nhập từ hồ sơ được xác nhận; hệ thống không tự cấp số ngày phép khi thiếu thông tin hợp đồng.",
    }
  );
}
async function incomeConfig(id) {
  const old = id ? current.data.find((x) => x.id === id) : null;
  const people = await api("/workplace/time/people");
  const now = periodValue + "-01",
    end = new Date(
      Number(periodValue.slice(0, 4)),
      Number(periodValue.slice(5, 7)),
      0
    ).getDate();
  form(
    old ? "Sửa thông số thu nhập" : "Khai báo mức lương công việc",
    field("userId", "Nhân viên", "select", {
      value: old?.user_id,
      choices: people.map((u) => ({ value: u.id, label: u.full_name })),
    }) +
      field("period", "Tháng", "month", { value: old?.period || periodValue }) +
      field("monthlyWorkPay", "Mức lương công việc tháng (đồng)", "number", {
        value: old?.monthly_work_pay,
        min: 1,
        max: 1000000000000,
      }) +
      field(
        "employmentFrom",
        "Ngày bắt đầu được tính hưởng trong tháng",
        "date",
        { value: old?.employment_from || now }
      ) +
      field("employmentTo", "Ngày cuối được tính hưởng trong tháng", "date", {
        value: old?.employment_to || periodValue + "-" + end,
      }),
    (v) =>
      api("/workplace/time/incomes", {
        method: "PUT",
        body: {
          ...v,
          monthlyWorkPay: Number(v.monthlyWorkPay),
          version: old?.version,
        },
      }),
    {
      intro:
        "Nhập mức lương công việc làm cơ sở tính công/tăng ca từ hồ sơ đã xác nhận. Chưa bao gồm phụ cấp, bảo hiểm, thuế hoặc bồi thường.",
    }
  );
  if (old) {
    $("#f-userId").disabled = true;
    $("#f-period").readOnly = true;
    const f = $("#action-form");
    f.addEventListener("formdata", (e) =>
      e.formData.set("userId", old.user_id)
    );
  }
}
function parseCsv(text) {
  const rows = [];
  let row = [],
    value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(value);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      value = "";
    } else value += c;
  }
  if (quoted) throw new Error("CSV có dấu nháy chưa đóng.");
  row.push(value);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
function csvImport() {
  form(
    "Nhập CSV bản ghi công",
    `<p class="muted">Cột bắt buộc: userId,workDate,clockIn,clockOut,regularMinutes,sourceReference. Giờ vào/ra theo ISO 8601 có múi giờ. Tối đa 200 dòng, nhập nguyên lượt hoặc không lưu.</p>` +
      field("file", "Tệp CSV", "file"),
    async (v, f) => {
      const file = f.querySelector('[name="file"]').files[0];
      if (file.size > 1024 * 1024) throw new Error("CSV tối đa 1 MB.");
      const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
      const columns = [
        "userId",
        "workDate",
        "clockIn",
        "clockOut",
        "regularMinutes",
        "sourceReference",
      ];
      if (!rows.length || rows[0].join(",") !== columns.join(","))
        throw new Error("Tên hoặc thứ tự cột CSV chưa đúng.");
      const data = rows.slice(1).map((r) => {
        if (r.length !== 6) throw new Error("Mỗi dòng phải đủ 6 cột.");
        const obj = Object.fromEntries(columns.map((c, i) => [c, r[i].trim()]));
        obj.regularMinutes = Number(obj.regularMinutes);
        return obj;
      });
      await api("/workplace/time/imports", { method: "POST", body: data });
    },
    { submit: "Nhập và chờ đối soát" }
  );
}

document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action,
    id = b.dataset.id;
  try {
    if (await peopleUI.action(a, id)) return;
    if (a === "theme") {
      theme = theme === "dark" ? "light" : "dark";
      localStorage.setItem("worksphere.theme", theme);
      applyTheme();
    } else if (a === "sidebar") {
      if (matchMedia("(max-width:760px)").matches) {
        document.body.classList.toggle("mobile-open");
        b.setAttribute(
          "aria-expanded",
          String(document.body.classList.contains("mobile-open"))
        );
      } else {
        collapsed = !collapsed;
        localStorage.setItem(
          "worksphere.sidebar",
          collapsed ? "collapsed" : "open"
        );
        document.body.classList.toggle("sidebar-collapsed", collapsed);
        b.setAttribute("aria-expanded", String(!collapsed));
      }
      syncNavigationState();
    } else if (a === "close") {
      dialog.close();
      dialog.innerHTML = "";
    } else if (a === "logout") {
      authEpoch++;
      routeSerial++;
      try {
        await logout();
      } finally {
        loginView();
      }
    } else if (a === "reload") {
      if (!(await loadContext())) return;
      await route();
    } else if (a === "new-work") newWork();
    else if (a === "change-period") {
      periodValue = $("#period-select").value;
      if (!periodValue) throw new Error("Chọn kỳ công.");
      await route();
    } else if (a === "time-request") timeRequest();
    else if (a === "calendar-config") calendarConfig();
    else if (a === "income-flow") {
      const [key, action] = id.split("|");
      const row = current.data.find((r) => r.id === key);
      form(
        "Bảng tính lương · " +
          ({
            SUBMIT: "Gửi kiểm tra",
            APPROVE: "Phê duyệt",
            RETURN: "Trả lại",
            ADJUST: "Điều chỉnh bổ sung",
          }[action] || action),
        field("reason", "Căn cứ / giải thích", "textarea", { max: 2000 }) +
          (action === "ADJUST"
            ? field("amount", "Chênh lệch (không dùng làm tiền phạt)", "number")
            : ""),
        (v) =>
          api("/workplace/time/incomes/" + key + "/commands", {
            method: "POST",
            body: {
              ...v,
              amount: v.amount ? Number(v.amount) : null,
              action,
              version: row.version,
            },
          })
      );
    } else if (a === "income-adjustment") {
      const [key, action] = id.split("|");
      const row = current.data
        .flatMap((r) => r.adjustments || [])
        .find((r) => r.id === key);
      form("Xem xét điều chỉnh", field("reason", "Căn cứ", "textarea"), (v) =>
        api("/workplace/time/adjustments/" + key + "/commands", {
          method: "POST",
          body: { ...v, action, version: row.version },
        })
      );
    } else if (a === "correction-for") await correctionFor();
    else if (a === "time-import") await importTime();
    else if (a === "csv-import") csvImport();
    else if (a === "leave-balance") await balanceForm();
    else if (a === "confirm-absence") await absenceForm();
    else if (
      ["review-attendance", "review-time-request", "confirm-overtime"].includes(
        a
      )
    )
      reviewTime(a, id);
    else if (a === "income-config" || a === "edit-income")
      await incomeConfig(id);
    else if (a === "lock-income") {
      const row = current.data.find((r) => r.id === id);
      form(
        "Phát hành phiếu đã duyệt · " + row.full_name,
        field("reason", "Căn cứ kiểm tra và chốt", "textarea", { max: 2000 }),
        (v) =>
          api("/workplace/time/incomes/" + id + "/lock", {
            method: "POST",
            body: { ...v, version: row.version },
          }),
        {
          intro:
            "Chỉ chốt kỳ đã kết thúc và đã đối soát đủ. Sau khi chốt, dữ liệu nguồn của nhân viên trong tháng được khóa. Đây không phải thao tác chuyển tiền.",
        }
      );
    } else if (a === "work-command") workCommand(id);
    else if (a === "work-comment") workCommand("COMMENT");
    else if (a === "new-request") requestForm();
    else if (a === "edit-request") requestForm(true);
    else if (a === "request-command") requestCommand(id);
    else if (a === "request-comment") requestComment();
    else if (a === "work-filter") {
      filter = id;
      $("#main").innerHTML = workList(view === "handover");
    } else if (a.startsWith("week-")) {
      weekOffset =
        a === "week-today" ? 0 : weekOffset + (a === "week-next" ? 1 : -1);
      $("#main").innerHTML = calendar();
    } else if (a === "request-search") {
      search = $("#request-search").value;
      page = 0;
      await route();
    } else if (a === "page-prev" || a === "page-next") {
      page += a === "page-next" ? 1 : -1;
      await route();
    } else if (a === "new-department") await departmentForm();
    else if (a === "edit-department") await departmentForm(id);
    else if (a === "new-account") accountForm();
    else if (a === "edit-account") accountForm(id);
    else if (
      a === "lock-account" ||
      a === "unlock-account" ||
      a === "disable-account"
    )
      accountState(
        id,
        a === "lock-account"
          ? "LOCK"
          : a === "unlock-account"
          ? "UNLOCK"
          : "DISABLE"
      );
    else if (a === "route-category") {
      const c = current.data.find((x) => x.id === id);
      form(
        "Phòng tiếp nhận · " + c.name,
        field("departmentId", "Phòng ban", "select", {
          value: c.receiving_department_id,
          choices: departmentsOptions(),
        }),
        (v) =>
          api("/workplace/categories/" + id + "/route", {
            method: "PUT",
            body: { departmentId: v.departmentId, version: c.version },
          })
      );
    } else if (a === "new-category") {
      form(
        "Thêm loại yêu cầu",
        field("code", "Mã loại", "text", { max: 50 }) +
          field("name", "Tên loại yêu cầu", "text", { max: 150 }) +
          field("departmentId", "Phòng tiếp nhận", "select", {
            choices: departmentsOptions(),
          }),
        async (v) => {
          const c = await api("/admin/service-categories", {
            method: "POST",
            body: {
              code: v.code,
              name: v.name,
              defaultPriority: "MEDIUM",
              active: true,
            },
          });
          await api("/workplace/categories/" + c.id + "/route", {
            method: "PUT",
            body: { departmentId: v.departmentId, version: c.version },
          });
        }
      );
    } else if (a === "notice") {
      const n = notices.find((x) => x.id === id);
      await api("/workplace/notices/" + id + "/read", { method: "PUT" });
      n.read_at = new Date().toISOString();
      if (n.reference_id && n.reference_type === "WORK")
        location.hash = "work/" + n.reference_id;
      else if (["TIME", "ATTENDANCE"].includes(n.reference_type))
        location.hash = "time";
      else if (n.reference_type === "INCOME")
        location.hash =
          C.capabilities.includes("PAYROLL_MANAGE") ||
          C.capabilities.includes("PAYROLL_APPROVE")
            ? "payroll"
            : "profile";
      else if (n.reference_type === "PERSONNEL") location.hash = "personnel";
      else if (n.reference_type === "ACCESS") location.hash = "access";
      else if (n.reference_type === "DELEGATION") location.hash = "delegations";
      else if (
        n.reference_id &&
        ["REQUEST", "SERVICE_REQUEST"].includes(n.reference_type)
      )
        location.hash = "request/" + n.reference_id;
      else await route();
    } else if (a === "change-password") {
      form(
        "Đổi mật khẩu",
        field("currentPassword", "Mật khẩu hiện tại", "password") +
          field("newPassword", "Mật khẩu mới", "password", {
            min: 12,
            max: 128,
          }) +
          field("confirmPassword", "Nhập lại mật khẩu mới", "password", {
            min: 12,
            max: 128,
          }),
        async (v) => {
          if (v.newPassword !== v.confirmPassword)
            throw new Error("Hai mật khẩu mới chưa khớp.");
          await api("/me/password", { method: "PUT", body: v });
          clearSession();
          loginView("Mật khẩu đã đổi. Vui lòng đăng nhập lại.");
        }
      );
    } else if (a === "logout-all") {
      form(
        "Đăng xuất mọi thiết bị",
        '<p class="muted">Kết thúc cả phiên hiện tại và các phiên đang dùng ở thiết bị khác?</p>',
        async () => {
          await api("/auth/logout-all", { method: "POST" });
          clearSession();
          loginView();
        }
      );
    } else if (a === "download") {
      const f = current.data.attachments.find((x) => x.id === id);
      const blob = await download(`/api/v1/files/${id}/download`);
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = f.originalName || f.original_name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (err) {
    toast(err.message, true);
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "work-search") {
    search = e.target.value;
    const h = workList(view === "handover"),
      tmp = document.createElement("div");
    tmp.innerHTML = h;
    $("#work-cards").innerHTML = tmp.querySelector("#work-cards").innerHTML;
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "directory-query")
    document.querySelector('[data-action="p-directory-search"]').click();
  if (e.key === "Enter" && e.target.id === "request-search") {
    $('[data-action="request-search"]').click();
  }
});
window.addEventListener("hashchange", () => {
  filter = "all";
  search = "";
  page = 0;
  const [publicView, token] = location.hash.slice(1).split("/");
  if (["forgot", "reset", "activate"].includes(publicView))
    recoveryView(publicView, token);
  else if (!C) loginView();
  else route();
});
window.addEventListener("session-ended", () =>
  loginView("Phiên đã kết thúc. Vui lòng đăng nhập lại.")
);
const peopleUI = createPeopleUI({
  api,
  esc,
  field,
  form,
  btn,
  heading,
  fmt,
  parseCsv,
  context: () => C,
  route,
  endSession: () => {
    clearSession();
    loginView("Phiên đã thu hồi. Vui lòng đăng nhập lại.");
  },
  showCodes: (codes) => {
    dialog.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">Lưu mã dự phòng ngay</h2><button class="icon-btn" data-action="close" aria-label="Đóng">×</button></div><div class="dialog-body"><p>Mỗi mã chỉ dùng một lần. Lưu ở nơi riêng an toàn; hệ thống không hiển thị lại.</p><pre class="secret-key">${esc(
      codes.join("\n")
    )}</pre></div>`;
    dialog.showModal();
  },
});
function recoveryView(mode, token) {
  clearSession();
  loginView();
  const box = document.querySelector(".login-form");
  const activate = mode === "activate",
    forgot = mode === "forgot";
  box.innerHTML = `<span class="eyebrow">KHÔI PHỤC & KÍCH HOẠT</span><h2>${
    forgot
      ? "Quên mật khẩu"
      : activate
      ? "Kích hoạt tài khoản"
      : "Đặt mật khẩu mới"
  }</h2><p>${
    forgot
      ? "Nhận liên kết qua email đã xác minh."
      : "Liên kết có hạn và chỉ sử dụng một lần."
  }</p><form id="recovery-form">${
    forgot
      ? field("email", "Email đã xác minh", "email")
      : (activate
          ? field("username", "Tên đăng nhập muốn dùng", "text", {
              required: false,
              max: 50,
            }) +
            field("fullName", "Họ tên", "text", { max: 150 }) +
            field("phoneNumber", "Số liên hệ", "tel", {
              required: false,
              max: 20,
            })
          : "") +
        field("password", "Mật khẩu mới (ít nhất 12 ký tự, tối đa 72 byte UTF-8)", "password", {
          max: 128,
        }) +
        field("confirmPassword", "Nhập lại mật khẩu", "password", { max: 128 })
  }<div class="form-error" role="alert"></div><button class="btn primary" type="submit">${
    forgot ? "Gửi liên kết" : "Xác nhận"
  }</button></form><p class="login-foot"><a href="#login">Về đăng nhập</a></p>`;
  if (!forgot && /^[A-Za-z0-9_-]{43}$/.test(token || "")) {
    const openApp = document.createElement("a");
    openApp.className = "btn secondary";
    openApp.textContent = "Mở trong ứng dụng Android";
    openApp.href = `worksphere://${activate ? "activate" : "reset"}/${token}`;
    openApp.rel = "noreferrer";
    box.append(openApp);
  }
  document
    .querySelector("#recovery-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.currentTarget,
        b = f.querySelector("button");
      b.disabled = true;
      try {
        const v = Object.fromEntries(new FormData(f));
        if (forgot) {
          await api("/auth/forgot-password", { method: "POST", body: v });
          box.querySelector("p").textContent =
            "Nếu tài khoản đủ điều kiện, thư khôi phục sẽ được gửi. Hãy kiểm tra hộp thư.";
        } else {
          await api(activate ? "/auth/activate" : "/auth/reset-password", {
            method: "POST",
            body: activate
              ? { ...v, token }
              : {
                  resetToken: token,
                  newPassword: v.password,
                  confirmPassword: v.confirmPassword,
                },
          });
          location.hash = "login";
          loginView("Đã cập nhật. Vui lòng đăng nhập bằng mật khẩu mới.");
        }
      } catch (err) {
        f.querySelector(".form-error").textContent = err.message;
      } finally {
        b.disabled = false;
      }
    });
}
applyTheme();
if (await restore()) {
  try {
    if (await loadContext()) await route();
  } catch (e) {
    loginView(e.message);
  }
} else {
  const [mode, token] = location.hash.slice(1).split("/");
  if (["forgot", "reset", "activate"].includes(mode)) recoveryView(mode, token);
  else loginView();
}
