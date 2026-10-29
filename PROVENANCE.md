# Nguồn gốc và nội dung import

- Repository nguồn: https://github.com/c06-prog/WorkSphere
- Commit gốc: `8292d13b5330279c6a3d4ab007eebbff9be4d894`.
- Ngày tách: 29/10/2026, theo yêu cầu chủ tài khoản Khiemnh158.
- Cách import: snapshot các tệp Git-tracked tại commit gốc; không đưa lịch sử Git, cache, tool portable, DB, uploads, APK, token hoặc `.env` local vào repo mới.
- Tác giả nguồn gốc và mã mobile kế thừa phải được ghi công; không tuyên bố toàn bộ source do nhóm ba môn tự viết.
- Không tự thêm giấy phép mới cho source upstream; quyền sử dụng/phân phối theo quyền tác giả gốc và thỏa thuận học thuật của nhóm.

## Hai thay đổi code so với upstream

1. `E2eUserProvisioner.java`: collection roles dùng HashSet có thể thay đổi, tránh Hibernate merge ném UnsupportedOperationException (F02).
2. `UserRepository.java`: EntityGraph tải roles/permissions cho findActiveById, tránh JWT filter bị lazy initialization và trả 401 sau login (F01).

Không có thay đổi nghiệp vụ/UI mới trong lượt tách repo này. Tài liệu có kế hoạch không có nghĩa chức năng đã triển khai.

## Thay đổi tổ chức tài liệu

README/AGENTS/10 canonical docs và reports cũ được lưu dưới docs/legacy hoặc reports/legacy. Các comment source tham chiếu tài liệu gốc có thể dùng đường dẫn cũ; tra bản lưu khi cần. Quy tắc cũ “4 môn”, “D:/WorkSphere”, khóa phase và các PASS lịch sử không được dùng như hiện trạng của dự án mới.
