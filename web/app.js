const $ = (selector) => document.querySelector(selector);
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        char
      ])
  );
const localToday = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const today = new Date(`${localToday}T12:00:00+07:00`);
const dates = Array.from(
  { length: 7 },
  (_, offset) => new Date(today.getTime() + offset * 86400000)
);
const dateLabel = (date, options) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    ...options,
  }).format(date);
const tasks = [
  {
    id: "TSK-028",
    title: "Hoàn thiện cấu hình mạng văn phòng",
    project: "Hạ tầng văn phòng",
    progress: 65,
    status: "Đang thực hiện",
    offset: 0,
    handover: true,
    priority: "Ưu tiên cao",
  },
  {
    id: "TSK-031",
    title: "Kiểm tra kết nối máy in phòng Kinh doanh",
    project: "Hỗ trợ nội bộ",
    progress: 30,
    status: "Đang thực hiện",
    offset: 0,
    priority: "Thông thường",
  },
  {
    id: "TSK-034",
    title: "Rà soát tài liệu hướng dẫn kết nối VPN",
    project: "Hạ tầng văn phòng",
    progress: 0,
    status: "Cần thực hiện",
    offset: 1,
    priority: "Thông thường",
  },
  {
    id: "TSK-037",
    title: "Chuẩn bị checklist kiểm tra thiết bị",
    project: "Hỗ trợ nội bộ",
    progress: 0,
    status: "Cần thực hiện",
    offset: 3,
    priority: "Thông thường",
  },
];
const personas = {
  employee: {
    name: "Hải",
    full: "Hải Nguyễn",
    initial: "H",
    position: "Nhân viên · Phòng IT",
    rights: [
      "Xem công việc được giao và dự án mình tham gia",
      "Cập nhật phần việc đang phụ trách",
      "Gửi và theo dõi yêu cầu hỗ trợ của mình",
      "Rà soát phần việc bàn giao; giữ nguyên lịch sử và tiến độ",
    ],
    limits:
      "Không phân công thay quản lý, không quản lý tài khoản, không xem dự án ngoài phạm vi.",
  },
  manager: {
    name: "Hùng",
    full: "Hùng Trần",
    initial: "H",
    position: "Quản lý · Phòng IT",
    rights: [
      "Các quyền cá nhân của một nhân viên",
      "Điều phối hàng đợi IT khi được cấp quyền",
      "Quản lý công việc trong các dự án được phân công",
      "Theo dõi việc cần bàn giao và chọn người nhận phù hợp",
    ],
    limits:
      "Chức vụ trưởng phòng không tự cấp quyền vào mọi dự án hoặc hàng đợi phòng khác. Hàng đợi phòng ban hiện là bố cục đề xuất.",
  },
  admin: {
    name: "Admin",
    full: "Quản trị hệ thống",
    initial: "A",
    position: "Quản trị · An Phát",
    rights: [
      "Quản lý tài khoản và quyền theo cấu hình hệ thống",
      "Xếp nhân viên vào phòng ban và bổ nhiệm quản lý",
      "Thu hồi quyền truy cập khi tài khoản ngừng hoạt động",
      "Can thiệp nghiệp vụ theo quyền được cấp và có lưu lịch sử",
    ],
    limits: "Mọi thay đổi tài khoản cần có lý do và giữ lại lịch sử.",
  },
};
const state = {
  persona: "employee",
  filter: "all",
  day: 0,
  view: "overview",
  reviewed: false,
  issues: [],
  dialogFocus: null,
};
const dialog = $("#detail-dialog");
const notify = (message) => {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => ($("#toast").hidden = true), 4200);
};
function openDialog(content) {
  state.dialogFocus = document.activeElement;
  $("#dialog-body").innerHTML = content;
  dialog.showModal();
}
dialog.addEventListener("close", () => state.dialogFocus?.focus());
$("#dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  }
});
function renderTasks() {
  const query = $("#search").value.trim().toLocaleLowerCase("vi");
  const visible = tasks.filter(
    (task) =>
      (state.filter !== "progress" || task.progress > 0) &&
      (state.filter !== "handover" || task.handover) &&
      `${task.title} ${task.id}`.toLocaleLowerCase("vi").includes(query)
  );
  $("#task-grid").innerHTML = visible
    .map(
      (task) =>
        `<button class="task-card" data-task="${
          task.id
        }" aria-label="Xem ${escape(
          task.title
        )}"><span class="project-label"><span><em></em>${escape(
          task.project
        )}</span><span>↗</span></span><h3>${escape(
          task.title
        )}</h3><span class="tag ${
          task.handover ? "purple" : task.progress === 0 ? "neutral" : ""
        }">${
          task.handover ? "Tiếp nhận từ Lan" : escape(task.status)
        }</span><div class="progress-line" aria-hidden="true"><i style="width:${
          task.progress
        }%"></i></div><span class="card-footer"><span>${
          task.progress
        }% hoàn thành</span><span>◷ ${dateLabel(dates[task.offset], {
          day: "2-digit",
          month: "2-digit",
        })}</span></span>${
          task.handover
            ? `<p class="handover-hint">${
                state.reviewed
                  ? "✓ Đã ghi nhận rà soát · Tiến độ giữ nguyên"
                  : "↳ Cần rà soát phần đã làm trước khi tiếp tục"
              }</p>`
            : ""
        }</button>`
    )
    .join("");
  $("#empty-tasks").hidden = visible.length > 0;
}
function renderDays() {
  $("#days").innerHTML = dates
    .map(
      (date, index) =>
        `<button class="day ${
          state.day === index ? "selected" : ""
        }" data-day="${index}" aria-pressed="${
          state.day === index
        }" aria-label="${escape(
          dateLabel(date, { weekday: "long", day: "numeric", month: "numeric" })
        )}"><span>${dateLabel(date, { weekday: "short" }).replace(
          "Th ",
          "T"
        )}</span><b>${dateLabel(date, { day: "2-digit" })}</b></button>`
    )
    .join("");
  $("#month-label").textContent = dateLabel(dates[state.day], {
    month: "long",
    year: "numeric",
  });
  $("#agenda-day").textContent =
    state.day === 0
      ? "Hôm nay"
      : dateLabel(dates[state.day], {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        });
  const selected = tasks.filter((task) => task.offset === state.day);
  $("#agenda-items").innerHTML = selected.length
    ? selected
        .map(
          (task, index) =>
            `<div class="schedule-item"><span class="schedule-time">${
              index === 0 ? "09:00" : "14:00"
            }</span><div class="schedule-card ${
              index === 0 ? "lime-border" : ""
            }"><h3>${escape(task.title)}</h3><p>${
              task.handover
                ? "Xem kết quả của Lan và tiếp tục từ 65%"
                : escape(task.project)
            }</p><span class="duration">${
              index === 0 ? "09:00 – 10:30" : "14:00 – 15:00"
            } · Khung làm việc dự kiến</span></div></div>`
        )
        .join("")
    : '<p class="empty">Chưa có công việc minh họa trong ngày này.<br>Bạn có thể xem các ngày tiếp theo.</p>';
}
function detail(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;
  openDialog(
    `<span class="tag ${task.handover ? "purple" : ""}">${task.id} · ${escape(
      task.status
    )}</span><h2 id="dialog-title">${escape(task.title)}</h2><p>${escape(
      task.project
    )} · ${escape(task.priority)}</p><div class="dialog-progress"><strong>${
      task.progress
    }%</strong><div class="progress-line"><i style="width:${
      task.progress
    }%"></i></div><p>${
      task.handover
        ? "Tiến độ của Lan được giữ nguyên khi Hải tiếp nhận."
        : "Tiến độ công việc minh họa."
    }</p></div>${
      task.handover
        ? `<div class="notice">Hải chịu trách nhiệm kiểm tra phần đã làm, xác định phần cần tiếp tục và ghi nhận vấn đề. Xác nhận rà soát không đồng nghĩa công việc đã hoàn thành.</div><div class="detail-history"><p><b>Lan</b> · Hoàn tất cấu hình cơ bản và đính kèm hướng dẫn.<br><span class="muted">Lịch sử trước bàn giao · 65%</span></p><p><b>Hùng</b> · Phân công Hải tiếp tục công việc.<br><span class="muted">Không thay tác giả của các cập nhật trước.</span></p>${state.issues
            .map(
              (issue) =>
                `<p><b>Hải</b> · Ghi nhận khi rà soát: ${escape(issue)}</p>`
            )
            .join(
              ""
            )}</div><form id="review-form"><label class="check-row"><input type="checkbox" required ${
            state.reviewed ? "checked" : ""
          }>Tôi đã xem lịch sử và kết quả Lan để lại.</label><label class="check-row"><input type="checkbox" required ${
            state.reviewed ? "checked" : ""
          }>Tôi đã xác định phần cần kiểm tra hoặc tiếp tục.</label><div class="dialog-actions"><button class="primary-button" type="submit">Ghi nhận đã rà soát</button><button class="text-button" id="issue-open" type="button">Ghi nhận vấn đề ↗</button></div></form>`
        : "<p>Công việc được hiển thị trong lịch cá nhân theo ngày dự kiến. Bạn có thể theo dõi ngày dự kiến và phần việc cần tiếp tục tại đây.</p>"
    }`
  );
}
function rights() {
  const person = personas[state.persona];
  openDialog(
    `<h2 id="dialog-title">Phạm vi của ${escape(person.name)}</h2><p>${escape(
      person.position
    )}</p><ul class="rights-list">${person.rights
      .map((right) => `<li><span>✓</span>${escape(right)}</li>`)
      .join("")}</ul><p>${escape(
      person.limits
    )}</p><div class="notice">Đây là bố cục minh họa theo vai trò. Các thay đổi trong bản xem trước chưa được lưu vào hệ thống nội bộ.</div>`
  );
}
const titles = {
  overview: "Tổng quan",
  calendar: "Lịch công việc",
  assigned: "Việc được giao",
  requests: "Yêu cầu hỗ trợ",
  queue: "Hàng đợi IT",
  accounts: "Tài khoản nội bộ",
};
function view(name) {
  if (
    (name === "queue" && state.persona !== "manager") ||
    (name === "accounts" && state.persona !== "admin")
  ) {
    notify("Bố cục này không thuộc vai trò đang xem.");
    return;
  }
  state.view = name;
  $("#view-title").textContent = titles[name];
  document
    .querySelectorAll(".nav")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.view === name)
    );
  const overview = ["overview", "assigned", "calendar"].includes(name);
  $("#overview").hidden = !overview;
  $("#secondary-view").hidden = overview;
  if (overview) {
    $(".hero").hidden = name !== "overview";
    $(".stats").hidden = name === "calendar";
    $(".work-section").hidden = name === "calendar";
    $(".handover-banner").hidden = name === "calendar";
    $(".layout").style.gridTemplateColumns =
      name === "calendar" ? "minmax(0, 680px)" : "";
    $(".main-column").hidden = name === "calendar";
    return;
  }
  const rows =
    name === "accounts"
      ? [
          ["Hải Nguyễn", "IT", "Đang hoạt động"],
          ["Lan", "IT", "Ngừng hoạt động"],
          ["Hùng Trần", "IT", "Quản lý đang hoạt động"],
        ]
      : name === "queue"
      ? [
          [
            "SR-026 · Không kết nối được máy in",
            "Kinh doanh → IT",
            "Chờ phân công",
          ],
          ["SR-027 · Phần mềm gặp lỗi khi mở", "Hành chính → IT", "Đang xử lý"],
        ]
      : [
          ["SR-021 · Hỗ trợ phòng họp", "Hành chính", "Đang xử lý"],
          ["SR-024 · Kiểm tra thiết bị", "Hành chính", "Đã giải quyết"],
        ];
  const intro =
    name === "accounts"
      ? "Bố cục danh sách nhân viên. Tài khoản ngừng hoạt động được giữ để truy vết lịch sử."
      : name === "queue"
      ? "Bố cục hàng đợi phòng IT. Các yêu cầu được nhóm theo phòng tiếp nhận để người điều phối theo dõi."
      : "Các yêu cầu do bạn gửi và tình trạng xử lý tương ứng.";
  $("#secondary-view").innerHTML = `<section class="secondary-card"><h2>${
    titles[name]
  }</h2><p>${intro}</p><table class="preview-table"><thead><tr><th>${
    name === "accounts" ? "Nhân viên" : "Yêu cầu"
  }</th><th>Phòng ban</th><th>Trạng thái</th></tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr>${row.map((value) => `<td>${escape(value)}</td>`).join("")}</tr>`
    )
    .join(
      ""
    )}</tbody></table><p>Dữ liệu minh họa để duyệt giao diện; chưa thay đổi dữ liệu nội bộ.</p></section>`;
}
document.addEventListener("click", (event) => {
  const task = event.target.closest("[data-task]");
  if (task) detail(task.dataset.task);
  const day = event.target.closest("[data-day]");
  if (day) {
    state.day = Number(day.dataset.day);
    renderDays();
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    state.filter = filter.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.classList.toggle("selected", button === filter);
      button.setAttribute("aria-pressed", String(button === filter));
    });
    renderTasks();
  }
  const navigation = event.target.closest("[data-view]");
  if (navigation) view(navigation.dataset.view);
  if (event.target.closest("#issue-open")) {
    openDialog(
      '<h2 id="dialog-title">Ghi nhận khi rà soát</h2><p>Mô tả phần chưa rõ hoặc cần sửa. Nội dung sẽ gắn với Hải; lịch sử của Lan và tiến độ 65% vẫn được giữ.</p><form id="issue-form"><label for="issue-text">Nội dung rà soát</label><p><textarea id="issue-text" required maxlength="1000" placeholder="Ví dụ: cần kiểm tra lại kết nối ở tầng 2..."></textarea></p><button class="primary-button">Lưu ghi nhận minh họa</button></form>'
    );
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "review-form") {
    event.preventDefault();
    state.reviewed = true;
    $("#review-count").textContent = "00";
    $("#review-summary").textContent = "Đã ghi nhận rà soát";
    $("#review-activity").innerHTML =
      '<div class="activity-line"><span class="avatar tiny lime">H</span><div><p><b>Hải</b> đã ghi nhận rà soát bàn giao.</p><small>Tiến độ vẫn là 65% · Bản xem trước</small></div></div>';
    renderTasks();
    dialog.close();
    notify("Đã ghi nhận trong bản xem trước. Tiến độ giữ nguyên 65%.");
  }
  if (event.target.id === "issue-form") {
    event.preventDefault();
    const text = $("#issue-text").value.trim();
    if (!text) {
      $("#issue-text").focus();
      return;
    }
    state.issues.push(text);
    dialog.close();
    detail("TSK-028");
    notify("Đã thêm ghi nhận minh họa của Hải.");
  }
});
$("#search").addEventListener("input", renderTasks);
$("#persona").addEventListener("change", (event) => {
  state.persona = event.target.value;
  const person = personas[state.persona];
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date())
  );
  $("#greeting").innerHTML = `Chào ${
    hour < 11 ? "buổi sáng" : hour < 18 ? "buổi chiều" : "buổi tối"
  }, ${escape(person.name)}<span>✦</span>`;
  $("#profile-name").innerHTML = `${escape(person.full)}<small>${escape(
    person.position
  )}</small>`;
  $("#profile-initial").textContent = person.initial;
  $("#mobile-profile").textContent = person.initial;
  document.querySelector('[data-view="queue"]').hidden =
    state.persona !== "manager";
  document.querySelector('[data-view="accounts"]').hidden =
    state.persona !== "admin";
  view("overview");
});
$("#profile-button").addEventListener("click", rights);
$("#mobile-profile").addEventListener("click", rights);
$("#access-button").addEventListener("click", rights);
$("#notifications").addEventListener("click", () =>
  openDialog(
    '<h2 id="dialog-title">Thông báo của bạn</h2><div class="detail-history"><p><b>Tiếp nhận công việc từ Lan</b><br>Hùng đã bàn giao công việc cấu hình mạng cho Hải. Tiến độ hiện tại: 65%.</p><p><b>Nhắc việc sắp đến hạn</b><br>Kiểm tra tài liệu hướng dẫn VPN trong lịch ngày mai.</p></div><button class="primary-button" id="notification-review">Xem việc được bàn giao</button>'
  )
);
document.addEventListener("click", (event) => {
  if (event.target.closest("#notification-review")) {
    dialog.close();
    detail("TSK-028");
  }
});
$("#hero-action").addEventListener("click", () => {
  state.day = 0;
  renderDays();
  $(".work-section").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#all-work").addEventListener("click", () => view("assigned"));
$("#handover-open").addEventListener("click", () => detail("TSK-028"));
$("#today-label").textContent = dateLabel(today, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
$("#persona").dispatchEvent(new Event("change"));
renderTasks();
renderDays();
