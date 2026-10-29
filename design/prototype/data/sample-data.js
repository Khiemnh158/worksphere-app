/**
 * WorkSphere Mobile - Sample Data for Visual Prototype
 *
 * DỮ LIỆU MINH HỌA - KHÔNG SỬ DỤNG DỮ LIỆU CÁ NHÂN THỰC TẾ
 * Phục vụ trình diễn UI/UX và kiểm thử giao diện theo docs/03_MOBILE_SCREEN_MAP.md
 */

const SAMPLE_DATA = {
  currentUser: {
    id: "usr-001-an",
    username: "nguyenan",
    fullName: "Nguyễn An",
    email: "nguyenan@worksphere.internal",
    department: "Phòng Kỹ thuật & Công nghệ",
    departmentId: "dept-01",
    roles: ["PROJECT_MANAGER", "EMPLOYEE"],
    status: "ACTIVE",
    avatar: "NA",
    phone: "0901234567"
  },

  dashboardMetrics: {
    note: "DESIGN PREVIEW | BACKEND GAP (GET /api/v1/dashboard/me chưa triển khai)",
    tasks: {
      todo: 5,
      inProgress: 3,
      inReview: 1,
      completed: 12,
      overdue: 2,
      dueSoon: 3
    },
    serviceRequests: {
      open: 2,
      inProgress: 1,
      waitingForUser: 0,
      resolved: 3
    },
    projects: {
      active: 3,
      onHold: 1
    },
    recentNotifications: [
      {
        id: "notif-01",
        title: "Dự án mới",
        message: "Bạn đã được phân công làm Project Manager cho dự án WS-MOBILE.",
        time: "10 phút trước",
        read: false,
        type: "PROJECT"
      },
      {
        id: "notif-02",
        title: "Cập nhật tiến độ",
        message: "Mốc 'Khảo sát & Thiết kế UI/UX' đã được chuyển sang Hoàn thành.",
        time: "2 giờ trước",
        read: true,
        type: "MILESTONE"
      },
      {
        id: "notif-03",
        title: "Nhắc nhở hạn nộp",
        message: "Mốc 'Bàn giao Thử nghiệm Nội bộ' đã quá hạn 5 ngày.",
        time: "1 ngày trước",
        read: true,
        type: "WARNING"
      }
    ]
  },

  projects: [
    {
      id: "prj-001",
      code: "WS-MOBILE",
      name: "WorkSphere Mobile Application",
      description: "Xây dựng ứng dụng di động nội bộ quản lý công việc, dự án, tài sản và hỗ trợ yêu cầu dịch vụ cho toàn bộ nhân viên WorkSphere trên Android và iOS.",
      status: "ACTIVE",
      priority: "HIGH",
      progressPercentage: 65,
      departmentName: "Phòng Kỹ thuật & Công nghệ",
      managerName: "Nguyễn An",
      managerId: "usr-001-an",
      startDate: "2026-09-01",
      targetEndDate: "2026-12-31",
      actualEndDate: null,
      version: 3,
      allowedActions: ["UPDATE", "CHANGE_STATUS", "MANAGE_MEMBERS", "MANAGE_MILESTONES"]
    },
    {
      id: "prj-002",
      code: "WS-BACKEND",
      name: "WorkSphere Modular Monolith Backend",
      description: "Hệ thống backend Spring Boot 3 kiến trúc Modular Monolith kết nối cơ sở dữ liệu PostgreSQL 15, xác thực JWT và phân quyền RBAC.",
      status: "ACTIVE",
      priority: "CRITICAL",
      progressPercentage: 90,
      departmentName: "Phòng Kỹ thuật & Công nghệ",
      managerName: "Trần Bình",
      managerId: "usr-002-binh",
      startDate: "2026-08-01",
      targetEndDate: "2026-11-15",
      actualEndDate: null,
      version: 5,
      allowedActions: ["VIEW"]
    },
    {
      id: "prj-003",
      code: "SEC-AUDIT-Q4",
      name: "Kiểm toán An toàn Bảo mật Q4",
      description: "Đánh giá lỗ hổng bảo mật định kỳ, kiểm toán quyền hạn người dùng và quét mã nguồn tĩnh hệ thống.",
      status: "ON_HOLD",
      priority: "MEDIUM",
      progressPercentage: 35,
      departmentName: "Phòng An ninh Thông tin",
      managerName: "Lê Minh",
      managerId: "usr-003-minh",
      startDate: "2026-10-01",
      targetEndDate: "2026-11-30",
      actualEndDate: null,
      version: 2,
      allowedActions: ["VIEW"]
    },
    {
      id: "prj-004",
      code: "HR-PORTAL",
      name: "Cổng Thông tin Nhân sự Nội bộ",
      description: "Hệ thống quản lý thông tin hồ sơ, chấm công và đánh giá nhân viên năm 2026.",
      status: "COMPLETED",
      priority: "LOW",
      progressPercentage: 100,
      departmentName: "Phòng Nhân sự",
      managerName: "Phạm Thu",
      managerId: "usr-004-thu",
      startDate: "2026-05-01",
      targetEndDate: "2026-09-30",
      actualEndDate: "2026-09-28",
      version: 4,
      allowedActions: ["VIEW"]
    }
  ],

  projectMembers: [
    {
      id: "mem-01",
      projectId: "prj-001",
      userId: "usr-001-an",
      fullName: "Nguyễn An",
      email: "nguyenan@worksphere.internal",
      role: "PROJECT_MANAGER",
      isActive: true,
      joinedAt: "2026-09-01",
      avatar: "NA",
      isLastProjectManager: true // Bắt buộc giữ theo Invariant D-013
    },
    {
      id: "mem-02",
      projectId: "prj-001",
      userId: "usr-002-binh",
      fullName: "Trần Bình",
      email: "tranbinh@worksphere.internal",
      role: "TEAM_LEADER",
      isActive: true,
      joinedAt: "2026-09-05",
      avatar: "TB",
      isLastProjectManager: false
    },
    {
      id: "mem-03",
      projectId: "prj-001",
      userId: "usr-003-minh",
      fullName: "Lê Minh",
      email: "leminh@worksphere.internal",
      role: "MEMBER",
      isActive: true,
      joinedAt: "2026-09-10",
      avatar: "LM",
      isLastProjectManager: false
    },
    {
      id: "mem-04",
      projectId: "prj-001",
      userId: "usr-004-thu",
      fullName: "Phạm Thu",
      email: "phamthu@worksphere.internal",
      role: "OBSERVER",
      isActive: true,
      joinedAt: "2026-09-12",
      avatar: "PT",
      isLastProjectManager: false
    }
  ],

  milestones: [
    {
      id: "mls-01",
      projectId: "prj-001",
      name: "Khảo sát & Thiết kế UI/UX Baseline",
      description: "Hoàn thành 14 tài liệu đặc tả thiết kế di động, ma trận trạng thái và quy chuẩn WCAG 2.1 AA.",
      status: "COMPLETED",
      dueDate: "2026-10-15",
      completedAt: "2026-10-15",
      progressPercentage: 100,
      orderIndex: 1
    },
    {
      id: "mls-02",
      projectId: "prj-001",
      name: "Visual Prototype & Đánh giá Trực quan",
      description: "Dựng bản mẫu trực quan HTML/CSS/JS mô phỏng chính xác hành vi và trạng thái trên Android 15.",
      status: "IN_PROGRESS",
      dueDate: "2026-10-25",
      completedAt: null,
      progressPercentage: 75,
      orderIndex: 2
    },
    {
      id: "mls-03",
      projectId: "prj-001",
      name: "Khởi tạo Mobile Shell & Authentication",
      description: "Khởi tạo dự án React Native TypeScript, tích hợp màn hình Splash, Login, Token Storage và Root Navigator.",
      status: "PLANNED",
      dueDate: "2026-11-10",
      completedAt: null,
      progressPercentage: 0,
      orderIndex: 3
    },
    {
      id: "mls-04",
      projectId: "prj-001",
      name: "Tích hợp Project & Task Management",
      description: "Kết nối API danh sách dự án, thành viên, mốc tiến độ và quản lý công việc Phase 7.",
      status: "PLANNED",
      dueDate: "2026-11-30",
      completedAt: null,
      progressPercentage: 0,
      orderIndex: 4
    },
    {
      id: "mls-05",
      projectId: "prj-001",
      name: "Bàn giao Báo cáo Thử nghiệm Nội bộ",
      description: "Chạy thử nghiệm trên Android Emulator emulator-5554, thu thập ảnh minh chứng cho báo cáo học phần.",
      status: "OVERDUE",
      dueDate: "2026-10-10",
      completedAt: null,
      progressPercentage: 40,
      orderIndex: 5
    }
  ],

  statusTransitions: {
    PLANNING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
    ON_HOLD: ["ACTIVE", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: []
  },

  statusConfig: {
    PLANNING: { label: "Lập kế hoạch", color: "#0284C7", bg: "#E0F2FE", icon: "clipboard" },
    ACTIVE: { label: "Đang thực hiện", color: "#16A34A", bg: "#DCFCE7", icon: "play-circle" },
    ON_HOLD: { label: "Tạm dừng", color: "#D97706", bg: "#FEF3C7", icon: "pause-circle" },
    COMPLETED: { label: "Hoàn thành", color: "#16A34A", bg: "#DCFCE7", icon: "check-circle" },
    CANCELLED: { label: "Đã hủy", color: "#DC2626", bg: "#FEE2E2", icon: "x-circle" },
    PLANNED: { label: "Đã lên lịch", color: "#0284C7", bg: "#E0F2FE", icon: "calendar" },
    IN_PROGRESS: { label: "Đang làm", color: "#2563EB", bg: "#DBEAFE", icon: "clock" },
    OVERDUE: { label: "Quá hạn", color: "#DC2626", bg: "#FEE2E2", icon: "alert-circle" }
  },

  priorityConfig: {
    CRITICAL: { label: "Khẩn cấp", color: "#DC2626", bg: "#FEE2E2", icon: "chevrons-up" },
    HIGH: { label: "Cao", color: "#EA580C", bg: "#FFEDD5", icon: "chevron-up" },
    MEDIUM: { label: "Trung bình", color: "#D97706", bg: "#FEF3C7", icon: "minus" },
    LOW: { label: "Thấp", color: "#64748B", bg: "#F1F5F9", icon: "chevron-down" }
  },

  roleConfig: {
    PROJECT_MANAGER: { label: "Project Manager", badgeBg: "#DBEAFE", badgeColor: "#1E40AF" },
    TEAM_LEADER: { label: "Team Leader", badgeBg: "#CCFBF1", badgeColor: "#0F766E" },
    MEMBER: { label: "Thành viên", badgeBg: "#F1F5F9", badgeColor: "#334155" },
    OBSERVER: { label: "Quan sát viên", badgeBg: "#FEF3C7", badgeColor: "#92400E" }
  }
};

if (typeof window !== "undefined") {
  window.SAMPLE_DATA = SAMPLE_DATA;
}
if (typeof globalThis !== "undefined") {
  globalThis.SAMPLE_DATA = SAMPLE_DATA;
}
