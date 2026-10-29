# Web: hợp đồng nghiệp vụ đang triển khai

Nguồn yêu cầu: các quyết định người dùng chốt trong cuộc trao đổi ngày 29/10/2026. Đây là cổng web nối máy chủ và PostgreSQL, thay bản prototype đổi persona. Dữ liệu thực hành của An Phát được tạo riêng, không phải dữ liệu doanh nghiệp thật.

## Phạm vi và mô hình

- Một công ty, ba phòng mẫu Kinh doanh/IT/Hành chính–Nhân sự. Admin thêm được phòng và loại yêu cầu; không cố định ba phòng trong client.
- Vai trò hệ thống EMPLOYEE/ADMIN; chức vụ trưởng phòng lấy từ manager_id của phòng. PROJECT_MANAGER/TEAM_LEADER của mã dự án kế thừa không đồng nghĩa trưởng phòng.
- Quyền chuyên trách HR_MANAGE, TIME_REVIEW, PAYROLL_MANAGE được cấp tường minh. Admin kỹ thuật không mặc định có các quyền này.
- Web quản lý và xử lý đầy đủ các luồng bên dưới. Mobile kế thừa chưa sửa; giai đoạn mobile sẽ dùng cùng API, không tạo cơ sở dữ liệu hoặc nghiệp vụ thứ hai.
- `department_work` phục vụ công việc nội bộ theo phòng; module project/task cũ vẫn được giữ để truy vết và tương thích, không được tính là đã tái thiết kế theo phòng hay đưa lên menu web mới.

## Quyền và dữ liệu

| Tài nguyên | Xem | Thay đổi chính |
|---|---|---|
| Công việc phòng | Người phụ trách hiện tại, người kiểm tra, trưởng phòng hiện tại | Trưởng phòng giao/chỉnh sửa/bàn giao; người nhận cập nhật; người kiểm tra nghiệm thu |
| Yêu cầu hỗ trợ đã định tuyến | Người gửi, người xử lý hiện tại, trưởng phòng nhận | Người gửi tạo/bổ sung/kiểm tra kết quả; trưởng phòng điều phối; người xử lý thực hiện |
| Tệp gắn công việc/yêu cầu phòng | Cùng phạm vi tài nguyên | Chỉ gắn tệp đúng mục đích do mình tải; không xóa tệp đang liên kết |
| Tài khoản/phòng/quyền | Admin hệ thống | Admin quản lý truy cập; không tự khóa hoặc bỏ Admin cuối cùng |
| Ngừng truy cập theo hồ sơ nhân sự | HR_MANAGE | Ghi nhận quyết định đã có thẩm quyền, không tự kết luận sa thải |
| Công/đơn thời gian | Nhân viên xem của mình; trưởng phòng trong phạm vi; TIME_REVIEW khi được cấp | Không tự duyệt công/đơn; mọi đề nghị phải qua xác nhận |
| Thu nhập | Người hưởng hoặc PAYROLL_MANAGE | Chuyên trách khai báo/chốt; không tự chốt phiếu của mình |

JWT kiểm tra session và trạng thái tài khoản, quyền hiện tại lấy lại từ DB. Web dùng access token trong bộ nhớ và refresh token ở sessionStorage theo tab; logout xóa phía client và thu hồi phía máy chủ. CSP, kiểm tra nguồn truy cập proxy và escape nội dung được áp dụng. Chưa phải chứng nhận an toàn production; rate-limit/phục hồi email/thiết bị tin cậy vẫn là hạng mục cần hoàn thiện.

## Luồng hỗ trợ

OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED.

- Loại yêu cầu xác định phòng nhận; yêu cầu lưu snapshot phòng nhận. Đổi cấu hình loại không âm thầm chuyển yêu cầu cũ.
- Người phụ trách phòng đang hoạt động mới nhận/điều phối. Nhân viên nhận phải ACTIVE, thuộc phòng nhận, khác người gửi.
- Phân công có version cho yêu cầu đã định tuyến; phân công đồng thời không âm thầm ghi đè.
- Chưa phân công: trưởng phòng có thể yêu cầu bổ sung, tiếp nhận lại, chuyển sang loại ở phòng khác hoặc từ chối REJECTED; bắt buộc lý do.
- Đang xử lý: WAITING_FOR_USER ↔ IN_PROGRESS; phải có kết quả khi gửi RESOLVED. Người gửi xác nhận hoặc trả lại xử lý bằng lý do.
- Người gửi được hủy trực tiếp khi OPEN. Sau phân công: gửi đề nghị; người phụ trách phòng khác người gửi xem xét đồng ý/từ chối. Chưa được đồng ý thì trạng thái xử lý vẫn giữ.
- Người xử lý không tự xác nhận kết quả. CLOSED/CANCELLED/REJECTED không được phân công lại.
- Đổi người xử lý giữ trạng thái, tài liệu và lịch sử; người nhận mới phải ghi nhận rà soát trước khi thao tác xử lý tiếp.
- Chỉ một manager hiện tại cho mỗi phòng trong bản này. Hồ sơ cần người phê duyệt độc lập nhưng chính manager là người đề nghị phải chờ doanh nghiệp chỉ định người đủ thẩm quyền; hệ thống không tự cho Admin kỹ thuật duyệt thay.

## Công việc nội bộ và bàn giao

ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED. Người kiểm tra có thể RETURN về IN_PROGRESS với lý do.

