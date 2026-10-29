/**
 * WorkSphere Mobile - Visual Prototype Interactive Logic
 * Standardized against design/01_USER_FLOW.md, design/02_SCREEN_INVENTORY.md,
 * and design/07_UI_STATE_MATRIX.md.
 */

// Application State
const state = {
  currentScreen: "CORE-02", // Default to Dashboard for review
  currentUIState: "SUCCESS", // Default UI state
  activeTab: "dashboard",
  selectedProjectId: "prj-001",
  viewport: "411x914", // "411x914" or "360x800"
  offline: false,
  activeModal: null, // "change-status", "add-member", "optimistic-lock", "logout-confirm", "final-pm-alert"
  toastMessage: null,
  toastTimeout: null
};

// Screen Metadata Catalog for Review Mode
const SCREEN_METADATA = {
  "CORE-01": {
    screenId: "SCR-AUTH-02",
    screenName: "Login Screen",
    module: "Authentication",
    backendReadiness: "IMPLEMENTED_AND_TESTED",
    apiEndpoint: "POST /api/v1/auth/login",
    requiredPermission: "PUBLIC"
  },
  "CORE-02": {
    screenId: "SCR-MAIN-01",
    screenName: "Dashboard Screen",
    module: "Main Application",
    backendReadiness: "BLOCKED_BY_GAP",
    apiEndpoint: "GET /api/v1/dashboard/me",
    requiredPermission: "AUTHENTICATED",
    gapNotice: "DASHBOARD_AGGREGATED_API_GAP: API chưa có controller backend"
  },
  "CORE-03": {
    screenId: "SCR-PRJ-01",
    screenName: "Project List Screen",
    module: "Project",
    backendReadiness: "IMPLEMENTED_AND_TESTED",
    apiEndpoint: "GET /api/v1/projects",
    requiredPermission: "PROJECT_READ"
  },
  "CORE-04": {
    screenId: "SCR-PRJ-02",
    screenName: "Project Detail Screen",
    module: "Project",
    backendReadiness: "IMPLEMENTED_AND_TESTED",
    apiEndpoint: "GET /api/v1/projects/{projectId}",
    requiredPermission: "PROJECT_READ"
  },
  "CORE-05": {
    screenId: "SCR-PRJ-05",
    screenName: "Change Status Bottom Sheet",
    module: "Project",
    backendReadiness: "IMPLEMENTED_AND_TESTED",
    apiEndpoint: "PUT /api/v1/projects/{projectId}/status",
    requiredPermission: "PROJECT_UPDATE"
  },
  "CORE-06": {
    screenId: "SCR-PRJ-06",
    screenName: "Project Member List Screen",
    module: "Project",
    backendReadiness: "IMPLEMENTED_AND_TESTED",
    apiEndpoint: "GET /api/v1/projects/{projectId}/members",
    requiredPermission: "PROJECT_READ"
  },
  "CORE-07": {
    screenId: "SCR-PRJ-08",
    screenName: "Milestone List Screen",
    module: "Project",
    backendReadiness: "IMPLEMENTED_AND_TESTED",
    apiEndpoint: "GET /api/v1/projects/{projectId}/milestones",
    requiredPermission: "PROJECT_READ"
  },
  "CORE-08": {
    screenId: "SCR-PRJ-09",
    screenName: "Create Milestone Screen",
    module: "Project",
    backendReadiness: "IMPLEMENTED_AND_TESTED",
    apiEndpoint: "POST /api/v1/projects/{projectId}/milestones",
    requiredPermission: "PROJECT_UPDATE"
  },
  "CORE-09": {
    screenId: "SCR-ACC-01",
    screenName: "Profile Screen",
    module: "Account",
    backendReadiness: "IMPLEMENTED_AND_TESTED",
    apiEndpoint: "GET /api/v1/me",
    requiredPermission: "AUTHENTICATED"
  },
  "CORE-10": {
    screenId: "SCR-ACC-02",
    screenName: "Change Password Screen",
    module: "Account",
    backendReadiness: "IMPLEMENTED_NOT_FULLY_TESTED",
    apiEndpoint: "PUT /api/v1/me/password",
    requiredPermission: "AUTHENTICATED"
  },
  "CORE-11": {
    screenId: "SCR-MAIN-03",
    screenName: "More Menu Screen",
    module: "Main Application",
    backendReadiness: "CLIENT_LAYOUT",
    apiEndpoint: "None (Client navigation)",
    requiredPermission: "AUTHENTICATED"
  },
  "CORE-12": {
    screenId: "SCR-ACC-04",
    screenName: "Logout Confirm Dialog",
    module: "Account",
    backendReadiness: "IMPLEMENTED_AND_TESTED",
    apiEndpoint: "POST /api/v1/auth/logout",
    requiredPermission: "AUTHENTICATED"
  }
};

