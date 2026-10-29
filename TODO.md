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
- [ ] F03 thu hồi access theo session khi logout/reset, test phiên A/B.
- [ ] F04 rotation refresh atomic: 2 concurrent refresh chỉ 1 thành công.
- [ ] F05 ProjectPolicy trên mọi mutation và test PM A không sửa B.
- [ ] F14/F15 error catalog + lỗi login ngoài thống nhất; rate limit theo phạm vi.
- [ ] Chẩn đoán 1 Jest timeout/act/open handles, không tăng timeout để che nguyên nhân.

## A2 - Ticket trọn vòng
- [ ] F06 requester cancel/confirm; F07 không assign terminal; F08 asset link khi update.
- [ ] F32 owner team/category + queue scope + coordinator assign đúng team, migration mới.
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
