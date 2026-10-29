# WorkSphere App - Kỹ năng lập trình nâng cao

Nền tảng quản lý yêu cầu hỗ trợ và công việc nội bộ doanh nghiệp. Đây là **nguồn ứng dụng chuẩn** của ba học phần.

**Trạng thái 29/10/2026: import baseline đã chạy local + hai bản vá khởi động/xác thực. Chưa hoàn thiện nghiệp vụ, chưa xây lại UI, chưa đạt production-ready.**

| Học phần | Repository | Phạm vi |
| --- | --- | --- |
| Kỹ năng lập trình nâng cao | [worksphere-app](https://github.com/Khiemnh158/worksphere-app) | Backend, web dự kiến, mobile kế thừa, hợp đồng API, nghiệp vụ, tests |
| An toàn thông tin | [worksphere-security](https://github.com/Khiemnh158/worksphere-security) | Mô hình đe dọa, test quyền/session, scan, báo cáo trước/sau |
| Triển khai phần mềm | [worksphere-deployment](https://github.com/Khiemnh158/worksphere-deployment) | Jenkins, Docker Compose, Sonar, Prom/Graf, vận hành và minh chứng |

## Đọc trước khi bắt đầu

1. [Hiện trạng thật](STATUS.md) và [nguồn gốc](PROVENANCE.md).
2. [Phạm vi môn và sản phẩm](docs/COURSE_SCOPE.md).
3. [Kế hoạch UI và nghiệp vụ](docs/PRODUCT_PLAN.md).
4. [Backlog ưu tiên](TODO.md), [kế hoạch cho một người chính](docs/SOLO_PLAN.md).
5. [Cách chạy](docs/RUNNING.md), [báo cáo audit PDF](docs/audit/WorkSphere-audit-2026-10-29.pdf).

## Có sẵn

- `backend/`: Spring Boot modular monolith, PostgreSQL, Flyway V001-V017; identity, organization, project, task, service_request, asset, file, notification.
- `mobile/`: React Native/TypeScript; auth, dashboard, project/task; ServiceRequest mới có foundation/API, UI chưa trọn luồng.
- `design/`: thiết kế/prototype kế thừa, **không phải web frontend đang vận hành**.
- `docs/legacy/`, `reports/legacy/`: tài liệu lịch sử của source bốn môn cũ, giữ để truy vết.
- Hai bản vá local F01/F02 được đưa vào snapshot này; xem PROVENANCE.

## Chưa có, không coi là đã làm

- Web app mới và thiết kế UI mới; hàng đợi hỗ trợ theo team; quyền trạng thái requester đúng đầy đủ.
- Sửa triệt để logout/refresh race, phạm vi project và các phát hiện còn mở.
- Pipeline CI/CD hoàn chỉnh, Dockerfile/Compose, Sonar, Prometheus/Grafana và bản release mobile.
- Audit writer/onboarding email đầy đủ.

Source cũ có GitHub workflow skeleton; bản lưu nằm ở `docs/legacy/UPSTREAM_ci.yml.disabled`. Không kích hoạt pipeline cũ để tạo trạng thái xanh gây hiểu nhầm khi backend chưa được build/test trong CI.

## Quy tắc phiên bản

Mọi sửa business logic ở repo này. Hai repo học phần khác dùng `target.json`/`versions.env` ghim **commit của app**, không copy backend thành ba bản. Đây là snapshot import mới; commit upstream vẫn được ghi đầy đủ, không nhận mã kế thừa là phần nhóm tự viết.
