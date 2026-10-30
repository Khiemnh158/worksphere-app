# Hợp đồng web giai đoạn 2

Ngày 30/10/2026. Tài liệu này bổ sung và thay các giới hạn cũ tương ứng trong WEB_WORKFLOWS.md. Không phải một bộ quy trình pháp lý áp dụng cho mọi doanh nghiệp.

## Tổ chức và quyền

Giữ ba phòng mẫu, có thể thêm phòng. ADMIN là quản trị kỹ thuật; EMPLOYEE là tài khoản làm việc. Trưởng phòng theo departments.manager_id, chức danh là mô tả riêng. EXECUTIVE là nhiệm vụ lãnh đạo; department_authority quy định phòng được phụ trách. HR_MANAGE, TIME_REVIEW, PAYROLL_MANAGE và PAYROLL_APPROVE là các nhiệm vụ riêng, không tự phát sinh từ tên phòng/chức danh.

Tài khoản ADMIN không kiêm nhiệm quyền nghiệp vụ trên cùng tài khoản; không tự cấp chuyên trách cho mình. Giao diện quản trị riêng, không có menu công việc/công/lương cá nhân. Các API dự án kế thừa vẫn tồn tại và chưa được nhận là đã chuyển hoàn toàn sang portal mới.

OPERATIONS giao thay điều phối/nghiệm thu trong phòng; TIME giao thay xem xét công/nghỉ/tăng ca. Thời hạn tính theo máy chủ, không chuyển tiếp quyền thay thế. Người giao phải còn đủ thẩm quyền; người nhận phải còn thuộc đúng phòng và được phép truy cập. Hồ sơ của trưởng phòng chuyển lãnh đạo phụ trách; không tự duyệt. Không có người có thẩm quyền thì báo cần bố trí, không tự chấp thuận hoặc mặc định cho Admin.

Lãnh đạo nhìn hồ sơ theo phòng phụ trách; thu hồi nhiệm vụ EXECUTIVE làm mất quyền đọc/duyệt liên quan. Dữ liệu lương cần nhiệm vụ riêng. Người đang được giao nghiệm thu có quyền đọc công việc đó; bên ngoài phạm vi không được tải tệp trực tiếp.

## Công việc và hỗ trợ

Công việc: ASSIGNED → IN_PROGRESS → REVIEW → COMPLETED; REVIEW có thể trả lại IN_PROGRESS. BLOCKED ghi vướng mắc và lý do tiếp tục; không được gửi nghiệm thu khi còn BLOCKED. CANCELLED là kết thúc có căn cứ, không xóa lịch sử. HANDOVER giữ tiến độ/tệp/tác giả; người mới ghi rà soát trước khi tiếp tục. Phần trăm không tự nghiệm thu.

Yêu cầu hỗ trợ vẫn theo nơi tiếp nhận được chụp tại lúc gửi, điều phối/phân công/trao đổi/giải quyết/người gửi xác nhận. Các sửa đổi yêu cầu version; hành động không đúng trạng thái bị từ chối. Cấu hình danh mục không đồng nghĩa Admin trực tiếp xử lý hỗ trợ.

## Nhân sự và thu hồi truy cập

personnel_cases: DRAFT → SUBMITTED → APPROVED/REJECTED → CLOSED. Bản thân/trưởng phòng/HR tạo đề nghị; HR độc lập với người liên quan kiểm tra; lãnh đạo phụ trách độc lập quyết định. Hồ sơ của cấp cao nhất không tự duyệt: cần bố trí thẩm quyền/căn cứ ngoài ứng dụng theo mô hình thực tế.

APPROVED đặt access_ends_at ngay trong giao dịch. Đến mốc đó, cả JWT và refresh bị từ chối dù tác vụ nền chưa chạy. Tác vụ nền hoàn thiện trạng thái DISABLED, thu hồi phiên/nhiệm vụ, hủy bàn giao đang chờ của người bị thu hồi và đưa việc chưa xong vào hàng chờ với tiến độ cũ. Admin kiểm tra/xác nhận đầu việc truy cập. Quản lý xác nhận bàn giao khi không còn trách nhiệm tồn; chuyên trách xác nhận đối soát sau mốc hiệu lực; HR chỉ đóng khi các mục bắt buộc đã hoàn tất.

Khóa bảo mật khẩn cấp không đồng nghĩa sa thải. Không xóa tài khoản/tác giả. Hồ sơ và trạng thái này không thay việc ký quyết định/hợp đồng hay tự xác định căn cứ sa thải, bồi thường.

access_requests tách đề nghị LOCK/UNLOCK/CHANGE_ACCESS/OFFBOARD, lãnh đạo xét theo phòng, Admin thực hiện. Đổi quyền vẫn được ghi nhận tại màn Tài khoản & quyền theo căn cứ; chưa có ký số hoặc engine kiểm tra tính hợp pháp của văn bản phê duyệt.

## Tài khoản, thư và xác thực

