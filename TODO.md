# Tiến độ web hiện hành

- [x] Đăng nhập và menu theo tài khoản thật; bỏ persona picker.
- [x] Quyền quản lý theo phòng, tách Admin kỹ thuật và HR/TIME/PAYROLL chuyên trách.
- [x] Admin thêm/cấu hình phòng, gán tài khoản và cấu hình nơi nhận từng loại yêu cầu.
- [x] Người gửi → trưởng phòng nhận → người xử lý → người gửi nghiệm thu/từ chối.
- [x] Bổ sung thông tin, chuyển phòng, từ chối tiếp nhận có lý do; đề nghị hủy sau phân công có xem xét.
- [x] Công việc theo phòng, lịch theo hạn thật, tiến độ/trao đổi/tệp và nghiệm thu độc lập.
- [x] Bàn giao giữ tiến độ/tác giả; người nhận phải ghi nhận rà soát.
- [x] Chuyển phòng có kiểm tra trách nhiệm; ngừng truy cập theo hồ sơ đã có thẩm quyền, giữ lịch sử và thu hồi phiên.
- [x] Công/nghỉ/tăng ca: cấu hình lịch, nhập nguồn, đề nghị/duyệt, quỹ nghỉ và vắng có xác minh.
- [x] Thu nhập theo công và tăng ca thực tế được xác nhận, không tự phạt, khóa nguồn khi chốt phiếu.
- [x] Menu thu gọn, sáng/tối, responsive, hiệu ứng nhẹ có reduced-motion.
- [x] 120 backend + 5 client session tests đạt; browser đi trọn luồng hỗ trợ và bàn giao.

## Cần làm tiếp trước khi nhận là release đầy đủ

- [ ] Đối chiếu rubric chính thức (người dùng chưa cung cấp đề cương môn Lập trình nâng cao).
- [ ] Kiểm tra nghiệm thu nghiệp vụ theo chính sách thật; lịch công/quỹ phép/lương cần đầu vào có thẩm quyền.
- [ ] Onboarding/đặt lại mật khẩu có xác minh và email, rate limit/hardening, audit bao phủ các module kế thừa.
- [ ] Quyền phê duyệt thay thế theo hồ sơ/ủy quyền nếu cần nhiều người phụ trách; hiện không tự cho người đề nghị duyệt chính mình.
- [ ] Lịch ngừng việc tương lai; điều chỉnh/mở lại kỳ đối soát có phê duyệt (hiện đã chốt thì bị khóa).
- [ ] Chấm công mobile QR và tích hợp thiết bị thật theo mẫu máy; không tuyên bố chống gian lận tuyệt đối.
- [ ] Thuế/BHXH/lương thực nhận/ca đêm/bồi thường chỉ làm khi chốt chính sách và phạm vi riêng.
- [ ] Sau web: xây mobile dùng chung API mới; không nhận UI cũ là đã được cập nhật.
- [ ] Legacy Testcontainers suite trên Docker và nợ Jest mobile; kiểm tra tương thích module project/task cũ.

## Backlog lịch sử trước cổng web (đối chiếu phần cập nhật trên)

# Backlog hiện hành - làm môn Lập trình nâng cao trước

Các ô bỏ trống đều CHƯA LÀM, không phải kết quả đã hoàn thành.

## Đã nhập
- [x] Snapshot source gốc và nguồn gốc.
- [x] Hai patch local F01/F02 trong code.
- [x] Audit, trạng thái kiểm thử thật, phạm vi ba môn và liên kết repo.

## A0 - Chốt hợp đồng trước khi mở rộng UI
- [ ] Xác nhận rubric môn, yêu cầu web/mobile và phạm vi dùng lại source.
- [ ] Chốt ma trận actor/resource/state, sitemap và API contract.
- [ ] Tạo fixture requester/coordinator/agent/admin và hai project/nhóm để test chéo.

## A1 - Xác thực và quyền (chặn public)
- [x] F03 thu hồi access theo session khi logout/reset, test phiên A/B.
- [x] F04 rotation refresh atomic: 2 concurrent refresh chỉ 1 thành công.
- [x] F05 ProjectPolicy trên mọi mutation và test PM A không sửa B.
- [ ] F14/F15 error catalog + lỗi login ngoài thống nhất; rate limit theo phạm vi.
- [ ] Chẩn đoán 1 Jest timeout/act/open handles, không tăng timeout để che nguyên nhân.

## A2 - Ticket trọn vòng
- [x] F06 requester cancel/confirm; F07 không assign terminal; F08 asset link khi update.
- [ ] F32 category/phòng tiếp nhận + queue scope + coordinator đúng phòng, migration mới; nhiều team hoãn.
- [ ] F17 timestamp reopen; F18 notification reject; audit thao tác chính F23.
- [ ] Test state, version, permissions và attachment liên quan.

## A3 - UI theo từng lát
- [ ] Login/me và role-aware navigation.
- [ ] Requester list/create/detail/comment/history/cancel/confirm/reject.
- [ ] Coordinator queue/assign và agent start/wait/resolve.
- [ ] Loading/error/empty/forbidden/conflict và allowedActions đồng bộ backend.
- [ ] Sau khi luồng hỗ trợ xong: cải thiện Project/Task, F09 membership, F19 actions, F20 clear deadline.

## A4 - Sau MVP
- [ ] Onboarding/reset email F11/F12, avatar F16, session policy F33.
- [ ] File fail-closed/giao dịch/storage F24-F26; pagination/count F13/F21/F34; race PM F10; leader F22.
- [ ] Release signing F27, dependency reachability/vá tương thích F28.
- [ ] Full asset UI, SLA và ticket-task link sau khi phần bắt buộc đủ.

Chi tiết F01-F34: docs/audit/findings.json và PDF. Hạ tầng ở repo deployment; test an toàn chuyên đề ở security; mọi fix business code vẫn ở app.

## Bổ sung sau đợt 1

- [x] Phác thảo dark UI responsive: công việc, lịch 7 ngày, rà soát bàn giao giữ 65%; fixture, chưa nối API.
- [x] 97 kiểm thử thuộc tập được chọn và Maven package qua; 8 ca integration PostgreSQL riêng.
- [ ] API nghỉ việc/ngừng hoạt động, queue cần bàn giao, ghi nhận rà soát của người nhận; không reset tiến độ.
- [ ] Nối UI vào login/me và nghiệp vụ thực, sau đó áp thiết kế mobile.
- [ ] Chạy toàn bộ legacy Testcontainers suite khi Docker Engine sẵn sàng.