- Một người phụ trách chính và một người kiểm tra độc lập. Không tự giao rồi tự nghiệm thu.
- Tiến độ từ 0–100; 100% nhập tay chưa tự đóng việc. Chỉ nghiệm thu hợp lệ mới hoàn tất.
- Chỉnh tiêu đề/nội dung/ưu tiên/hạn cần version và lý do; lưu hạn trước/sau.
- Bàn giao vào HANDOVER, lưu người trước/sau và snapshot tiến độ. Người nhận đọc lịch sử, ghi nhận vấn đề/phần tiếp tục rồi về IN_PROGRESS. Không reset 65% về 0% và không đổi tác giả cũ.
- Chưa tiếp nhận xong thì không tiếp tục phân công chồng lên một bàn giao khác.
- Công việc đã hoàn tất không tiếp tục chỉnh qua biểu mẫu làm việc thông thường.

## Tài khoản, chuyển phòng và ngừng làm việc

- Tạo phòng trước, gán nhân viên rồi chỉ định trưởng phòng thuộc phòng và còn hoạt động.
- Đổi trưởng phòng qua web chuyển người kiểm tra các công việc còn mở sang người mới. Phòng còn việc mở không được dừng hoặc bỏ trống người quản lý.
- Chuyển phòng phải xử lý trách nhiệm quản lý, công việc/yêu cầu và đơn thời gian đang chờ. Quyền chuyên trách được xem xét lại và ghi lịch sử.
- Khóa truy cập là thao tác kỹ thuật có lý do, khác quyết định nhân sự. Ngừng làm việc dùng DISABLED, không xóa hồ sơ, thu hồi các phiên.
- DISABLED là ghi nhận một quyết định đã có hiệu lực ngay, chưa phải bộ máy đề xuất/ký quyết định hoặc lịch nghỉ việc tương lai. Người giữ trách nhiệm trưởng phòng phải có người thay trước.
- Việc đang giữ chuyển vào hàng đợi bàn giao, giữ tiến độ/tác giả; yêu cầu hỗ trợ vẫn hiện ở hàng đợi phòng để quản lý phân lại, giữ các lần phân công cũ.
- Trách nhiệm project/task kế thừa còn mở phải bàn giao trước; không giả vờ đã chuyển chúng bằng chức năng department_work.

## Công, nghỉ và thu nhập

- Không tự đặt ngày công, lịch ca hoặc lương. TIME_REVIEW cấu hình từng tháng theo chính sách đã có. Không đổi lịch sau khi đã phát sinh công/đơn trong tháng.
- Bản này hỗ trợ ca trong một ngày, 06:00–22:00, tối đa 480 phút công thường. Ca đêm/qua ngày cần chính sách riêng, bị từ chối thay vì tính sai.
- Web nhập bản ghi có nguồn đối chiếu hoặc CSV tối đa 200 dòng/lượt, giao dịch nguyên lượt. Chưa kết nối máy vân tay, chưa có QR/GPS mobile. Không nhận dữ liệu công trực tiếp do nhân viên tự gửi vào endpoint nhập nguồn.
- Thiếu quét không tự kết luận vắng. Nhân viên đề nghị bổ sung công; người có quyền kiểm tra. Ghi nhận vắng phải có căn cứ, ngày đã kết thúc và thông báo để nhân viên yêu cầu xem xét lại.
- Đơn nghỉ hưởng lương cần quỹ đã được HR xác nhận; không tự đặt số ngày phép. Chống duyệt trùng ngày, chồng lên công đã xác nhận và vượt quỹ.
- Đơn tăng ca được duyệt trước chưa sinh tiền. Xác nhận thực tế cần nằm trong bản ghi công đã đối soát; không chồng lên ca thường, không nhận giờ tương lai.
- PAYROLL_MANAGE khai báo lương công việc và khoảng ngày được hưởng trong kỳ. Hệ thống đối soát công, nghỉ hưởng lương và tăng ca ban ngày theo loại ngày. Hiển thị công thức theo ngày và khoản còn chờ.
- Kết quả là tổng theo lương công việc trước các khoản khác; chưa có thuế, BHXH, phụ cấp, trợ cấp thôi việc, hoàn trả đào tạo hoặc engine bồi thường. Không tự phạt tiền khi trễ việc/làm sai.
- Chỉ chốt sau khi tháng kết thúc và không còn dữ liệu chờ/thiếu đối soát. Chốt lưu snapshot và khóa các nguồn của nhân viên trong kỳ. Chưa có mở lại kỳ/điều chỉnh hồi tố; không âm thầm sửa phiếu đã chốt. Không thực hiện chuyển tiền ngân hàng.

## API web bổ sung

- `/api/v1/workplace/context`, `/work`, `/work/{id}`, `/work/{id}/commands`: bối cảnh thật, công việc và hành động có quyền/version.
- `/workplace/requests?scope=mine|assigned|queue&page=0&search=...`: phân trang phía máy chủ, 20 yêu cầu/trang.
- `/service-requests`: tái sử dụng API hỗ trợ, tệp, bình luận và nghiệm thu hiện có; detail thêm receivingDepartmentId/workflow.
- `/workplace/requests/{id}/dispatch`, `/operations`: điều phối, hủy sau phân công, rà soát bàn giao.
- `/workplace/departments`, `/staff`, `/hr-staff`, `/staff/{id}/state`, `/categories/{id}/route`, `/notices`, `/audit`.
- `/workplace/time`: lịch, nguồn công, đơn, quỹ nghỉ, ghi nhận vắng và đối soát thu nhập. Server kiểm tra quyền; menu không phải hàng rào bảo mật.

Các màn có loading/error/empty/conflict và thông báo thao tác. Thanh điều hướng thu gọn được, theme sáng/tối được lưu, hiệu ứng nhận việc tôn trọng prefers-reduced-motion. Lịch công việc hiển thị hạn thực, không tạo giờ họp hoặc lịch chấm công giả.
