// Organization workflows use the same authenticated API as work and support.
export function createPeopleUI(env) {
  const { api, esc, field, form, btn, heading, fmt, parseCsv } = env;
  let qrTimer, stationId;
  let stationRows = [];
  let rows = [],
    directoryPage = 0,
    directoryQuery = "",
    batch = null,
    stepSecret = "",
    backupCodes = [];
  const C = () => env.context();
  const cap = (code) => C().capabilities.includes(code);
  const owns = (dept) =>
    C().authorities?.some(
      (a) => a.department_id === dept && a.executive_id === C().user.id
    ) && cap("EXECUTIVE");
  const manager = (dept) =>
    C().departments.some((d) => d.id === dept && d.manager_id === C().user.id);
  const option = (u) => ({ value: u.id, label: u.full_name });
  const deptOptions = () =>
    C()
      .departments.filter((d) => d.is_active)
      .map((d) => ({ value: d.id, label: d.name }));
  const button = (action, label, id = "", style = "small") =>
    btn("p-" + action, label, style, id);
  const labels = {
    DRAFT: "Nháp · chờ HR kiểm tra",
    SUBMITTED: "Chờ phê duyệt",
    APPROVED: "Đã phê duyệt",
    REJECTED: "Đã từ chối",
    CLOSED: "Hoàn tất hồ sơ",
    PENDING: "Chờ xem xét",
    DONE: "Đã thực hiện",
    OPERATIONS: "Điều phối & nghiệm thu",
    TIME: "Xem xét công/nghỉ/tăng ca",
    LOCK: "Khóa truy cập",
    UNLOCK: "Mở khóa",
    OFFBOARD: "Thu hồi khi ngừng làm việc",
    CHANGE_ACCESS: "Thay đổi quyền/phòng",
  };
  const select = (name, label, choices, required = true) =>
    field(name, label, "select", { choices, required });
  const decision = (title, path, row, action) =>
    form(
      title,
      field("reason", "Căn cứ / nội dung xác nhận", "textarea", { max: 2000 }),
      (v) =>
        api(path, {
          method: "POST",
          body: { ...v, action, version: row.version },
        })
    );
  async function directory() {
    const data = await api(
      `/workplace/directory?page=${directoryPage}&search=${encodeURIComponent(
        directoryQuery
      )}`
    );
    return (
      heading(
        "Phòng ban của tôi",
        "Tìm đúng đồng nghiệp; các đầu mối liên phòng được tách riêng."
      ) +
      `<div class="filters"><input id="directory-query" aria-label="Tìm người trong phòng" placeholder="Tên hoặc mã nhân viên" value="${esc(
        directoryQuery
      )}">${button("directory-search", "Tìm kiếm")}</div><p class="muted">${
        data.total
      } thành viên · 20 người/trang</p><div class="cards">${
        data.items
          .map(
            (u) =>
              `<article class="panel"><h3>${esc(
                u.full_name
              )}</h3><p class="muted">${esc(u.employee_code)} · ${esc(
                u.is_manager ? "Trưởng phòng" : u.job_title
              )}</p><small>${esc(u.department_name)}</small></article>`
          )
          .join("") ||
        '<div class="panel">Chưa có thành viên trong phạm vi của bạn.</div>'
      }</div><div class="pager">${
        directoryPage ? button("directory-prev", "Trang trước") : ""
      }<span>Trang ${data.page + 1}</span>${
        (directoryPage + 1) * 20 < data.total
          ? button("directory-next", "Trang sau")
          : ""
      }</div><div class="section-head"><h2>Đầu mối hỗ trợ</h2></div><div class="cards">${data.contacts
        .map(
          (x) =>
            `<article class="panel"><h3>${esc(x.department_name)}</h3><p>${esc(
              x.name
            )}</p><a class="btn small" href="#requests">Mở yêu cầu hỗ trợ</a></article>`
        )
        .join("")}</div>`
    );
  }
  async function delegations() {
    rows = await api("/workplace/delegations");
    return (
      heading(
        "Phụ trách thay có thời hạn",
        "Chỉ có quyền trong phạm vi được giao; không tự duyệt hồ sơ của mình.",
        button("delegate", "Chỉ định người thay", "", "primary")
      ) +
      `<div class="cards">${
        rows
          .map(
            (r) =>
              `<article class="panel"><h3>${esc(r.delegate_name)}</h3><p>${esc(
                r.department_name
              )} · ${esc(labels[r.scope])}</p><p class="muted">${fmt(
                r.starts_at,
                true
              )} → ${fmt(r.ends_at, true)}</p><p class="detail-copy">${esc(
                r.reason
              )}</p><small>Người giao: ${esc(
                r.granted_name
              )}</small><div class="row">${
                r.revoked_at
                  ? "Đã thu hồi"
                  : new Date(r.ends_at) < new Date()
                  ? "Đã hết hạn"
                  : manager(r.department_id) || owns(r.department_id)
                  ? button("revoke", "Thu hồi", r.id, "danger small")
                  : "Được chỉ định phụ trách thay"
              }</div></article>`
          )
          .join("") ||
        '<div class="panel">Chưa có chỉ định trong phạm vi của bạn.</div>'
      }</div>`
    );
  }
  async function personnel() {
    rows = await api("/workplace/personnel");
    return (
      heading(
        "Hồ sơ ngừng làm việc",
        "Quyết định, bàn giao, truy cập và đối soát được theo dõi độc lập.",
        C().executive && !C().user.department_id
          ? ""
          : button("new-case", "Tạo đề nghị", "", "primary")
      ) +
      `<div class="stack">${
        rows
          .map((r) => {
            const actions = [];
            const self = r.user_id === C().user.id;
            if (!self && r.status === "DRAFT" && cap("HR_MANAGE"))
              actions.push(["SUBMIT", "HR kiểm tra & gửi duyệt"]);
            if (
              !self &&
              r.status === "SUBMITTED" &&
              owns(r.department_id) &&
              r.created_by !== C().user.id &&
              r.checked_by !== C().user.id
            )
              actions.push(["APPROVE", "Phê duyệt"], ["REJECT", "Từ chối"]);
            if (!self && r.status === "APPROVED") {
              if (
                !r.handover_done &&
                (manager(r.department_id) ||
                  owns(r.department_id) ||
                  C().managedDepartments.includes(r.department_id))
              )
                actions.push(["HANDOVER_DONE", "Xác nhận đã bàn giao"]);
              if (!r.payroll_done && cap("PAYROLL_MANAGE"))
                actions.push(["PAYROLL_DONE", "Xác nhận đối soát hoàn tất"]);
              if (
                r.handover_done &&
                r.access_done &&
                r.payroll_done &&
                cap("HR_MANAGE")
              )
                actions.push(["CLOSE", "Hoàn tất hồ sơ"]);
            }
            return `<article class="panel"><div class="section-head"><div><h2>${esc(
              r.full_name
            )}</h2><small>${esc(
              r.department_name || "Chưa gán phòng"
            )}</small></div><span class="pill">${esc(
              labels[r.status]
            )}</span></div><p class="detail-copy">${esc(
              r.reason
            )}</p><p>Mốc ngừng truy cập: <strong>${fmt(
              r.effective_at,
              true
            )}</strong></p><p class="muted">${esc(
              r.decision_reference || "Chưa có căn cứ phê duyệt"
            )}</p><div class="checklist"><span>${
              r.handover_done ? "✓" : "○"
            } Bàn giao</span><span>${
              r.access_done ? "✓" : "○"
            } Thu hồi truy cập</span><span>${
              r.payroll_done ? "✓" : "○"
            } Đối soát</span></div><div class="row wrap">${actions
              .map(([a, l]) => button("case", l, r.id + "|" + a))
              .join("")}</div></article>`;
          })
          .join("") ||
        '<div class="panel">Chưa có hồ sơ trong phạm vi của bạn.</div>'
      }</div>`
    );
  }
  async function accessRequests() {
    rows = await api("/workplace/access-requests");
    return (
      heading(
        "Yêu cầu quản trị truy cập",
        "Tách đề nghị và phê duyệt nghiệp vụ khỏi bước quản trị thực hiện.",
        !C().admin ? button("access-new", "Tạo đề nghị", "", "primary") : ""
      ) +
      `<div class="stack">${
        rows
          .map(
            (r) =>
              `<article class="panel"><div class="section-head"><h3>${esc(
                r.full_name
              )} · ${esc(labels[r.request_type])}</h3><span class="pill">${esc(
                labels[r.status]
              )}</span></div><p class="detail-copy">${esc(
                r.reason
              )}</p><div class="row wrap">${
                r.status === "PENDING" &&
                cap("EXECUTIVE") &&
                r.user_id !== C().user.id &&
                r.created_by !== C().user.id
                  ? button("access", "Phê duyệt", r.id + "|APPROVE") +
                    button("access", "Từ chối", r.id + "|REJECT")
                  : ""
              }${
                r.status === "APPROVED" && C().admin
                  ? r.request_type === "CHANGE_ACCESS"
                    ? '<a class="btn small" href="#accounts">Thực hiện đổi quyền</a>' +
                      button(
                        "access",
                        "Ghi nhận đã thực hiện",
                        r.id + "|COMPLETE"
                      )
                    : button("access", "Thực hiện", r.id + "|EXECUTE")
                  : ""
              }</div></article>`
          )
          .join("") ||
        '<div class="panel">Không có đề nghị trong phạm vi của bạn.</div>'
      }</div>`
    );
  }
  async function approvals() {
    const cases = await api("/workplace/personnel"),
      requests = await api("/workplace/access-requests");
    const personnel = cases.filter(
      (r) =>
        r.status === "SUBMITTED" &&
        owns(r.department_id) &&
        r.user_id !== C().user.id &&
        r.created_by !== C().user.id &&
        r.checked_by !== C().user.id
    ).length;
    const access = requests.filter(
      (r) =>
        r.status === "PENDING" &&
        r.user_id !== C().user.id &&
        r.created_by !== C().user.id
    ).length;
    return (
      heading(
        "Việc cần phê duyệt",
        "Xem căn cứ và phạm vi trước khi quyết định; không tự duyệt."
      ) +
      `<div class="cards">${[
        ["personnel", "Hồ sơ nhân sự", personnel],
        ["access", "Đề nghị truy cập", access],
        ["time", "Công, nghỉ & tăng ca", "Xem hồ sơ"],
        ["payroll", "Bảng tính lương", "Xem bảng"],
        ["work", "Công việc thuộc phòng phụ trách", "Xem công việc"],
      ]
        .map(
          ([v, t, n]) =>
            `<a href="#${v}" class="work-card"><h2>${esc(
              t
            )}</h2><p class="detail-copy">${esc(
              n
            )}</p><span class="muted">Mở danh sách →</span></a>`
        )
        .join("")}</div>`
    );
  }
  async function security() {
    const data = await api("/me/two-factor");
    return (
      heading(
        "Bảo mật tài khoản",
        "Mật khẩu, phiên thiết bị và xác thực hai bước."
      ) +
      `<section class="panel"><h2>Xác thực hai bước</h2><p class="detail-copy">${
        data.enabled
          ? "Đã bật. Khi đăng nhập cần mã ứng dụng xác thực hoặc một mã dự phòng chưa dùng."
          : "Chưa bật. Nên bật cho tài khoản quản trị và người có quyền nhạy cảm."
      }</p>${
        data.enabled
          ? button("mfa-disable", "Tắt và thu hồi các phiên", "", "danger")
          : button(
              "mfa-setup",
              "Thiết lập bằng ứng dụng xác thực",
              "",
              "primary"
            )
      }</section><section class="panel"><h2>Mật khẩu và phiên</h2><div class="row wrap">${btn(
        "change-password",
        "Đổi mật khẩu",
        "small"
      )}${btn("logout-all", "Đăng xuất mọi thiết bị", "small")}</div></section>`
    );
  }
  async function importView() {
    return (
      heading(
        "Nhập tài khoản hàng loạt",
        "Kiểm tra trước khi tạo; mỗi người nhận một liên kết kích hoạt riêng.",
        button("import-file", "Chọn CSV", "", "primary") +
          button("import-template", "Tải mẫu CSV")
      ) +
      `<section class="panel"><p>Cột CSV: <code>username,email,fullName,departmentCode</code>. Mỗi dòng là một nhân viên, tối đa 200 dòng. Điền mã phòng IT, KD hoặc HCNS theo bảng bên dưới.</p><p class="muted">Không chứa mật khẩu. Tài khoản chỉ hoạt động sau khi chủ tài khoản kích hoạt và đặt mật khẩu.</p><div class="table-wrap"><table class="compact"><thead><tr><th>Phòng</th><th>Mã phòng để nhập CSV</th></tr></thead><tbody>${C()
        .departments.map(
          (d) =>
            `<tr><td>${esc(d.name)}</td><td><code>${esc(
              d.code
            )}</code></td></tr>`
        )
        .join("")}</tbody></table></div></section>${
        batch
          ? `<section class="panel"><h2>Kết quả xem trước</h2><div class="table-wrap"><table><thead><tr><th>Dòng</th><th>Tài khoản</th><th>Email</th><th>Kiểm tra</th></tr></thead><tbody>${batch.result.rows
              .map(
                (r) =>
                  `<tr><td>${r.line}</td><td>${esc(r.username)}</td><td>${esc(
                    r.email
                  )}</td><td>${esc(r.errors.join("; ") || "Hợp lệ")}</td></tr>`
              )
              .join("")}</tbody></table></div>${
              batch.result.valid
                ? button(
                    "import-confirm",
                    "Tạo toàn bộ tài khoản đã kiểm tra",
                    "",
                    "primary"
                  )
                : "Sửa các dòng lỗi và chọn tệp lại."
            }</section>`
          : ""
      }`
    );
  }
  async function stations() {
    const list = await api("/workplace/attendance/stations");
    let active = list.find((x) => x.id === stationId && x.is_active);
    stationRows = list;
    let qr = null,
      qrError = "";
    if (active) {
      try {
        qr = await api(
          "/workplace/attendance/stations/" + active.id + "/challenge",
          { method: "POST" }
        );
      } catch (e) {
        qrError = e.message || "Điểm chưa mở QR; kiểm tra giờ hoạt động.";
      }
    }
    if (qr) qrTimer = setTimeout(renewQr, 30000);
    return (
      heading(
        "Điểm chấm công QR",
        "Mở ứng dụng WorkSphere trên điện thoại, vào Chấm công và quét mã tại đây. Thời gian ghi nhận do máy chủ quyết định.",
        button("station-new", "Thêm điểm chấm công", "", "primary")
      ) +
      `<div class="cards">${
        list
          .map(
            (x) =>
              `<section class="panel"><h3>${esc(x.name)}</h3><p class="muted">${
                x.is_active ? "Đang hoạt động" : "Đã đóng"
              }</p><p class="muted">${esc(x.opens_at)}–${esc(x.closes_at)} · ${
                x.allowed_cidrs
                  ? "Đã cấu hình mạng văn phòng"
                  : "Chưa cấu hình mạng — lượt chấm cần xác minh"
              }</p><div class="row wrap">${button(
                "station-config",
                "Giờ mở & mạng",
                x.id
              )}${
                x.is_active
                  ? button("station-show", "Mở màn hình QR", x.id)
                  : ""
              }${button(
                "station-state",
                x.is_active ? "Đóng điểm" : "Mở lại",
                x.id + "|" + String(!x.is_active)
              )}</div></section>`
          )
          .join("") ||
        '<section class="panel">Chưa cấu hình điểm chấm công.</section>'
      }</div>${qrError ? `<div class="error-box">${esc(qrError)}</div>` : ""}${
        qr
          ? `<section class="panel station-display"><span class="eyebrow">ĐIỂM CHẤM CÔNG · ${esc(
              qr.stationName
            )}</span><h2>Quét tại văn phòng</h2><img id="station-qr" src="${esc(
              qr.image
            )}" width="288" height="288" alt="QR chấm công xoay vòng"><p id="station-expires" class="muted">Mã hiện tại hết hạn ${fmt(
              qr.expiresAt,
              true
            )} · tự đổi sau 30 giây</p><p>Mỗi người đăng nhập tài khoản của mình để quét vào hoặc ra ca. Không chia sẻ mã chấm công.</p></section>`
          : ""
      }`
    );
  }
  async function renewQr() {
    if (!document.querySelector("#station-qr") || !C()) return;
    try {
      const qr = await api(
        "/workplace/attendance/stations/" + stationId + "/challenge",
        { method: "POST" }
      );
      if (!document.querySelector("#station-qr")) return;
      document.querySelector("#station-qr").src = qr.image;
      document.querySelector("#station-expires").textContent =
        "Mã hết hạn " + fmt(qr.expiresAt, true) + " · tự đổi sau 30 giây";
      qrTimer = setTimeout(renewQr, 30000);
    } catch {
      if (document.querySelector("#station-qr")) {
        document.querySelector("#station-qr").removeAttribute("src");
        document.querySelector("#station-expires").textContent =
          "Chưa cập nhật được mã. Tải lại trước khi chấm công.";
      }
    }
  }
  async function action(name, id) {
    if (!name.startsWith("p-")) return false;
    switch (name.slice(2)) {
      case "import-template": {
        const content =
          "username,email,fullName,departmentCode\r\nnhanvien.moi,nhanvien@example.invalid,Nhân viên mới," +
          (C().departments.find((d) => d.is_active)?.code || "IT") +
          "\r\n";
        const url = URL.createObjectURL(
          new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "mau-nhap-nhan-vien.csv";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        break;
      }

      case "station-config": {
        const row = stationRows.find((x) => x.id === id);
        form(
          "Giờ mở & mạng văn phòng",
          field("opensAt", "Mở điểm từ", "time", {
            value: row.opens_at.slice(0, 5),
          }) +
            field("closesAt", "Đóng điểm lúc", "time", {
              value: row.closes_at.slice(0, 5),
            }) +
            field(
              "allowedCidrs",
              "IP/CIDR văn phòng (cách nhau bằng dấu phẩy)",
              "textarea",
              { value: row.allowed_cidrs, required: false, max: 2048 }
            ),
          (v) =>
            api("/workplace/attendance/stations/" + id, {
              method: "PUT",
              body: v,
            }),
          {
            intro:
              "Máy chủ đối chiếu địa chỉ kết nối thực, không tin IP do điện thoại tự khai. Để trống sẽ cảnh báo chưa cấu hình; USB/VPN không chứng minh hiện diện. Đổi cấu hình làm hết hạn mã đang hiển thị; mở lại QR sau khi lưu. Ca ban ngày 06:00–22:00.",
          }
        );
        break;
      }
      case "station-new":
        form(
          "Thêm điểm chấm công",
          field("name", "Tên điểm (ví dụ: Văn phòng tầng 2)", "text", {
            max: 100,
          }) +
            field("opensAt", "Mở điểm từ", "time", { value: "06:00" }) +
            field("closesAt", "Đóng điểm lúc", "time", { value: "22:00" }) +
            field(
              "allowedCidrs",
              "IP/CIDR văn phòng (để trống nếu chưa có)",
              "textarea",
              { required: false, max: 2048 }
            ),
          (v) =>
            api("/workplace/attendance/stations", { method: "POST", body: v })
        );
        break;
      case "station-show":
        stationId = id;
        await env.route();
        break;
      case "station-state": {
        const [key, value] = id.split("|");
        form(
          "Trạng thái điểm chấm công",
          "<p>QR của điểm đã đóng sẽ bị từ chối ngay.</p>",
          () =>
            api("/workplace/attendance/stations/" + key, {
              method: "PUT",
              body: { active: value === "true" },
            })
        );
        break;
      }

      case "directory-search":
        directoryQuery = document.querySelector("#directory-query").value;
        directoryPage = 0;
        await env.route();
        break;
      case "directory-prev":
        directoryPage = Math.max(0, directoryPage - 1);
        await env.route();
        break;
      case "directory-next":
        directoryPage++;
        await env.route();
        break;
      case "delegate": {
        const depts = C().departments.filter(
          (d) => manager(d.id) || owns(d.id)
        );
        const first = depts[0]?.id;
        if (!first)
          throw new Error("Chưa có phòng được giao quyền chỉ định thay thế.");
        form(
          "Chỉ định người phụ trách thay",
          select(
            "departmentId",
            "Phòng ban",
            depts.map((d) => ({ value: d.id, label: d.name }))
          ) +
            select(
              "delegateId",
              "Người thay thế",
              C()
                .people.filter(
                  (u) =>
                    u.department_id === first &&
                    u.id !== C().user.id &&
                    !C().departments.some((d) => d.manager_id === u.id)
                )
                .map(option)
            ) +
            select("scope", "Phạm vi", [
              { value: "OPERATIONS", label: labels.OPERATIONS },
              { value: "TIME", label: labels.TIME },
            ]) +
            field("startsAt", "Bắt đầu", "datetime-local") +
            field("endsAt", "Kết thúc", "datetime-local") +
            field("reason", "Căn cứ giao quyền", "textarea"),
          (v) =>
            api("/workplace/delegations", {
              method: "POST",
              body: {
                ...v,
                startsAt: new Date(v.startsAt).toISOString(),
                endsAt: new Date(v.endsAt).toISOString(),
              },
            })
        );
        document
          .querySelector("#f-departmentId")
          .addEventListener("change", (e) => {
            document.querySelector("#f-delegateId").innerHTML = C()
              .people.filter(
                (u) =>
                  u.department_id === e.target.value &&
                  u.id !== C().user.id &&
                  !C().departments.some((d) => d.manager_id === u.id)
              )
              .map(
                (u) => `<option value="${u.id}">${esc(u.full_name)}</option>`
              )
              .join("");
          });
        break;
      }
      case "revoke":
        decision(
          "Thu hồi phụ trách thay",
          "/workplace/delegations/" + id + "/revoke",
          rows.find((r) => r.id === id),
          "REVOKE"
        );
        break;
      case "new-case": {
        const people = (await api("/workplace/time/people")).filter(
          (u) =>
            cap("HR_MANAGE") || u.id === C().user.id || manager(u.department_id)
        );
        form(
          "Đề nghị ngừng làm việc",
          select("userId", "Người liên quan", people.map(option)) +
            field(
              "effectiveAt",
              "Mốc ngừng truy cập đề nghị",
              "datetime-local"
            ) +
            field("reason", "Lý do / căn cứ", "textarea"),
          (v) =>
            api("/workplace/personnel", {
              method: "POST",
              body: {
                ...v,
                effectiveAt: new Date(v.effectiveAt).toISOString(),
              },
            }),
          {
            intro:
              "Đây là đề nghị; cần HR kiểm tra và người có thẩm quyền phê duyệt. Không thay thế thủ tục pháp lý.",
          }
        );
        break;
      }
      case "case": {
        const [key, cmd] = id.split("|");
        decision(
          "Hồ sơ nhân sự · " +
            ({
              SUBMIT: "Kiểm tra và gửi duyệt",
              APPROVE: "Phê duyệt",
              REJECT: "Từ chối",
              HANDOVER_DONE: "Xác nhận bàn giao",
              PAYROLL_DONE: "Xác nhận đối soát",
              CLOSE: "Hoàn tất",
            }[cmd] || cmd),
          "/workplace/personnel/" + key + "/commands",
          rows.find((r) => r.id === key),
          cmd
        );
        break;
      }
      case "access": {
        const [key, cmd] = id.split("|");
        decision(
          "Yêu cầu truy cập · " +
            ({
              APPROVE: "Phê duyệt",
              REJECT: "Từ chối",
              EXECUTE: "Thực hiện",
              COMPLETE: "Ghi nhận hoàn tất",
            }[cmd] || cmd),
          "/workplace/access-requests/" + key + "/commands",
          rows.find((r) => r.id === key),
          cmd
        );
        break;
      }
      case "access-new":
        form(
          "Đề nghị quản trị truy cập",
          select(
            "userId",
            "Tài khoản",
            (await api("/workplace/time/people"))
              .filter(
                (u) =>
                  cap("HR_MANAGE") ||
                  u.id === C().user.id ||
                  manager(u.department_id)
              )
              .map(option)
          ) +
            select(
              "type",
              "Đề nghị",
              ["LOCK", "UNLOCK", "CHANGE_ACCESS"].map((x) => ({
                value: x,
                label: labels[x],
              }))
            ) +
            field(
              "reason",
              "Nội dung, quyền/phòng dự kiến và căn cứ",
              "textarea"
            ),
          (v) => api("/workplace/access-requests", { method: "POST", body: v })
        );
        break;
      case "authority": {
        const staff = await api("/workplace/staff");
        const leaders = staff.filter(
          (u) => u.capabilities.includes("EXECUTIVE") && u.status === "ACTIVE"
        );
        if (!leaders.length)
          throw new Error("Cần tài khoản lãnh đạo được cấp theo căn cứ trước.");
        form(
          "Lãnh đạo phụ trách phòng",
          select("executiveId", "Người phụ trách", leaders.map(option)) +
            field("reason", "Căn cứ phân công", "textarea"),
          (v) =>
            api("/workplace/departments/" + id + "/authority", {
              method: "PUT",
              body: v,
            })
        );
        break;
      }
      case "invite":
        form(
          "Phát hành lại kích hoạt",
          "<p>Liên kết cũ sẽ mất hiệu lực. Liên kết mới gửi đến email đã ghi trong hồ sơ.</p>",
          () => api("/workplace/staff/" + id + "/invite", { method: "POST" })
        );
        break;
      case "import-file":
        form(
          "Chọn danh sách tài khoản",
          field("file", "Tệp CSV", "file"),
          async (v, f) => {
            const file = f.querySelector('[name="file"]').files[0];
            if (file.size > 1024 * 1024) throw new Error("Tệp tối đa 1 MB");
            const parsed = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
            const columns = ["username", "email", "fullName", "departmentCode"];
            if (parsed[0]?.join(",") !== columns.join(","))
              throw new Error("Cột CSV chưa đúng mẫu");
            const list = parsed.slice(1).map((r) => {
              if (r.length !== 4) throw new Error("Mỗi dòng cần đủ 4 cột");
              const obj = Object.fromEntries(
                columns.map((x, i) => [x, r[i].trim()])
              );
              const department = C().departments.find(
                (d) => d.code.toLowerCase() === obj.departmentCode.toLowerCase()
              );
              if (!department)
                throw new Error(
                  "Không tìm thấy mã phòng: " + obj.departmentCode
                );
              obj.departmentId = department.id;
              obj.role = "EMPLOYEE";
              delete obj.departmentCode;
              return obj;
            });
            const result = await api("/workplace/staff/import", {
              method: "POST",
              body: { rows: list, preview: true },
            });
            batch = { rows: list, result };
          },
          { submit: "Kiểm tra và xem trước" }
        );
        break;
      case "import-confirm":
        if (!batch?.result.valid)
          throw new Error("Cần kiểm tra danh sách trước");
        form(
          "Xác nhận tạo tài khoản",
          `<p>Tạo ${batch.rows.length} tài khoản chưa kích hoạt và xếp thư riêng từng người?</p>`,
          async () => {
            const result = await api("/workplace/staff/import", {
              method: "POST",
              body: { rows: batch.rows, preview: false },
            });
            if (result.preview) {
              batch.result = result;
              throw new Error("Dữ liệu đã thay đổi; kiểm tra lại danh sách.");
            }
            batch = null;
          }
        );
        break;
      case "mfa-setup":
        form(
          "Thiết lập xác thực hai bước",
          field("password", "Mật khẩu hiện tại", "password"),
          async (v) => {
            const result = await api("/me/two-factor/setup", {
              method: "POST",
              body: v,
            });
            stepSecret = result.secret;
          },
          {
            after: () => {
              form(
                "Thêm khóa vào ứng dụng xác thực",
                `<p>Thêm tài khoản WorkSphere, loại mã theo thời gian (TOTP), 6 chữ số. Khóa chỉ dành cho bạn:</p><code class="secret-key">${esc(
                  stepSecret
                )}</code>` +
                  field("password", "Mật khẩu hiện tại", "password") +
                  field("code", "Mã 6 số trong ứng dụng", "text", { max: 6 }),
                async (v) => {
                  const result = await api("/me/two-factor/enable", {
                    method: "POST",
                    body: v,
                  });
                  stepSecret = "";
                  backupCodes = result.recoveryCodes;
                },
                {
                  submit: "Xác nhận bật",
                  after: () => {
                    env.showCodes(backupCodes);
                    backupCodes = [];
                  },
                }
              );
            },
          }
        );
        break;
      case "mfa-disable":
        form(
          "Tắt xác thực hai bước",
          field("password", "Mật khẩu hiện tại", "password") +
            field("code", "Mã xác thực hoặc mã dự phòng", "text"),
          async (v) => {
            await api("/me/two-factor/disable", { method: "POST", body: v });
            env.endSession();
          }
        );
        break;
    }
    return true;
  }
  return {
    render: async (view) =>
      ({
        stations,
        people: directory,
        delegations,
        personnel,
        access: accessRequests,
        approvals,
        security,
        import: importView,
      }[view]?.()),
    action,
    reset: () => {
      clearTimeout(qrTimer);
      rows = [];
      directoryPage = 0;
      directoryQuery = "";
      batch = null;
      stepSecret = "";
      backupCodes = [];
      stationId = null;
    },
    stop: () => {
      clearTimeout(qrTimer);
    },
  };
}
