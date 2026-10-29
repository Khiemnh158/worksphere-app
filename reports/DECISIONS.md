# Quyết định 29/10/2026

- D-001: Một nguồn app; security và deployment tham chiếu commit, không nhân ba business logic.
- D-002: Giữ nguồn gốc/source có ích, nhập hai patch local. Không thay origin hoặc sửa checkout gốc đang chạy.
- D-003: Chỉ ba môn của nhóm hiện tại; mobile là client kế thừa, không là môn thứ tư của nhóm.
- D-004: Chưa dựng tính năng chưa có; ghi rõ TODO và trạng thái. Giữ legacy docs như lịch sử, không áp phase cũ làm phạm vi mới.
- D-005: Kế hoạch chuyển sang một người chính; ưu tiên một luồng trọn vòng và yêu cầu triển khai bắt buộc.

- D-006: MVP mỗi phòng hỗ trợ một hàng đợi; nhiều team hoãn, khác đề xuất owner team ban đầu.
- D-007: Bàn giao giữ tiến độ/lịch sử; người nhận tự kiểm tra phần trước và ghi nhận, không đồng nghĩa duyệt hoàn thành.
- D-008: Quyền đợt 1 được thực thi tại backend; dark UI là prototype minh họa, chưa nối dữ liệu thật.

- D-009: Theo yêu cầu mới, hoàn thiện web trước rồi mới cập nhật mobile; menu thu gọn, sáng/tối và chuyển động nhẹ.
- D-010: Ba phòng là fixture ban đầu, không hardcode client; trưởng phòng tách khỏi vai trò dự án, Admin kỹ thuật không mặc định có quyền HR/TIME/PAYROLL.
- D-011: Công việc phòng dùng department_work, giữ nguyên module project/task kế thừa và ghi rõ phạm vi tương thích, không gọi hai mô hình là một.
- D-012: Công và thu nhập dùng cấu hình có đầu vào xác nhận; không seed lương/lịch, không tự phạt hoặc coi tăng ca đăng ký là tiền đã được hưởng.
- D-013: Đối soát hiện hỗ trợ ca ngày/gross; thiếu dữ liệu chặn chốt, khóa snapshot và nguồn khi chốt. Chưa có engine pháp lý/thuế/BHXH, thiết bị thật hoặc mở lại kỳ.
- D-014: Xác minh chọn lọc 120 backend (31 PostgreSQL integration) + 5 client session; không suy rộng thành toàn bộ suite hoặc production-ready.