Tạo tài khoản ở PENDING; mật khẩu ngẫu nhiên không gửi cho người dùng. Liên kết ACTIVATE riêng, hạn 24 giờ, xác minh email, đặt mật khẩu và thông tin trước khi ACTIVE. Mã nhân viên giữ ổn định khi đổi tên đăng nhập. CSV UI có bốn cột username,email,fullName,departmentCode, tối đa 200 nhân viên; xem trước và tạo nguyên lượt. API dùng departmentId/role và kiểm tra lại khi xác nhận; trùng/lỗi không lưu một phần.

RESET qua email đã xác minh, hạn 15 phút, dùng một lần, không cấp phiên nghiệp vụ trước khi đặt lại mật khẩu. Mã chỉ lưu hash; hàng đợi thư mã hóa. Sau thành công thu hồi phiên/mã cũ, gửi thông báo và ghi nhật ký không chứa bí mật. Tài khoản đã khóa/ngừng/hết thời hạn không tự mở lại. Mật khẩu mới tối thiểu 12 ký tự, tối đa 72 byte UTF-8 do BCrypt. Link reset kế thừa chưa gửi được thư ở bản cũ không dùng cho luồng mới: yêu cầu một link mới.

Rate window theo máy chủ: tối đa 100 POST mỗi loại auth/IP/15 phút; login thêm 20 lần/tài khoản/15 phút; forgot thêm 5 lần/email/15 phút và vẫn trả thông báo chung. Đây là mức cấu hình ban đầu cho đồ án, chưa phải đánh giá tải/DoS production.

TOTP có thể bật tại Bảo mật, xác nhận mật khẩu và mã ứng dụng. Secret mã hóa, mã thời gian không dùng lại; tám mã dự phòng chỉ hiển thị một lần và lưu hash. Đổi/tắt cần bằng chứng của chủ tài khoản. Đặt lại mật khẩu không tắt TOTP. TOTP đang là opt-in; không có cơ chế tự hạ bảo mật khi mất điện thoại/mã dự phòng.

Thư hiện chỉ ra hộp thư thử private trên máy khi bật worksphere.mail.local-enabled và local-path trong profile dev; không có endpoint đọc hộp thư qua web, không gửi email thật. SMTP/SMS thật không thuộc cấu hình được người dùng cung cấp trong lượt này.

## Công và bảng tính lương

Không tự đặt lịch/mức lương/quỹ phép. Chuyên trách nhập nguồn, trưởng phòng/người duyệt phù hợp kiểm tra. Đơn của trưởng phòng cần lãnh đạo đúng phòng, HR/TIME_REVIEW không tự vượt tuyến này. Người nộp thay không tự duyệt. Sau nghỉ việc có thể nhập/đề nghị điều chỉnh công quá khứ theo mốc kết thúc đã xác nhận; lưu submitted_by và giữ lịch sử. Không chấm tiếp cho thời gian vượt mốc đó.

approval_state: DRAFT → SUBMITTED → APPROVED → PUBLISHED. Người lập/gửi khác người duyệt và người liên quan. Phát hành cần dữ liệu đủ, tháng kết thúc, kiểm tra bản lưu đã duyệt vẫn trùng dữ liệu hiện tại rồi khóa nguồn. Nguồn thay đổi thì trả lại/duyệt lại. Điều chỉnh sau phát hành lưu bổ sung riêng, duyệt độc lập; không ghi đè phiếu gốc. Không tự phạt, không coi phát hành là chuyển tiền. Cá nhân chỉ có dữ liệu phiếu đã phát hành, menu cá nhân ưu tiên mobile; web chuyên trách dùng Bảng tính lương. Chưa tính đầy đủ thuế/BHXH/thực lĩnh/ca qua đêm.

## QR và mobile

TIME_REVIEW quản lý điểm chấm công. QR tạo bằng ZXing core 3.5.3 tại máy chủ, nonce ngẫu nhiên, hạn 40 giây; web thay sau 30 giây. Đóng điểm vô hiệu hóa challenge ngay. Payload worksphere-attendance:<nonce>; API punches yêu cầu tài khoản người chấm và token không có tiền tố. Không nhận userId hoặc thời gian do client tự khai.

Một IN/OUT/người/ngày, không OUT trước IN, không dùng mã hết hạn/điểm đóng, không tạo công đã chốt. OUT tạo bản ghi PENDING nếu chưa có nguồn khác, không ghi đè dữ liệu nhập. QR là một kiểm soát, không chứng minh tuyệt đối người thật có mặt; chưa có ràng buộc thiết bị/GPS. Mobile quét và luồng mất mạng sẽ làm sau khi người dùng nghiệm thu web. Không có thay đổi native mobile trong giai đoạn này.

## Giới hạn vận hành

Directory phân trang 20/người/phòng, đầu mối liên phòng tách riêng. Ticket cũng phân trang máy chủ. Các danh sách hồ sơ/nhật ký hiện giới hạn 200, bộ chọn nhân sự nghiệp vụ 1000; chưa phải kiểm chứng quy mô hàng chục nghìn người. Phải tiếp tục phân trang các danh sách này nếu mở rộng ngoài mô hình SME của đồ án.

Chưa có bộ ký quyết định pháp lý, ngân hàng, CRM, kế toán/thuế toàn diện, vân tay thật, SMS/SMTP thật, SSO hay xác nhận production. Testcontainers legacy cần Docker; xem báo cáo để biết tập kiểm thử đã chạy.
