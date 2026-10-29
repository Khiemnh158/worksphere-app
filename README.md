# WorkSphere App - Kỹ năng lập trình nâng cao

Nền tảng quản lý yêu cầu hỗ trợ và công việc nội bộ doanh nghiệp. Đây là **nguồn ứng dụng chuẩn** của ba học phần.

**Trạng thái: web đã nối API và PostgreSQL, có đăng nhập thật, quyền theo phòng, hỗ trợ, công việc/bàn giao, quản trị và đối soát công/thu nhập. 120 backend tests trong tập chọn + 5 client session tests đạt; chưa phải bản production hoặc toàn bộ test suite.**

| Học phần | Repository | Phạm vi |
| --- | --- | --- |
| Kỹ năng lập trình nâng cao | [worksphere-app](https://github.com/Khiemnh158/worksphere-app) | Backend, web, mobile kế thừa, hợp đồng API, nghiệp vụ, tests |
| An toàn thông tin | [worksphere-security](https://github.com/Khiemnh158/worksphere-security) | Mô hình đe dọa, test quyền/session, scan, báo cáo trước/sau |
| Triển khai phần mềm | [worksphere-deployment](https://github.com/Khiemnh158/worksphere-deployment) | Jenkins, Docker Compose, Sonar, Prom/Graf, vận hành và minh chứng |

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

- `backend/`: Spring Boot modular monolith, PostgreSQL, Flyway V001-V022; identity, organization, project, task, service_request, asset, file, notification.
- `mobile/`: React Native/TypeScript; auth, dashboard, project/task; ServiceRequest mới có foundation/API, UI chưa trọn luồng.
- `design/`: thiết kế/prototype kế thừa, **không phải web frontend đang vận hành**.
- `docs/legacy/`, `reports/legacy/`: tài liệu lịch sử của source bốn môn cũ, giữ để truy vết.
- Hai bản vá local F01/F02 được đưa vào snapshot này; xem PROVENANCE.

## Chưa có, không coi là đã làm

- Chấm công QR/GPS và kết nối máy vân tay thật, ca đêm/qua ngày, thuế/BHXH/lương thực nhận, xử lý pháp lý bồi thường, lịch ngừng việc tương lai, email khôi phục và hardening production.
- Các phát hiện còn lại ngoài phạm vi đợt 1; xem STATUS và kết quả kiểm thử mới.
- Pipeline CI/CD hoàn chỉnh, Dockerfile/Compose, Sonar, Prometheus/Grafana và bản release mobile.
- Audit writer/onboarding email đầy đủ.

Source cũ có GitHub workflow skeleton; bản lưu nằm ở `docs/legacy/UPSTREAM_ci.yml.disabled`. Không kích hoạt pipeline cũ để tạo trạng thái xanh gây hiểu nhầm khi backend chưa được build/test trong CI.

## Quy tắc phiên bản

Mọi sửa business logic ở repo này. Hai repo học phần khác dùng `target.json`/`versions.env` ghim **commit của app**, không copy backend thành ba bản. Đây là snapshot import mới; commit upstream vẫn được ghi đầy đủ, không nhận mã kế thừa là phần nhóm tự viết.
