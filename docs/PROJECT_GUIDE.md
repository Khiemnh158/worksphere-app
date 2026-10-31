# WorkSphere — hướng dẫn dự án, báo cáo và giao việc

Cập nhật 31/10/2026. Đây là tài liệu đầu mối cho người mới; xem STATUS/TODO để biết mức độ hoàn thiện, không suy diễn một luồng mô tả là đã nghiệm thu mọi nhánh.

## 1. Mục tiêu và cách đọc

Nền tảng tiếp nhận yêu cầu hỗ trợ và quản lý công việc nội bộ doanh nghiệp vừa và nhỏ. Nhân viên tìm đúng nơi hỗ trợ; trưởng phòng điều phối; người nhận thực hiện; người có thẩm quyền nghiệm thu. Lưu lịch sử khi bàn giao/ngừng truy cập.

Đọc lần lượt: tài liệu này → [STATUS](../STATUS.md) → [TODO](../TODO.md) → [chạy clone](FRESH_CLONE_RUNNING.md). Khi xử lý nghiệp vụ, đọc hợp đồng tương ứng trong mục7. Nguồn app là repo này; hai môn chuyên đề ghim commit app, không có database hoặc backend thứ hai.

## 2. Kiến trúc và công nghệ

Web JavaScript và Android React Native/TypeScript → API Spring Boot → PostgreSQL. Backend quyết định quyền, trạng thái, version, thời gian và phép tính; menu chỉ phản ánh khả năng. Flyway quản lý schema; không sửa migration đã chạy. Backend mục tiêu Java21; bản build local gần nhất dùng JVM25, chưa coi là đã kiểm chứng riêng runtime21. Maven Wrapper, Node24 và Android SDK theo file cấu hình source.

Web dành cho quản trị, điều phối, hồ sơ và đối soát; mobile dành cho thao tác công việc/hỗ trợ, quét QR, xem công/phiếu riêng. Cùng API và database; làm mới theo focus/foreground hoặc nút cập nhật, chưa realtime/push. LocalDemo có sẵn bundle, nhưng backend local/USB vẫn cần; không hoạt động độc lập ở mọi nơi.

## 3. Phòng ban và trách nhiệm

| Đối tượng | Làm gì | Ranh giới |
|---|---|---|
| Nhân viên | Việc được giao, gửi hỗ trợ, rà soát bàn giao, công/đơn và thông tin riêng | Không tự nghiệm thu/duyệt hoặc xem dữ liệu người khác ngoài phạm vi |
| Trưởng phòng | Điều phối công việc/hỗ trợ, bàn giao, xem xét công đúng tuyến | Theo phòng; hồ sơ của chính mình cần người độc lập |
| IT | Xử lý hỗ trợ máy tính/phần mềm theo phân công | Không mặc định là Admin hệ thống |
| Kinh doanh | Tiếp nhận hỗ trợ báo giá và công việc của phòng | Không xem lương/HR chỉ vì thuộc phòng |
| Hành chính–Nhân sự | Hỗ trợ hành chính; người được cấp nhiệm vụ xử lý hồ sơ/công | Tên phòng không tự cấp mọi quyền |
| Lãnh đạo | Quyết định trong các phòng được giao phụ trách | Không tự duyệt, không tự có quyền đọc lương |
| Chuyên trách | HR_MANAGE, TIME_REVIEW, PAYROLL_MANAGE, PAYROLL_APPROVE theo nhiệm vụ | Người lập/duyệt và người liên quan phải độc lập theo policy |
| Admin kỹ thuật | Tài khoản, phòng/quyền, cấu hình định tuyến và truy cập, audit | Không mặc định xử lý nghiệp vụ, lương, hồ sơ hoặc duyệt thay |

Ba phòng là dữ liệu mẫu, thêm được phòng. Trưởng phòng theo manager_id, khác role dự án cũ. Người thay có phạm vi/thời hạn, không chuyển tiếp hoặc tự duyệt. Tài khoản Admin kỹ thuật tách khỏi tài khoản nghiệp vụ.

## 4. Các luồng để phân tích và trình bày

