# Hiện trạng baseline - 29/10/2026

## Bằng chứng đã có
- Backend package: BUILD SUCCESS ở lượt chạy trước trên máy hiện tại; Android debug x86_64: BUILD SUCCESSFUL, đã mở Dashboard.
- E2eUserProvisionerTest: 9 test qua ở lượt sửa local.
- Mobile typecheck trong audit: exit 0.
- Mobile Jest audit: 84 suite qua / 1 suite lỗi; 795 test qua / 1 test timeout 5 giây tại TaskDetailScreen.test.tsx:231; có cảnh báo act/open handles. Chưa xác định đó là lỗi sản phẩm hay bất ổn test/môi trường.
- npm audit --omit=dev: 5 mục package bị ảnh hưởng (high 1, low 4), không đồng nghĩa 5 exploit trên APK.

## Lỗi còn mở đã tái hiện
- F03: /me 200, logout 204, gọi lại bằng access token cũ vẫn 200.
- F04: hai refresh đồng thời cùng token đều trả 200.

## Chưa xác minh / chưa làm
- Toàn bộ backend integration suite với Docker/Testcontainers, Sonar gate, tải lớn, phát hành APK ARM.
- F05 cross-project authorization được xác định qua code, chưa chạy fixture HTTP chéo dự án.
- Web UI mới, coordinator queue, audit writer, Jenkins/Compose/monitoring chưa được xây trong lượt import.

Hai patch local đã nằm trong code import. Không ghi “toàn bộ kiểm thử PASS” và không đưa baseline này ra public như bản sản phẩm hoàn chỉnh.
