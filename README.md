# WorkSphere — Kỹ năng lập trình nâng cao

Nền tảng quản lý yêu cầu hỗ trợ và công việc nội bộ cho doanh nghiệp vừa và nhỏ. Backend là nguồn nghiệp vụ duy nhất; web và Android dùng chung API/PostgreSQL.

**Bắt đầu tại [Hướng dẫn dự án và giao việc](docs/PROJECT_GUIDE.md).** Tài liệu này chỉ đường để chạy, hiểu nghiệp vụ, chia việc và chuẩn bị báo cáo/slide.

| Bạn cần | Đọc |
|---|---|
| Chạy bản clone và Android | [Hướng dẫn chạy](docs/FRESH_CLONE_RUNNING.md) |
| Biết đã làm và còn thiếu | [Hiện trạng](STATUS.md), [TODO](TODO.md) |
| Quyền và luồng nghiệp vụ | [Luồng nền](docs/WEB_WORKFLOWS.md), [bổ sung hiện hành](docs/WEB_PHASE2_CONTRACT.md), [QR/công/OT](docs/ATTENDANCE_POLICY.md) |
| Kiểm thử đã thực hiện | [Đợt mới nhất](reports/INCREMENT_2026-11-01.md), [web](reports/web-validation.json), [mobile](reports/mobile-validation.json) |
| Nguồn gốc và phạm vi hai môn | [Nguồn gốc](PROVENANCE.md), [phạm vi](docs/COURSE_SCOPE.md) |

## Trạng thái

Đã có web nghiệp vụ và client Android dùng chung API; chưa production hoặc nghiệm thu toàn bộ. Kết quả mới nhất: [tệp Android và kiểm chứng 01/11](reports/INCREMENT_2026-11-01.md). Backend 152 tests chọn lọc (58 PostgreSQL) được chạy 01/11; mobile 98 suites/852 tests được chạy 01/11. Đọc STATUS/TODO để phân biệt đã triển khai và đã kiểm chứng.

## Hai repository phục vụ đồ án

| Học phần | Nguồn chuẩn |
|---|---|
| Kỹ năng lập trình nâng cao | [worksphere-app](https://github.com/Khiemnh158/worksphere-app) — ứng dụng, API và tests |
| Triển khai phần mềm | [worksphere-deployment](https://github.com/Khiemnh158/worksphere-deployment) — triển khai, vận hành và bằng chứng |

Repo triển khai ghim commit của app; business logic giữ tại worksphere-app. Ngày 02/11/2026, người dùng xác nhận An toàn thông tin thi trắc nghiệm nên bỏ chuyên đề/repo riêng. Các bảo vệ và kiểm thử bảo mật trong ứng dụng vẫn được giữ. Môn Phát triển ứng dụng di động của nhóm khác không thuộc hai môn nộp này.

## Bố cục source

- backend/: Spring Boot, mục tiêu Java 21, PostgreSQL/Flyway V001–V027.
- web/: cổng web đang dùng; mobile/: React Native/TypeScript và Android.
- scripts/: khởi động local; docs/: hợp đồng/hướng dẫn; reports/: kết quả kiểm chứng.
- design/, docs/legacy/, reports/legacy/: nguồn kế thừa, không phải giao diện hoặc yêu cầu hiện hành. Đọc [quy tắc tài liệu](docs/DOCUMENTATION.md) trước khi dùng cho báo cáo.