1. Tài khoản: Admin cấp PENDING → thư kích hoạt → xác minh/đặt mật khẩu → ACTIVE. Reset email một lần có hạn; không tự mở tài khoản đã bị khóa. Thư hiện dùng hộp thư local, không SMS/SMTP thật.
2. Hỗ trợ: người gửi chọn loại → snapshot phòng nhận → trưởng phòng phân công → nhân viên xử lý/trao đổi → RESOLVED → người gửi xác nhận CLOSED hoặc trả lại. Chuyển phòng/hủy sau phân công có điều kiện và lý do.
3. Công việc: ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED; nghiệm thu có thể trả lại. Tiến độ100% không tự hoàn tất. BLOCKED cần ghi vướng mắc; CANCELLED giữ lịch sử.
4. Bàn giao: chuyển HANDOVER, giữ phần đã làm/tệp/tác giả → người nhận đọc, ghi nhận rà soát và vấn đề → tiếp tục. Không reset tiến độ hoặc coi tiếp nhận là nghiệm thu.
5. Nhân sự: đề nghị → HR kiểm tra độc lập → lãnh đạo phụ trách quyết định → cutoff truy cập + checklist bàn giao/đối soát → HR đóng khi đủ điều kiện. Khóa bảo mật khác quyết định nghỉ việc; giữ hồ sơ, không xóa tác giả. Admin thực hiện phần truy cập.
6. Công: QR điểm dùng chung xoay vòng → điện thoại đã đăng nhập quét → máy chủ lưu thời gian/peer IP → đối chiếu lịch/mạng → công PENDING → xác minh độc lập. IN còn mở phải hiện trước OUT; thiếu quét không tự kết luận vắng.
7. OT: đề nghị và duyệt trước → cặp OT_IN/OT_OUT riêng → xác nhận phút thực trong khoảng được duyệt. Trễ quy trình cần căn cứ ngoại lệ; quét ra muộn không tự thành tiền OT.
8. Thu nhập: dữ liệu lương/công/nghỉ/OT đã xác nhận → lập/gửi → duyệt độc lập → phát hành và khóa nguồn. Điều chỉnh bổ sung riêng, không ghi đè phiếu gốc; không thực hiện chuyển tiền hoặc tự phạt.

Lịch thử chung đã được chọn08–17 T2–T6, nghỉ11:30–12:30. Chưa lịch cá nhân/ca đêm. Mạng văn phòng chưa cấu hình; QR/IP không chứng minh hiện diện tuyệt đối, USB chỉ là đường thử. Xem [ATTENDANCE_POLICY](ATTENDANCE_POLICY.md) trước khi viết công thức/chính sách.

## 5. Bảng giao việc cho nhóm bốn người

Điền người nhận thực tế, không giả định thành viên đã làm. Mỗi người bàn giao đầu ra và bằng chứng, người phụ trách tích hợp kiểm tra lại.

| Mã / ưu tiên | Đầu việc có thể giao | Đầu ra bắt buộc | Điều kiện hoàn thành |
|---|---|---|---|
| A1 / P0 | Nghiệm thu OPPO: IN/OUT, OT, mã trùng/hết hạn/điểm đóng/mất mạng | Bảng ca thử + lỗi/tái hiện + ảnh đã che | Web/mobile/API khớp; không ghi nhận thành công giả, không sửa lịch sử thật |
| A2 / P0 | Rà soát web theo vai trò và truy cập vượt phạm vi | Bảng actor–resource–action–expected–actual | Có ca bị từ chối; sửa lỗi có test liên quan, không chỉ kiểm menu |
| A3 / P1 | Tệp mobile và OSlinks | PR nhỏ, hợp đồng API, tests và demo thiết bị | File đúng phạm vi; link đúng loại/hạn, không tự kích hoạt/reset khi mở |
| A4 / P1 | Chạy clone sạch và kiểm tra hướng dẫn | Phiên bản/môi trường/lệnh/kết quả/vướng mắc | Không dùng credentials/database máy tác giả; tách lỗi môi trường và lỗi sản phẩm |
| B1 / song song | Viết báo cáo Lập trình nâng cao | Bản theo mẫu giảng viên, sơ đồ và trích nguồn code | Phân biệt kế thừa/tự sửa, đã có/chưa có/đã kiểm chứng |
| B2 / sau B1 | Slide và kịch bản demo | 10–12 slide đề xuất + demo5–8 phút + phương án dự phòng | Khớp báo cáo/source, có giới hạn, không dùng mockup chứng minh chức năng |
| C1 / sau release target | Chuyên đề An toàn thông tin | Threat model, test quyền/session/input và bằng chứng trước/sau | Ghim commit, không scan mục tiêu ngoài phạm vi; không khẳng định hết lỗi |
| C2 / sau release target | Chuyên đề Triển khai phần mềm | Pipeline/Compose/chất lượng/giám sát, backup/restore/rollback và log | Tự chạy theo yêu cầu môn; cùng app commit, không nộp cấu hình giả |