// SVG Icon Helper
function getIcon(name, size = 18, color = "currentColor") {
  const icons = {
    arrowLeft: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
    search: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    filter: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`,
    plus: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    checkCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    alertCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    alertTriangle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    clock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    calendar: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    users: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    flag: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`,
    moreVertical: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>`,
    eye: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    eyeOff: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
    close: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    home: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    folder: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    checkSquare: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
    helpCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    menu: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    lock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    logOut: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
    refresh: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
    wifiOff: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
    shieldAlert: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    edit: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    trash: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    chevronRight: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
  };
  return icons[name] || "";
}

// Render Status Badge with Dual-Cue
function renderStatusBadge(statusKey) {
  const cfg = SAMPLE_DATA.statusConfig[statusKey] || { label: statusKey, color: "#64748B", bg: "#F1F5F9", icon: "helpCircle" };
  return `
    <span class="status-badge" style="color: ${cfg.color}; background: ${cfg.bg};" aria-label="Trạng thái: ${cfg.label}">
      ${getIcon(cfg.icon === "play-circle" ? "clock" : cfg.icon === "pause-circle" ? "clock" : cfg.icon === "check-circle" ? "checkCircle" : cfg.icon === "x-circle" ? "close" : "alertCircle", 12, cfg.color)}
      <span>${cfg.label}</span>
    </span>
  `;
}

// Render Priority Badge with Dual-Cue
function renderPriorityBadge(priorityKey) {
  const cfg = SAMPLE_DATA.priorityConfig[priorityKey] || { label: priorityKey, color: "#64748B", bg: "#F1F5F9" };
  return `
    <span class="priority-badge" style="color: ${cfg.color}; background: ${cfg.bg};" aria-label="Độ ưu tiên: ${cfg.label}">
      <span>${cfg.label}</span>
    </span>
  `;
}

// Show Toast
function showToast(msg) {
  const sb = document.getElementById("prototype-snackbar");
  const msgEl = document.getElementById("snackbar-message");
  if (!sb || !msgEl) return;
  msgEl.innerText = msg;
  sb.classList.add("active");
  if (state.toastTimeout) clearTimeout(state.toastTimeout);
  state.toastTimeout = setTimeout(() => {
    sb.classList.remove("active");
  }, 3000);
}

// Set Active Modal
function openModal(modalName) {
  state.activeModal = modalName;
  renderModals();
}

function closeModal() {
  state.activeModal = null;
  renderModals();
}

// Main Navigation Switcher
function navigateTo(screenKey) {
  state.currentScreen = screenKey;
  if (screenKey === "CORE-02") state.activeTab = "dashboard";
  else if (screenKey === "CORE-03") state.activeTab = "projects";
  else if (screenKey === "CORE-11" || screenKey === "CORE-09" || screenKey === "CORE-10") state.activeTab = "more";
  renderReviewPanel();
  renderScreen();
}

function setUIState(uiStateKey) {
  state.currentUIState = uiStateKey;
  renderReviewPanel();
  renderScreen();
}

function setViewport(sizeKey) {
  state.viewport = sizeKey;
  const frame = document.getElementById("device-frame");
  const indicator = document.getElementById("viewport-indicator-text");
  if (sizeKey === "360x800") {
    frame.style.setProperty("--viewport-width", "360px");
    frame.style.setProperty("--viewport-height", "800px");
    indicator.innerText = "Viewport: 360 × 800 dp (Android Small)";
  } else {
    frame.style.setProperty("--viewport-width", "411px");
    frame.style.setProperty("--viewport-height", "914px");
    indicator.innerText = "Viewport: 411 × 914 dp (emulator-5554 / Android 15)";
  }
  renderReviewPanel();
}

// --------------------------------------------------------------------------
// SCREEN RENDERERS
// --------------------------------------------------------------------------

// 1. CORE-01: Login Screen (SCR-AUTH-02)
function renderLoginScreen() {
  return `
    <div class="screen-scroll-view" style="justify-content: center; padding: 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 72px; height: 72px; background: var(--color-primary); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; color: #fff; margin-bottom: 16px; box-shadow: var(--elevation-2);">
          ${getIcon("folder", 36, "#fff")}
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: var(--color-primary);">WorkSphere</h1>
        <p style="font-size: 13px; color: var(--color-text-secondary); margin-top: 4px;">Ứng dụng quản lý công việc và tài sản nội bộ</p>
        <span style="display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 600; color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 4px;">DỮ LIỆU MINH HỌA</span>
      </div>

      ${state.currentUIState === "VALIDATION_ERROR" ? `
        <div class="notice-banner danger" style="margin-bottom: 16px;">
          ${getIcon("alertCircle", 16, "#dc2626")}
          <span>Vui lòng kiểm tra lại thông tin đăng nhập.</span>
        </div>
      ` : ""}

      <form id="login-form" onsubmit="event.preventDefault(); navigateTo('CORE-02');" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label" for="username">Tên đăng nhập hoặc Email <span class="required">*</span></label>
          <div class="input-container">
            <input class="app-input ${state.currentUIState === 'VALIDATION_ERROR' ? 'error' : ''}" id="username" type="text" value="nguyenan" placeholder="Nhập username/email" required ${state.currentUIState === 'SUBMITTING' ? 'disabled' : ''}>
          </div>
          ${state.currentUIState === 'VALIDATION_ERROR' ? `<span class="form-error-text">${getIcon('alertCircle', 12, '#dc2626')} Tên đăng nhập không được để trống</span>` : ''}
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Mật khẩu <span class="required">*</span></label>
          <div class="input-container">
            <input class="app-input" id="password" type="password" value="Password123!" placeholder="Nhập mật khẩu" required ${state.currentUIState === 'SUBMITTING' ? 'disabled' : ''}>
            <button type="button" class="input-suffix-btn" aria-label="Hiện mật khẩu" onclick="togglePasswordVisibility('password')">
              ${getIcon("eye", 18)}
            </button>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <a href="#" style="font-size: 13px; font-weight: 600; color: var(--color-primary); text-decoration: none;" onclick="showToast('Chức năng Quên mật khẩu gửi OTP đến email');">Quên mật khẩu?</a>
        </div>

        <button type="submit" class="app-btn app-btn-primary app-btn-block" ${state.currentUIState === 'SUBMITTING' ? 'disabled' : ''}>
          ${state.currentUIState === 'SUBMITTING' ? `<span class="spinner spinner-white" style="width: 18px; height: 18px;"></span> Đang xác thực...` : 'Đăng nhập'}
        </button>
      </form>
    </div>
  `;
}

// 2. CORE-02: Dashboard Screen (SCR-MAIN-01)
function renderDashboardScreen() {
  const d = SAMPLE_DATA.dashboardMetrics;
  return `
    <div class="top-app-bar">
      <div class="top-app-bar-left">
        <span style="font-size: 20px;">👋</span>
        <div>
          <div class="top-app-bar-title">Xin chào, ${SAMPLE_DATA.currentUser.fullName}</div>
          <div class="top-app-bar-subtitle">${SAMPLE_DATA.currentUser.department}</div>
        </div>
      </div>
      <div class="top-app-bar-actions">
        <button class="app-icon-btn" aria-label="Xem thông báo" onclick="showToast('Chuyển tới danh sách thông báo');">
          ${getIcon("flag", 20)}
        </button>
      </div>
    </div>

    <!-- Prominent Gap & Preview Notice -->
    <div style="padding: 0 16px; margin-top: 12px;">
      <div class="notice-banner warning">
        ${getIcon("alertTriangle", 16, "#d97706")}
        <div>
          <strong style="display: block;">DESIGN PREVIEW | BACKEND GAP</strong>
          <span style="font-size: 11px; font-weight: 400;">Endpoint <code>GET /api/v1/dashboard/me</code> chưa có controller backend. Số liệu hiển thị dưới đây là dữ liệu giả định.</span>
        </div>
      </div>
    </div>

    <div class="screen-scroll-view">
      <!-- Metric Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <div class="app-card" style="padding: 14px; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; color: var(--color-primary);">
            <span style="font-size: 12px; font-weight: 600;">DỰ ÁN ĐANG LÀM</span>
            ${getIcon("folder", 16, "var(--color-primary)")}
          </div>
          <div style="font-size: 24px; font-weight: 800; color: var(--color-text-primary);">${d.projects.active}</div>
          <span style="font-size: 11px; color: var(--color-text-secondary);">1 dự án đang tạm dừng</span>
        </div>

        <div class="app-card" style="padding: 14px; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; color: #dc2626;">
            <span style="font-size: 12px; font-weight: 600;">VIỆC QUÁ HẠN</span>
            ${getIcon("alertCircle", 16, "#dc2626")}
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #dc2626;">${d.tasks.overdue}</div>
          <span style="font-size: 11px; color: var(--color-text-secondary);">${d.tasks.dueSoon} việc sắp đến hạn</span>
        </div>
      </div>

      <!-- Quick Action / Shortcut to Project -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        <h3 style="font-size: 16px; font-weight: 700;">Dự án của bạn</h3>
        <button class="app-btn app-btn-text" style="font-size: 12px;" onclick="navigateTo('CORE-03')">Xem tất cả</button>
      </div>

      <!-- Highlight Project Card -->
      <div class="app-card" onclick="openProjectDetail('prj-001')">
        <div class="project-card-header">
          <div>
            <div class="project-card-code">WS-MOBILE</div>
            <div class="project-card-title">WorkSphere Mobile Application</div>
          </div>
          ${renderStatusBadge("ACTIVE")}
        </div>
        <p style="font-size: 13px; color: var(--color-text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          Xây dựng ứng dụng di động nội bộ quản lý công việc, dự án và tài sản cho nhân viên WorkSphere.
        </p>
        <div class="progress-bar-container">
          <div class="progress-bar-header">
            <span>Tiến độ thực tế</span>
            <span>65%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: 65%;"></div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">
          <span>PM: Nguyễn An</span>
          <span>Hạn: 31/12/2026</span>
        </div>
      </div>

      <!-- Recent Activity / Notifications -->
      <div style="margin-top: 8px;">
        <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">Thông báo gần đây</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${d.recentNotifications.map(n => `
            <div class="app-card" style="padding: 12px; gap: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 13px; color: var(--color-primary);">${n.title}</strong>
                <span style="font-size: 11px; color: var(--color-text-secondary);">${n.time}</span>
              </div>
              <p style="font-size: 12px; color: var(--color-text-primary); margin: 0;">${n.message}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 3. CORE-03: Project List Screen (SCR-PRJ-01)
function renderProjectListScreen() {
  if (state.currentUIState === "LOADING" || state.currentUIState === "SKELETON") {
    return `
      ${renderTopAppBar("Danh sách Dự án", false)}
      <div class="screen-scroll-view">
        <div class="skeleton-card"><div class="skeleton-box" style="height: 18px; width: 40%;"></div><div class="skeleton-box" style="height: 24px; width: 80%;"></div><div class="skeleton-box" style="height: 8px; width: 100%;"></div></div>
        <div class="skeleton-card"><div class="skeleton-box" style="height: 18px; width: 40%;"></div><div class="skeleton-box" style="height: 24px; width: 80%;"></div><div class="skeleton-box" style="height: 8px; width: 100%;"></div></div>
        <div class="skeleton-card"><div class="skeleton-box" style="height: 18px; width: 40%;"></div><div class="skeleton-box" style="height: 24px; width: 80%;"></div><div class="skeleton-box" style="height: 8px; width: 100%;"></div></div>
      </div>
    `;
  }

  if (state.currentUIState === "EMPTY") {
    return `
      ${renderTopAppBar("Danh sách Dự án", false)}
      <div class="state-center-container">
        <div class="state-icon-circle">${getIcon("folder", 32)}</div>
        <div class="state-title">Chưa có dự án nào</div>
        <p class="state-desc">Bạn chưa được phân công hoặc chưa tham gia vào bất kỳ dự án nào trong hệ thống.</p>
        <button class="app-btn app-btn-primary" onclick="showToast('Mở màn hình tạo dự án mới');">Tạo dự án mới</button>
      </div>
    `;
  }

  if (state.currentUIState === "ERROR") {
    return `
      ${renderTopAppBar("Danh sách Dự án", false)}
      <div class="state-center-container">
        <div class="state-icon-circle" style="background: var(--color-error-container); color: var(--color-error);">${getIcon("alertCircle", 32, "var(--color-error)")}</div>
        <div class="state-title">Không thể tải dữ liệu</div>
        <p class="state-desc">Đã xảy ra lỗi khi kết nối tới máy chủ (HTTP 500). Vui lòng thử lại sau.</p>
        <button class="app-btn app-btn-primary" onclick="setUIState('SUCCESS')">Tải lại dữ liệu</button>
      </div>
    `;
  }

  if (state.currentUIState === "PERMISSION_DENIED") {
    return `
      ${renderTopAppBar("Danh sách Dự án", false)}
      <div class="state-center-container">
        <div class="state-icon-circle" style="background: var(--color-error-container); color: var(--color-error);">${getIcon("lock", 32, "var(--color-error)")}</div>
        <div class="state-title">Truy cập bị từ chối (403)</div>
        <p class="state-desc">Bạn không có quyền <code>PROJECT_READ</code> để xem danh sách dự án này.</p>
        <button class="app-btn app-btn-secondary" onclick="navigateTo('CORE-02')">Quay lại Dashboard</button>
      </div>
    `;
  }

  return `
    ${renderTopAppBar("Danh sách Dự án", false)}

    <div style="padding: 12px 16px 0 16px; display: flex; flex-direction: column; gap: 8px;">
      <!-- Search Input -->
      <div class="search-bar">
        ${getIcon("search", 18, "var(--color-text-secondary)")}
        <input type="text" placeholder="Tìm theo tên hoặc mã dự án..." value="" onkeyup="if(event.key==='Enter') showToast('Đang lọc danh sách...');">
      </div>

      <!-- Filter Chips Row -->
      <div class="filter-chips-row">
        <button class="filter-chip active" onclick="showToast('Lọc tất cả');">Tất cả (4)</button>
        <button class="filter-chip" onclick="showToast('Lọc Đang làm');">Đang làm (2)</button>
        <button class="filter-chip" onclick="showToast('Lọc Tạm dừng');">Tạm dừng (1)</button>
        <button class="filter-chip" onclick="showToast('Lọc Hoàn thành');">Hoàn thành (1)</button>
      </div>
    </div>

    <!-- Pull to Refresh Simulation -->
    ${state.currentUIState === "REFRESHING" ? `
      <div class="pull-refresh-indicator">
        <span class="spinner" style="width: 16px; height: 16px;"></span>
        <span>Đang làm mới danh sách dự án...</span>
      </div>
    ` : ""}

    <div class="screen-scroll-view">
      ${SAMPLE_DATA.projects.map(p => `
        <div class="app-card" onclick="openProjectDetail('${p.id}')">
          <div class="project-card-header">
            <div>
              <div class="project-card-code">${p.code}</div>
              <div class="project-card-title">${p.name}</div>
            </div>
            ${renderStatusBadge(p.status)}
          </div>
          <p style="font-size: 13px; color: var(--color-text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${p.description}
          </p>
          <div class="progress-bar-container">
            <div class="progress-bar-header">
              <span>Tiến độ</span>
              <span>${p.progressPercentage}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${p.progressPercentage}%;"></div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--color-text-secondary); margin-top: 2px;">
            <span>${renderPriorityBadge(p.priority)}</span>
            <span>Quản lý: <strong>${p.managerName}</strong></span>
          </div>
        </div>
      `).join('')}

      ${state.currentUIState === "LOADING_MORE" ? `
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; padding: 16px; font-size: 12px; color: var(--color-text-secondary);">
          <span class="spinner" style="width: 16px; height: 16px;"></span>
          <span>Đang tải thêm dự án...</span>
        </div>
      ` : ""}
    </div>

    <!-- Floating Action Button to Create Project -->
    <button class="fab-btn" aria-label="Tạo dự án mới" onclick="showToast('Mở màn hình Tạo Dự án (SCR-PRJ-03)');">
      ${getIcon("plus", 24, "#fff")}
    </button>
  `;
}

// 4. CORE-04: Project Detail Screen (SCR-PRJ-02)
function renderProjectDetailScreen() {
  const p = SAMPLE_DATA.projects.find(x => x.id === state.selectedProjectId) || SAMPLE_DATA.projects[0];
  return `
    <div class="top-app-bar">
      <div class="top-app-bar-left">
        <button class="app-icon-btn" aria-label="Quay lại" onclick="navigateTo('CORE-03')">
          ${getIcon("arrowLeft", 20)}
        </button>
        <div>
          <div class="top-app-bar-title">${p.code}</div>
          <div class="top-app-bar-subtitle">Chi tiết dự án</div>
        </div>
      </div>
      <div class="top-app-bar-actions">
        <button class="app-icon-btn" aria-label="Đổi trạng thái" onclick="openModal('change-status')">
          ${getIcon("edit", 18)}
        </button>
        <button class="app-icon-btn" aria-label="Xem xung đột mẫu" onclick="openModal('optimistic-lock')">
          ${getIcon("alertTriangle", 18, "#d97706")}
        </button>
      </div>
    </div>

    <div class="screen-scroll-view">
      <!-- Header Info Card -->
      <div class="app-card" style="cursor: default;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <h2 style="font-size: 18px; font-weight: 800; color: var(--color-text-primary);">${p.name}</h2>
          ${renderStatusBadge(p.status)}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 4px;">
          ${renderPriorityBadge(p.priority)}
          <span style="font-size: 11px; padding: 4px 8px; background: var(--color-surface-variant); border-radius: var(--shape-small); color: var(--color-text-secondary);">Phiên bản (version): ${p.version}</span>
        </div>
        <p style="font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; margin-top: 6px;">
          ${p.description}
        </p>

        <div class="progress-bar-container" style="margin-top: 8px;">
          <div class="progress-bar-header">
            <span>Tiến độ tổng thể</span>
            <span>${p.progressPercentage}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${p.progressPercentage}%;"></div>
          </div>
        </div>
      </div>

      <!-- Attributes Grid -->
      <div class="app-card" style="cursor: default; padding: 14px;">
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--color-surface-variant); font-size: 13px;">
          <span style="color: var(--color-text-secondary);">Quản lý dự án (PM):</span>
          <strong style="color: var(--color-text-primary);">${p.managerName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--color-surface-variant); font-size: 13px;">
          <span style="color: var(--color-text-secondary);">Phòng ban phụ trách:</span>
          <strong style="color: var(--color-text-primary);">${p.departmentName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--color-surface-variant); font-size: 13px;">
          <span style="color: var(--color-text-secondary);">Ngày bắt đầu:</span>
          <span>${p.startDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px;">
          <span style="color: var(--color-text-secondary);">Hạn hoàn thành:</span>
          <span>${p.targetEndDate}</span>
        </div>
      </div>

      <!-- Navigation Shortcuts to Sub-modules -->
      <h3 style="font-size: 15px; font-weight: 700;">Phân hệ thành phần</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div class="member-row" style="cursor: pointer;" onclick="navigateTo('CORE-06')">
          <div class="member-info-left">
            <div class="member-avatar" style="background: var(--color-primary-container); color: var(--color-primary);">
              ${getIcon("users", 20, "var(--color-primary)")}
            </div>
            <div>
              <div class="member-name">Thành viên dự án</div>
              <div class="member-role-text">4 thành viên đang tham gia</div>
            </div>
          </div>
          ${getIcon("chevronRight", 18, "var(--color-text-secondary)")}
        </div>

        <div class="member-row" style="cursor: pointer;" onclick="navigateTo('CORE-07')">
          <div class="member-info-left">
            <div class="member-avatar" style="background: var(--color-info-container); color: var(--color-info);">
              ${getIcon("flag", 20, "var(--color-info)")}
            </div>
            <div>
              <div class="member-name">Mốc tiến độ (Milestones)</div>
              <div class="member-role-text">5 mốc theo kế hoạch bàn giao</div>
            </div>
          </div>
          ${getIcon("chevronRight", 18, "var(--color-text-secondary)")}
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 10px; margin-top: 8px;">
        <button class="app-btn app-btn-secondary" style="flex: 1;" onclick="openModal('change-status')">
          ${getIcon("edit", 16)} Đổi trạng thái
        </button>
        <button class="app-btn app-btn-primary" style="flex: 1;" onclick="showToast('Chức năng chỉnh sửa thông tin dự án');">
          Chỉnh sửa
        </button>
      </div>
    </div>
  `;
}

// 5. CORE-06: Project Member List Screen (SCR-PRJ-06)
function renderProjectMembersScreen() {
  return `
    <div class="top-app-bar">
      <div class="top-app-bar-left">
        <button class="app-icon-btn" aria-label="Quay lại" onclick="navigateTo('CORE-04')">
          ${getIcon("arrowLeft", 20)}
        </button>
        <div>
          <div class="top-app-bar-title">Thành viên dự án</div>
          <div class="top-app-bar-subtitle">WS-MOBILE</div>
        </div>
      </div>
      <div class="top-app-bar-actions">
        <button class="app-icon-btn" aria-label="Thêm thành viên" onclick="showToast('Mở form Thêm thành viên vào dự án');">
          ${getIcon("plus", 20)}
        </button>
      </div>
    </div>

    <!-- Invariant Notice -->
    <div style="padding: 12px 16px 0 16px;">
      <div class="notice-banner" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
        ${getIcon("helpCircle", 16, "#0369a1")}
        <span>Quy tắc D-013: Dự án phải luôn có ít nhất một active Project Manager.</span>
      </div>
    </div>

    <div class="screen-scroll-view">
      ${SAMPLE_DATA.projectMembers.map(m => {
        const roleCfg = SAMPLE_DATA.roleConfig[m.role] || { label: m.role, badgeBg: "#f1f5f9", badgeColor: "#334155" };
        return `
          <div class="member-row">
            <div class="member-info-left">
              <div class="member-avatar">${m.avatar}</div>
              <div class="member-details">
                <div class="member-name">${m.fullName}</div>
                <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                  <span style="font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${roleCfg.badgeBg}; color: ${roleCfg.badgeColor};">
                    ${roleCfg.label}
                  </span>
                  ${m.isLastProjectManager ? `<span style="font-size: 10px; color: #b45309; background: #fef3c7; padding: 2px 4px; border-radius: 2px; font-weight: 700;">Sole PM</span>` : ''}
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 4px;">
              <button class="app-icon-btn" aria-label="Xóa thành viên" onclick="handleDeleteMember('${m.id}')" style="width: 36px; height: 36px;">
                ${getIcon("trash", 16, m.isLastProjectManager ? "#94a3b8" : "#dc2626")}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 6. CORE-07: Milestone List Screen (SCR-PRJ-08)
function renderMilestoneListScreen() {
  return `
    <div class="top-app-bar">
      <div class="top-app-bar-left">
        <button class="app-icon-btn" aria-label="Quay lại" onclick="navigateTo('CORE-04')">
          ${getIcon("arrowLeft", 20)}
        </button>
        <div>
          <div class="top-app-bar-title">Mốc tiến độ</div>
          <div class="top-app-bar-subtitle">WS-MOBILE</div>
        </div>
      </div>
      <div class="top-app-bar-actions">
        <button class="app-icon-btn" aria-label="Tạo mốc mới" onclick="navigateTo('CORE-08')">
          ${getIcon("plus", 20)}
        </button>
      </div>
    </div>

    <div class="screen-scroll-view">
      ${SAMPLE_DATA.milestones.map(m => `
        <div class="milestone-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <strong style="font-size: 14px; color: var(--color-text-primary);">${m.orderIndex}. ${m.name}</strong>
            ${renderStatusBadge(m.status)}
          </div>
          <p style="font-size: 12px; color: var(--color-text-secondary); line-height: 1.4;">${m.description}</p>

          <div class="progress-bar-container">
            <div class="progress-bar-header">
              <span>Tiến độ mốc</span>
              <span>${m.progressPercentage}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${m.progressPercentage}%;"></div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--color-text-secondary); margin-top: 4px;">
            <span>Hạn nộp: <strong style="${m.status === 'OVERDUE' ? 'color: var(--color-error);' : ''}">${m.dueDate}</strong></span>
            ${m.completedAt ? `<span>Đã xong: ${m.completedAt}</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    <button class="fab-btn" aria-label="Tạo mốc mới" onclick="navigateTo('CORE-08')">
      ${getIcon("plus", 24, "#fff")}
    </button>
  `;
}

// 7. CORE-08: Create Milestone Form Screen (SCR-PRJ-09)
function renderCreateMilestoneScreen() {
  return `
    <div class="top-app-bar">
      <div class="top-app-bar-left">
        <button class="app-icon-btn" aria-label="Quay lại" onclick="navigateTo('CORE-07')">
          ${getIcon("arrowLeft", 20)}
        </button>
        <div>
          <div class="top-app-bar-title">Tạo mốc tiến độ</div>
          <div class="top-app-bar-subtitle">WS-MOBILE</div>
        </div>
      </div>
    </div>

    <div class="screen-scroll-view">
      <form onsubmit="event.preventDefault(); showToast('Tạo mốc tiến độ thành công!'); navigateTo('CORE-07');" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label" for="mls-name">Tên mốc tiến độ <span class="required">*</span></label>
          <input class="app-input" id="mls-name" type="text" placeholder="Ví dụ: Kiểm thử Beta đợt 1" value="Kiểm thử tích hợp hệ thống" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="mls-desc">Mô tả công việc mục tiêu</label>
          <textarea class="app-input" id="mls-desc" rows="3" style="min-height: 80px; resize: vertical;" placeholder="Mô tả tiêu chuẩn nghiệm thu của mốc...">Thực hiện chạy toàn bộ test suite MockMvc và Testcontainers kiểm toán.</textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="mls-due">Hạn hoàn thành (Due Date) <span class="required">*</span></label>
          <input class="app-input" id="mls-due" type="date" value="2026-11-20" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="mls-order">Thứ tự ưu tiên (Order Index)</label>
          <input class="app-input" id="mls-order" type="number" value="6" min="1">
        </div>

        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <button type="button" class="app-btn app-btn-secondary" style="flex: 1;" onclick="navigateTo('CORE-07')">Hủy bỏ</button>
          <button type="submit" class="app-btn app-btn-primary" style="flex: 1;">Lưu mốc</button>
        </div>
      </form>
    </div>
  `;
}

// 8. CORE-09: Profile Screen (SCR-ACC-01)
function renderProfileScreen() {
  const u = SAMPLE_DATA.currentUser;
  return `
    <div class="top-app-bar">
      <div class="top-app-bar-left">
        <button class="app-icon-btn" aria-label="Quay lại" onclick="navigateTo('CORE-11')">
          ${getIcon("arrowLeft", 20)}
        </button>
        <div class="top-app-bar-title">Hồ sơ cá nhân</div>
      </div>
    </div>

    <div class="screen-scroll-view">
      <div style="display: flex; flex-direction: column; align-items: center; padding: 16px 0; gap: 8px;">
        <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 28px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: var(--elevation-2);">
          ${u.avatar}
        </div>
        <h2 style="font-size: 18px; font-weight: 700;">${u.fullName}</h2>
        <span style="font-size: 12px; color: var(--color-text-secondary);">@${u.username}</span>
        <span style="font-size: 11px; padding: 4px 10px; background: var(--color-success-container); color: var(--color-success); border-radius: var(--shape-full); font-weight: 700;">TÀI KHOẢN HOẠT ĐỘNG</span>
      </div>

      <div class="app-card" style="padding: 16px; gap: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px solid var(--color-surface-variant); padding-bottom: 8px;">
          <span style="color: var(--color-text-secondary);">Email:</span>
          <strong>${u.email}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px solid var(--color-surface-variant); padding-bottom: 8px;">
          <span style="color: var(--color-text-secondary);">Phòng ban:</span>
          <strong>${u.department}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px solid var(--color-surface-variant); padding-bottom: 8px;">
          <span style="color: var(--color-text-secondary);">Vai trò hệ thống:</span>
          <span style="display: flex; gap: 4px;">
            ${u.roles.map(r => `<span style="font-size: 11px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${r}</span>`).join('')}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: var(--color-text-secondary);">Số điện thoại:</span>
          <span>${u.phone}</span>
        </div>
      </div>

      <button class="app-btn app-btn-secondary app-btn-block" onclick="navigateTo('CORE-10')">
        ${getIcon("lock", 16)} Đổi mật khẩu
      </button>
    </div>
  `;
}

// 9. CORE-10: Change Password Screen (SCR-ACC-02)
function renderChangePasswordScreen() {
  return `
    <div class="top-app-bar">
      <div class="top-app-bar-left">
        <button class="app-icon-btn" aria-label="Quay lại" onclick="navigateTo('CORE-09')">
          ${getIcon("arrowLeft", 20)}
        </button>
        <div class="top-app-bar-title">Đổi mật khẩu</div>
      </div>
    </div>

    <div class="screen-scroll-view">
      <form onsubmit="event.preventDefault(); showToast('Đổi mật khẩu thành công!'); navigateTo('CORE-09');" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="form-group">
          <label class="form-label" for="cur-pass">Mật khẩu hiện tại <span class="required">*</span></label>
          <div class="input-container">
            <input class="app-input" id="cur-pass" type="password" value="Password123!" required>
            <button type="button" class="input-suffix-btn" onclick="togglePasswordVisibility('cur-pass')">${getIcon('eye', 18)}</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="new-pass">Mật khẩu mới <span class="required">*</span></label>
          <div class="input-container">
            <input class="app-input" id="new-pass" type="password" placeholder="Tối thiểu 8 ký tự" required>
            <button type="button" class="input-suffix-btn" onclick="togglePasswordVisibility('new-pass')">${getIcon('eye', 18)}</button>
          </div>
          <span class="form-helper-text">Mật khẩu gồm chữ hoa, chữ thường và số.</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="confirm-pass">Xác nhận mật khẩu mới <span class="required">*</span></label>
          <div class="input-container">
            <input class="app-input" id="confirm-pass" type="password" placeholder="Nhập lại mật khẩu mới" required>
            <button type="button" class="input-suffix-btn" onclick="togglePasswordVisibility('confirm-pass')">${getIcon('eye', 18)}</button>
          </div>
        </div>

        <button type="submit" class="app-btn app-btn-primary app-btn-block" style="margin-top: 12px;">
          Lưu thay đổi mật khẩu
        </button>
      </form>
    </div>
  `;
}

// 10. CORE-11: More Menu Screen (SCR-MAIN-03)
function renderMoreMenuScreen() {
  return `
    <div class="top-app-bar">
      <div class="top-app-bar-left">
        <div class="top-app-bar-title">Thêm / Cài đặt</div>
      </div>
    </div>

    <div class="screen-scroll-view">
      <!-- Profile Header Summary -->
      <div class="member-row" style="cursor: pointer;" onclick="navigateTo('CORE-09')">
        <div class="member-info-left">
          <div class="member-avatar">${SAMPLE_DATA.currentUser.avatar}</div>
          <div>
            <div class="member-name">${SAMPLE_DATA.currentUser.fullName}</div>
            <div class="member-role-text">${SAMPLE_DATA.currentUser.email}</div>
          </div>
        </div>
        ${getIcon("chevronRight", 18, "var(--color-text-secondary)")}
      </div>

      <div style="font-size: 12px; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; margin-top: 8px;">Quản lý Phân hệ</div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div class="member-row" style="cursor: pointer;" onclick="showToast('Phân hệ Tài sản thuộc Phase 9');">
          <div class="member-info-left">
            <span style="color: var(--color-primary);">${getIcon("folder", 20)}</span>
            <span style="font-size: 14px; font-weight: 600;">Quản lý Tài sản (Assets)</span>
          </div>
          <span style="font-size: 11px; background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Phase 9</span>
        </div>

        <div class="member-row" style="cursor: pointer;" onclick="showToast('Quản trị danh mục thuộc Phase 10');">
          <div class="member-info-left">
            <span style="color: var(--color-primary);">${getIcon("menu", 20)}</span>
            <span style="font-size: 14px; font-weight: 600;">Quản trị Hệ thống</span>
          </div>
          <span style="font-size: 11px; background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Admin</span>
        </div>
      </div>

      <div style="font-size: 12px; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; margin-top: 8px;">Tài khoản & Phiên</div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div class="member-row" style="cursor: pointer;" onclick="navigateTo('CORE-10')">
          <div class="member-info-left">
            <span style="color: var(--color-primary);">${getIcon("lock", 20)}</span>
            <span style="font-size: 14px; font-weight: 600;">Đổi mật khẩu</span>
          </div>
          ${getIcon("chevronRight", 18, "var(--color-text-secondary)")}
        </div>

        <div class="member-row" style="cursor: pointer;" onclick="openModal('logout-confirm')">
          <div class="member-info-left">
            <span style="color: var(--color-error);">${getIcon("logOut", 20, "var(--color-error)")}</span>
            <span style="font-size: 14px; font-weight: 600; color: var(--color-error);">Đăng xuất</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Top App Bar Generator
function renderTopAppBar(title, showBack = true) {
  return `
    <div class="top-app-bar">
      <div class="top-app-bar-left">
        ${showBack ? `
          <button class="app-icon-btn" aria-label="Quay lại" onclick="navigateTo('CORE-03')">
            ${getIcon("arrowLeft", 20)}
          </button>
        ` : ''}
        <div class="top-app-bar-title">${title}</div>
      </div>
    </div>
  `;
}

// Bottom Navigation Bar Generator
function renderBottomNavigation() {
  if (state.currentScreen === "CORE-01") return ""; // Do not show BottomNav on Login
  return `
    <nav class="bottom-nav" aria-label="Thanh điều hướng chính">
      <button class="bottom-nav-item ${state.activeTab === 'dashboard' ? 'active' : ''}" onclick="navigateTo('CORE-02')" aria-label="Tổng quan">
        <div class="bottom-nav-icon-wrapper">${getIcon("home", 20)}</div>
        <span class="bottom-nav-label">Tổng quan</span>
      </button>

      <button class="bottom-nav-item ${state.activeTab === 'projects' ? 'active' : ''}" onclick="navigateTo('CORE-03')" aria-label="Dự án">
        <div class="bottom-nav-icon-wrapper">${getIcon("folder", 20)}</div>
        <span class="bottom-nav-label">Dự án</span>
      </button>

      <button class="bottom-nav-item ${state.activeTab === 'tasks' ? 'active' : ''}" onclick="showToast('Phân hệ Công việc thuộc Phase 7 (Backend Gap)');" aria-label="Công việc">
        <div class="bottom-nav-icon-wrapper">${getIcon("checkSquare", 20)}</div>
        <span class="bottom-nav-label">Công việc</span>
      </button>

      <button class="bottom-nav-item ${state.activeTab === 'requests' ? 'active' : ''}" onclick="showToast('Phân hệ Yêu cầu dịch vụ thuộc Phase 8 (Backend Gap)');" aria-label="Yêu cầu">
        <div class="bottom-nav-icon-wrapper">${getIcon("helpCircle", 20)}</div>
        <span class="bottom-nav-label">Yêu cầu</span>
      </button>

      <button class="bottom-nav-item ${state.activeTab === 'more' ? 'active' : ''}" onclick="navigateTo('CORE-11')" aria-label="Thêm">
        <div class="bottom-nav-icon-wrapper">${getIcon("menu", 20)}</div>
        <span class="bottom-nav-label">Thêm</span>
      </button>
    </nav>
  `;
}

// --------------------------------------------------------------------------
// MODAL / BOTTOM SHEET RENDERERS
// --------------------------------------------------------------------------

function renderModals() {
  const modalRoot = document.getElementById("prototype-modal-root");
  if (!modalRoot) return;

  if (!state.activeModal) {
    modalRoot.innerHTML = "";
    return;
  }

  // 1. Change Status Bottom Sheet (CORE-05 / SCR-PRJ-05)
  if (state.activeModal === "change-status") {
    modalRoot.innerHTML = `
      <div class="modal-overlay active" onclick="if(event.target===this) closeModal();">
        <div class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-sheet-title">
          <div class="bottom-sheet-handle"></div>
          <div class="bottom-sheet-header">
            <div class="bottom-sheet-title" id="modal-sheet-title">Chuyển trạng thái dự án</div>
            <button class="app-icon-btn" aria-label="Đóng" onclick="closeModal()">${getIcon("close", 18)}</button>
          </div>
          <p style="font-size: 13px; color: var(--color-text-secondary);">
            Trạng thái hiện tại: <strong>Đang thực hiện (ACTIVE)</strong>. Chọn trạng thái hợp lệ tiếp theo:
          </p>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="app-btn app-btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px 16px;" onclick="handleStatusChange('ON_HOLD')">
              ${renderStatusBadge('ON_HOLD')}
              <span style="font-size: 13px; margin-left: 8px;">Tạm dừng dự án để chờ phê duyệt bổ sung</span>
            </button>
            <button class="app-btn app-btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px 16px;" onclick="handleStatusChange('COMPLETED')">
              ${renderStatusBadge('COMPLETED')}
              <span style="font-size: 13px; margin-left: 8px;">Nghiệm thu và Hoàn thành toàn bộ dự án</span>
            </button>
            <button class="app-btn app-btn-secondary" style="justify-content: flex-start; text-align: left; padding: 12px 16px; border-color: #fecaca;" onclick="handleStatusChange('CANCELLED')">
              ${renderStatusBadge('CANCELLED')}
              <span style="font-size: 13px; margin-left: 8px; color: var(--color-error);">Hủy bỏ dự án (Không thể khôi phục)</span>
            </button>
          </div>

          <button class="app-btn app-btn-text app-btn-block" onclick="closeModal()">Hủy thao tác</button>
        </div>
      </div>
    `;
    return;
  }

  // 2. Optimistic Lock Conflict Modal (SCR-PRJ-04 / 07_UI_STATE_MATRIX.md)
  if (state.activeModal === "optimistic-lock") {
    modalRoot.innerHTML = `
      <div class="dialog-overlay active" onclick="if(event.target===this) closeModal();">
        <div class="dialog-card" role="alertdialog" aria-modal="true" aria-labelledby="conflict-dialog-title">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; align-self: center;">
            ${getIcon("alertTriangle", 28, "#d97706")}
          </div>
          <div class="dialog-title" id="conflict-dialog-title" style="text-align: center;">Dữ liệu đã thay đổi</div>
          <div class="dialog-body" style="text-align: center;">
            Thông tin dự án vừa được cập nhật bởi một thành viên khác trong hệ thống. Để tránh mất dữ liệu mới nhất, vui lòng tải lại phiên bản mới.
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
            <button class="app-btn app-btn-primary app-btn-block" onclick="closeModal(); showToast('Đã nạp phiên bản mới nhất từ máy chủ (version: 4)');">
              ${getIcon("refresh", 16)} Tải lại phiên bản mới
            </button>
            <button class="app-btn app-btn-secondary app-btn-block" onclick="closeModal(); showToast('Bản nháp đã được lưu tạm.');">
              Giữ bản nháp & Đóng
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 3. Final Project Manager Warning Dialog (Invariant Rule D-013)
  if (state.activeModal === "final-pm-alert") {
    modalRoot.innerHTML = `
      <div class="dialog-overlay active" onclick="if(event.target===this) closeModal();">
        <div class="dialog-card" role="alertdialog" aria-modal="true" aria-labelledby="pm-alert-title">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; align-self: center;">
            ${getIcon("shieldAlert", 28, "#dc2626")}
          </div>
          <div class="dialog-title" id="pm-alert-title" style="text-align: center; color: var(--color-error);">Không thể xóa Project Manager</div>
          <div class="dialog-body" style="text-align: center;">
            Theo quy tắc bất biến hệ thống (D-013), mỗi dự án bắt buộc phải có ít nhất một active <strong>Project Manager</strong>. Không thể xóa hoặc giáng cấp Project Manager duy nhất hiện tại (<strong>Nguyễn An</strong>).
          </div>
          <button class="app-btn app-btn-secondary app-btn-block" onclick="closeModal()">Đã hiểu & Đóng</button>
        </div>
      </div>
    `;
    return;
  }

  // 4. Logout Confirmation Dialog (CORE-12 / SCR-ACC-04)
  if (state.activeModal === "logout-confirm") {
    modalRoot.innerHTML = `
      <div class="dialog-overlay active" onclick="if(event.target===this) closeModal();">
        <div class="dialog-card" role="alertdialog" aria-modal="true" aria-labelledby="logout-dialog-title">
          <div class="dialog-title" id="logout-dialog-title">Xác nhận đăng xuất</div>
          <div class="dialog-body">
            Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng WorkSphere? Phiên làm việc của bạn sẽ kết thúc.
          </div>
          <div class="dialog-actions">
            <button class="app-btn app-btn-secondary" onclick="closeModal()">Hủy</button>
            <button class="app-btn app-btn-danger" onclick="closeModal(); navigateTo('CORE-01'); showToast('Đã đăng xuất phiên làm việc.');">Đăng xuất</button>
          </div>
        </div>
      </div>
    `;
    return;
  }
}

// --------------------------------------------------------------------------
// EVENT HANDLERS & HELPERS
// --------------------------------------------------------------------------

function openProjectDetail(projectId) {
  state.selectedProjectId = projectId;
  navigateTo("CORE-04");
}

function handleStatusChange(newStatus) {
  closeModal();
  const p = SAMPLE_DATA.projects.find(x => x.id === state.selectedProjectId);
  if (p) p.status = newStatus;
  showToast(`Đã chuyển trạng thái dự án sang ${newStatus}`);
  renderScreen();
}

function handleDeleteMember(memberId) {
  const mem = SAMPLE_DATA.projectMembers.find(m => m.id === memberId);
  if (mem && mem.isLastProjectManager) {
    openModal("final-pm-alert");
    return;
  }
  showToast("Thao tác xóa thành viên hợp lệ");
}

function togglePasswordVisibility(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.type = el.type === "password" ? "text" : "password";
}

// Escape Key to Close Modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.activeModal) {
    closeModal();
  }
});

// Render Main Screen Wrapper
function renderScreen() {
  const container = document.getElementById("prototype-screen-viewport");
  if (!container) return;

  let contentHtml = "";
  switch (state.currentScreen) {
    case "CORE-01": contentHtml = renderLoginScreen(); break;
    case "CORE-02": contentHtml = renderDashboardScreen(); break;
    case "CORE-03": contentHtml = renderProjectListScreen(); break;
    case "CORE-04": contentHtml = renderProjectDetailScreen(); break;
    case "CORE-06": contentHtml = renderProjectMembersScreen(); break;
    case "CORE-07": contentHtml = renderMilestoneListScreen(); break;
    case "CORE-08": contentHtml = renderCreateMilestoneScreen(); break;
    case "CORE-09": contentHtml = renderProfileScreen(); break;
    case "CORE-10": contentHtml = renderChangePasswordScreen(); break;
    case "CORE-11": contentHtml = renderMoreMenuScreen(); break;
    default: contentHtml = renderDashboardScreen(); break;
  }

  // Prepend Offline Banner if OFFLINE state
  let bannerHtml = "";
  if (state.currentUIState === "OFFLINE") {
    bannerHtml = `
      <div class="notice-banner offline" style="margin: 8px 16px 0 16px;">
        ${getIcon("wifiOff", 16, "var(--color-warning)")}
        <span>Bạn đang ngoại tuyến. Dữ liệu hiển thị từ cache cục bộ.</span>
      </div>
    `;
  }

  container.innerHTML = `
    ${bannerHtml}
    ${contentHtml}
    ${renderBottomNavigation()}
  `;
}

// Render Review Mode Panel on Desktop View
function renderReviewPanel() {
  const panel = document.getElementById("prototype-review-panel");
  if (!panel) return;

  const meta = SCREEN_METADATA[state.currentScreen] || {
    screenId: "N/A", screenName: "Unknown", module: "N/A", backendReadiness: "N/A", apiEndpoint: "N/A", requiredPermission: "N/A"
  };

  const screensList = [
    { key: "CORE-01", name: "01. Đăng nhập (SCR-AUTH-02)" },
    { key: "CORE-02", name: "02. Dashboard (SCR-MAIN-01)" },
    { key: "CORE-03", name: "03. Danh sách Dự án (SCR-PRJ-01)" },
    { key: "CORE-04", name: "04. Chi tiết Dự án (SCR-PRJ-02)" },
    { key: "CORE-06", name: "06. Thành viên Dự án (SCR-PRJ-06)" },
    { key: "CORE-07", name: "07. Mốc tiến độ (SCR-PRJ-08)" },
    { key: "CORE-08", name: "08. Tạo mốc mới (SCR-PRJ-09)" },
    { key: "CORE-09", name: "09. Hồ sơ cá nhân (SCR-ACC-01)" },
    { key: "CORE-10", name: "10. Đổi mật khẩu (SCR-ACC-02)" },
    { key: "CORE-11", name: "11. Thêm / Cài đặt (SCR-MAIN-03)" }
  ];

  const uiStatesList = [
    "SUCCESS", "LOADING", "SKELETON", "EMPTY", "ERROR", "OFFLINE", "REFRESHING", "LOADING_MORE", "PERMISSION_DENIED", "VALIDATION_ERROR", "SUBMITTING"
  ];

  panel.innerHTML = `
    <div class="review-panel-header">
      <h3 style="font-size: 15px; font-weight: 700;">Bảng Đánh giá Giao diện</h3>
      <span class="review-badge">Review Mode</span>
    </div>

    <!-- Active Screen Metadata Card -->
    <div class="review-section">
      <h4>${getIcon("search", 14, "#94a3b8")} Thông tin Màn hình Hiện tại</h4>
      <div class="review-info-card">
        <div class="review-info-row">
          <span class="review-info-label">Screen ID:</span>
          <span class="review-info-val" style="color: #60a5fa;">${meta.screenId}</span>
        </div>
        <div class="review-info-row">
          <span class="review-info-label">Tên màn hình:</span>
          <span class="review-info-val">${meta.screenName}</span>
        </div>
        <div class="review-info-row">
          <span class="review-info-label">Phân hệ:</span>
          <span class="review-info-val">${meta.module}</span>
        </div>
        <div class="review-info-row">
          <span class="review-info-label">Backend:</span>
          <span class="review-info-val" style="color: ${meta.backendReadiness === 'IMPLEMENTED_AND_TESTED' ? '#4ade80' : meta.backendReadiness === 'BLOCKED_BY_GAP' ? '#f59e0b' : '#94a3b8'};">
            ${meta.backendReadiness}
          </span>
        </div>
        <div class="review-info-row">
          <span class="review-info-label">API Contract:</span>
          <span class="review-info-val" style="font-family: monospace; font-size: 11px;">${meta.apiEndpoint}</span>
        </div>
        <div class="review-info-row">
          <span class="review-info-label">Quyền:</span>
          <span class="review-info-val">${meta.requiredPermission}</span>
        </div>
      </div>
      ${meta.gapNotice ? `
        <div style="font-size: 11px; color: #fbbf24; background: rgba(245,158,11,0.15); padding: 8px; border-radius: 6px; margin-top: 6px; border: 1px solid rgba(245,158,11,0.3);">
          ⚠️ ${meta.gapNotice}
        </div>
      ` : ''}
    </div>

    <!-- Viewport Switcher -->
    <div class="review-section">
      <h4>${getIcon("home", 14, "#94a3b8")} Khung nhìn (Viewport)</h4>
      <div class="review-select-btn-group">
        <button class="review-pill-btn ${state.viewport === '411x914' ? 'active' : ''}" onclick="setViewport('411x914')">
          411 × 914 (Android 15 / emulator-5554)
        </button>
        <button class="review-pill-btn ${state.viewport === '360x800' ? 'active' : ''}" onclick="setViewport('360x800')">
          360 × 800 (Android Small)
        </button>
      </div>
    </div>

    <!-- Screen Navigation Switcher -->
    <div class="review-section">
      <h4>${getIcon("menu", 14, "#94a3b8")} Chuyển Màn hình Trực quan</h4>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        ${screensList.map(s => `
          <button class="review-pill-btn ${state.currentScreen === s.key ? 'active' : ''}" style="text-align: left; justify-content: flex-start;" onclick="navigateTo('${s.key}')">
            ${s.name}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- UI State Matrix Switcher -->
    <div class="review-section">
      <h4>${getIcon("filter", 14, "#94a3b8")} Chuyển 12 Trạng thái UI Matrix</h4>
      <div class="review-select-btn-group">
        ${uiStatesList.map(st => `
          <button class="review-pill-btn review-state-btn ${state.currentUIState === st ? 'active' : ''}" onclick="setUIState('${st}')">
            ${st}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Interactive Dialog Triggers -->
    <div class="review-section">
      <h4>${getIcon("alertTriangle", 14, "#94a3b8")} Hộp thoại Đặc thù</h4>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <button class="review-pill-btn" onclick="openModal('change-status')">Mở Change Status Bottom Sheet (CORE-05)</button>
        <button class="review-pill-btn" onclick="openModal('optimistic-lock')">Mở Optimistic Lock Conflict (HTTP 409)</button>
        <button class="review-pill-btn" onclick="openModal('final-pm-alert')">Mở Chặn xóa PM cuối cùng (Rule D-013)</button>
        <button class="review-pill-btn" onclick="openModal('logout-confirm')">Mở Logout Confirm Dialog (CORE-12)</button>
      </div>
    </div>
  `;
}

// Global Initialization
window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("screen")) state.currentScreen = urlParams.get("screen");
  if (urlParams.has("state")) state.currentUIState = urlParams.get("state");
  if (urlParams.has("modal")) state.activeModal = urlParams.get("modal");
  if (urlParams.has("viewport")) {
    setViewport(urlParams.get("viewport"));
    if (urlParams.get("viewport") === "360x800") {
      document.body.classList.add("vp-360");
    }
  }
  if (urlParams.get("capture") === "true" || urlParams.get("headless") === "true") {
    document.body.classList.add("capture-mode");
  }

  renderReviewPanel();
  renderScreen();
  renderModals();
});

if (typeof window !== "undefined") {
  window.state = state;
  window.navigateTo = navigateTo;
  window.setUIState = setUIState;
  window.setViewport = setViewport;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.openProjectDetail = openProjectDetail;
  window.handleStatusChange = handleStatusChange;
  window.handleDeleteMember = handleDeleteMember;
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.showToast = showToast;
  window.renderScreen = renderScreen;
  window.renderReviewPanel = renderReviewPanel;
  window.SCREEN_METADATA = SCREEN_METADATA;
}
