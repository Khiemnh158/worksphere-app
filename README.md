# WorkSphere App - Kỹ năng lập trình nâng cao

Nền tảng quản lý yêu cầu hỗ trợ và công việc nội bộ doanh nghiệp. Đây là **nguồn ứng dụng chuẩn** của ba học phần.

**Trạng thái: web đã nối API và PostgreSQL, có đăng nhập thật, quyền theo phòng, hỗ trợ, công việc/bàn giao, quản trị và đối soát công/thu nhập. 142 backend tests chọn lọc (52 PostgreSQL), 5 tests phiên web và 810 tests mobile/91 suites đạt; chưa phải bản production; chưa chạy toàn bộ backend kế thừa.**

| Học phần | Repository | Phạm vi |
| --- | --- | --- |
| Kỹ năng lập trình nâng cao | [worksphere-app](https://github.com/Khiemnh158/worksphere-app) | Backend, web, mobile dùng chung API, hợp đồng API, nghiệp vụ, tests |
| An toàn thông tin | [worksphere-security](https://github.com/Khiemnh158/worksphere-security) | Mô hình đe dọa, test quyền/session, scan, báo cáo trước/sau |
| Triển khai phần mềm | [worksphere-deployment](https://github.com/Khiemnh158/worksphere-deployment) | Jenkins, Docker Compose, Sonar, Prom/Graf, vận hành và minh chứng |

Giai đoạn 2: [Hợp đồng hiện hành](docs/WEB_PHASE2_CONTRACT.md), [kết quả nghiệm thu](reports/WEB_PHASE2_IMPLEMENTATION.md). Thư thử local, QR web và TOTP đã có. Cổng web được kiểm tra lại trước khi bắt đầu Android; xem [web readiness](reports/WEB_READINESS_2026-10-30.md), [mobile đợt đầu](reports/MOBILE_FIRST_CLIENT_2026-10-30.md) và [cách chạy](docs/MOBILE_RUNNING.md).

## Đọc trước khi bắt đầu

1. [Hiện trạng thật](STATUS.md) và [nguồn gốc](PROVENANCE.md).
2. [Phạm vi môn và sản phẩm](docs/COURSE_SCOPE.md).
3. [Kế hoạch UI và nghiệp vụ](docs/PRODUCT_PLAN.md).
4. [Backlog ưu tiên](TODO.md), [kế hoạch cho một người chính](docs/SOLO_PLAN.md).
5. [Cách chạy](docs/RUNNING.md), [báo cáo audit PDF](docs/audit/WorkSphere-audit-2026-10-29.pdf).

## Bắt đầu phát triển

- [Hợp đồng quyền và bàn giao](docs/ACCESS_AND_HANDOVER_MVP.md)
- [Kết quả đợt 1 và giới hạn kiểm thử](reports/AUTHORIZATION_FOUNDATION.md)
- [Cổng web và cách chạy](docs/WEB_RUNNING.md), [hợp đồng nghiệp vụ](docs/WEB_WORKFLOWS.md), [kết quả xác minh](reports/WEB_IMPLEMENTATION.md).

## Có sẵn

- `backend/`: Spring Boot modular monolith, PostgreSQL, Flyway V001-V026; identity, organization, project, task, service_request, asset, file, notification.
- `mobile/`: React Native/TypeScript; tuyến chính mới cho công việc/bàn giao, hỗ trợ, công/nghỉ/OT, camera QR Android, thông báo, danh bạ phòng và phiếu thu nhập riêng. Màn project/task cũ được giữ để truy vết, không nằm ở tuyến chính mới.
- `design/`: thiết kế/prototype kế thừa, **không phải web frontend đang vận hành**.
- `docs/legacy/`, `reports/legacy/`: tài liệu lịch sử của source bốn môn cũ, giữ để truy vết.
- Hai bản vá local F01/F02 được đưa vào snapshot này; xem PROVENANCE.

## Chưa có, không coi là đã làm

- Kiểm chứng QR trọn vòng bằng điện thoại thật, APK ARM/release/iOS, tệp mobile đầy đủ và push notification. Camera Android đã mở được trên giả lập; chưa nhận là chống chấm hộ tuyệt đối.
- GPS/vân tay thật, ca đêm/qua ngày, thuế/BHXH/thực lĩnh, xử lý pháp lý bồi thường và hardening production.
- Các phát hiện còn lại ngoài phạm vi đợt 1; xem STATUS và kết quả kiểm thử mới.
- Pipeline CI/CD hoàn chỉnh, Dockerfile/Compose, Sonar, Prometheus/Grafana và bản release mobile.
- SMTP/SMS thật và audit bao phủ toàn bộ module kế thừa; kích hoạt/khôi phục qua hộp thư thử local đã có.

Source cũ có GitHub workflow skeleton; bản lưu nằm ở `docs/legacy/UPSTREAM_ci.yml.disabled`. Không kích hoạt pipeline cũ để tạo trạng thái xanh gây hiểu nhầm khi backend chưa được build/test trong CI.

## Quy tắc phiên bản

Mọi sửa business logic ở repo này. Hai repo học phần khác dùng `target.json`/`versions.env` ghim **commit của app**, không copy backend thành ba bản. Đây là snapshot import mới; commit upstream vẫn được ghi đầy đủ, không nhận mã kế thừa là phần nhóm tự viết.