Mẫu phiếu giao việc: mã; người nhận; commit bắt đầu; phạm vi; tài liệu/API liên quan; đầu ra; điều kiện hoàn thành; ca thử; hạn do nhóm thống nhất; người kiểm tra; kết quả và commit bàn giao. Không nhận trạng thái “xong” nếu thiếu đầu ra/bằng chứng.

## 6. Chuẩn bị báo cáo và slide

Báo cáo: bối cảnh/phạm vi → yêu cầu và phân quyền → kiến trúc/dữ liệu/API → các luồng chính → phần triển khai thực → kiểm thử → kết quả/giới hạn → hướng phát triển/phân công/tài liệu tham khảo. Đối chiếu mẫu từng môn, không tự coi bố cục đề xuất này thay đề cương.

Slide đề xuất: vấn đề; phạm vi ba môn; actor/quyền; kiến trúc; hỗ trợ; công việc/bàn giao; nhân sự/truy cập; QR/OT; demo; kiểm thử; giới hạn; phân công. Không cần đưa toàn bộ chi tiết lương/pháp lý lên slide.

Mỗi hình phải ghi môi trường, commit hoặc phiên bản, ca thử và kết quả. Dùng tài khoản fixture, không public mật khẩu/token/phiếu thu nhập riêng hoặc giờ/IP nhận diện. Chụp bằng chứng chức năng thật; không dựng số liệu hoặc dùng số tests để suy ra % sản phẩm.

## 7. Nguồn để tra cứu

| Mục đích | Nguồn |
|---|---|
| Hiện trạng/backlog | [STATUS](../STATUS.md), [TODO](../TODO.md) |
| Luồng nền và phân quyền | [WEB_WORKFLOWS](WEB_WORKFLOWS.md) |
| Quyết định mới về tổ chức/HR/auth/lương | [WEB_PHASE2_CONTRACT](WEB_PHASE2_CONTRACT.md) |
| Chấm công/QR/mạng/OT | [ATTENDANCE_POLICY](ATTENDANCE_POLICY.md) |
| Khởi động | [FRESH_CLONE_RUNNING](FRESH_CLONE_RUNNING.md), [MOBILE_RUNNING](MOBILE_RUNNING.md) |
| Bằng chứng gần nhất | [Báo cáo tăng cường](../reports/ATTENDANCE_INCREMENT_2026-10-30.md), [web JSON](../reports/web-validation.json), [mobile JSON](../reports/mobile-validation.json) |
| Kiểm thử/triển khai thực | backend/src/test, mobile/__tests__, scripts/test-web-session.mjs, scripts/run-local.ps1 |
| Nguồn gốc/đã quyết định | [PROVENANCE](../PROVENANCE.md), [DECISIONS](../reports/DECISIONS.md) |
| Dọn tài liệu/lịch sử | [DOCUMENTATION](DOCUMENTATION.md) |

Các hợp đồng bổ sung mới thay giới hạn cũ tương ứng. Reports cũ là kết quả tại ngày ghi, không phải hiện trạng mới. Sơ đồ bảng/endpoint chi tiết phải đối chiếu migration/controller hiện hành, không sao chép nguyên database/API trong docs/legacy.
