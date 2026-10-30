# Phạm vi được người dùng yêu cầu triển khai

Cập nhật 30/10/2026: người dùng chọn QR xoay vòng và hộp thư thử local; sau yêu cầu kiểm tra kỹ web rồi tiếp tục mobile, cổng kiểm tra web đã đạt và Android đợt đầu đã triển khai (reports/WEB_READINESS_2026-10-30.md, reports/MOBILE_FIRST_CLIENT_2026-10-30.md). Nội dung nghiên cứu dưới đây là căn cứ kế hoạch; kết quả triển khai phải đọc WEB_PHASE2_CONTRACT.md và reports/WEB_PHASE2_IMPLEMENTATION.md.

# Kế hoạch hoàn thiện WorkSphere: web trước, mobile sau

Ngày tổng hợp: 30/10/2026, Asia/Saigon.

Trạng thái: đây là căn cứ kế hoạch lịch sử. Web đã triển khai và mobile đang phát triển theo phạm vi trong TODO.md; không dùng danh sách đề xuất ở dưới để suy ra mọi chức năng đều đã hoàn tất. Hạn mức phục hồi không tự khởi động công việc.

## 1. Cơ sở và cách sử dụng

Người dùng yêu cầu phần mềm đúng logic doanh nghiệp, không tự thêm nghiệp vụ vô căn cứ; web phải có điểm kết thúc để chuyển sang mobile. Tài liệu này tổng hợp các sửa đổi được yêu cầu và mô hình đề xuất sau khi tra cứu. Các đề xuất mới (vai trò lãnh đạo, phê duyệt bảng lương độc lập, QR chấm công) chưa phải chức năng đã có hoặc chính sách của một doanh nghiệp thật.

Không có một quy trình nội bộ áp dụng cho mọi doanh nghiệp. Phải phân biệt quy định pháp luật, cách tổ chức tham khảo và chính sách mô hình hóa cho đồ án.

Nguồn tham khảo chính:

- Microsoft: cấu hình người phê duyệt và người thay thế: https://learn.microsoft.com/en-us/dynamics365/business-central/across-how-to-set-up-approval-users
- Microsoft: hành động phê duyệt, từ chối, yêu cầu sửa và chuyển người duyệt: https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/organization-administration/workflow-actions
- Bộ luật Lao động, bản hợp nhất 18/VBHN-VPQH ngày 12/02/2026: https://vanban.chinhphu.vn/?classid=0&docid=217002&pageid=27160
- PDF chính thức: https://congbaocdn.chinhphu.vn/180507251028987904/2026/3/5/468971-1772684381_v1_1772690833_signed.pdf
- ADP: ghi nhận quy trình, phân vai và phương án kế nhiệm công việc lương: https://www.adp.com/spark/articles/2023/11/document-your-payroll-processes-the-why-the-what-and-the-how.aspx
- OWASP: khôi phục mật khẩu: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

Điều 18 quy định thẩm quyền giao kết hợp đồng; không dùng riêng điều này để suy ra quyền sa thải. Điều 118, 122, 125 liên quan thẩm quyền nội quy, trình tự và căn cứ kỷ luật; một nút bấm không thay thế thủ tục đó. Điều 127 cấm phạt tiền/cắt lương thay kỷ luật. Đồ án lưu căn cứ và quyết định có thẩm quyền, không tự xác định sa thải hoặc mức bồi thường hợp pháp.

## 2. Mô hình tổ chức đề xuất

Giữ ba phòng: Kinh doanh; Công nghệ thông tin; Hành chính–Nhân sự.

Thêm vai trò nghiệp vụ Ban lãnh đạo/Giám đốc, không thêm phòng ban mới. Admin hệ thống không mặc định là giám đốc và không duyệt mọi nghiệp vụ.

Ba lớp độc lập:

1. Quyền hệ thống: tài khoản sử dụng thông thường, tài khoản quản trị kỹ thuật.
2. Tổ chức: phòng ban, chức danh, quan hệ quản lý trực tiếp.
3. Nhiệm vụ/quyền nghiệp vụ: quản lý phòng, hồ sơ nhân sự, kiểm tra công, lập bảng lương, phê duyệt theo thẩm quyền.

Chức danh mới không tự phát sinh quyền. Tài khoản quản trị riêng với tài khoản làm việc cá nhân của cùng một người. Mọi quyền kiểm tra ở máy chủ, không chỉ ẩn menu.

## 3. Quy tắc phê duyệt đề xuất

- Việc của nhân viên: trưởng phòng hoặc người có thẩm quyền nghiệm thu được phân công.
- Đơn nghỉ/tăng ca của nhân viên: trưởng phòng xem xét hoạt động; chuyên trách kiểm tra chính sách và dữ liệu khi cần.
- Đơn và công việc cần phê duyệt của trưởng phòng: giám đốc/cấp quản lý trực tiếp được xác định trong mô hình.
- Trưởng phòng vắng: người được chỉ định thay thế, có phạm vi và thời hạn; nếu không có người phù hợp, chuyển cấp trên theo cấu hình.
- Người thay thế có thể là phó phòng/người phụ trách được giao quyền; không tự chọn ngẫu nhiên hoặc tự mặc định trưởng phòng khác/HR.
- Không tự duyệt, không duyệt hồ sơ liên quan bản thân bằng quyền thay thế. Không tự chuyển tiếp ủy quyền vô hạn.
- Hết thời gian thay thế sẽ mất quyền; hồ sơ chưa xong phải được điều phối lại có ghi lịch sử.
- Không có người đủ thẩm quyền: báo cần bố trí người duyệt, không tự chấp thuận, không mặc định chuyển Admin.
- Cấp cao nhất có hồ sơ của chính mình: ghi nhận căn cứ phê duyệt/quyết định ngoài ứng dụng theo thẩm quyền thực tế; không tạo chuỗi cấp trên vô tận hoặc cho tự duyệt âm thầm.
- Lưu người được giao ban đầu, người quyết định thật, căn cứ và thời điểm. Cả người gửi và người nhận được thông báo phù hợp.

## 4. Hồ sơ nhân sự và nghỉ việc

Tách kiểm tra/hoàn tất hồ sơ hành chính khỏi quyết định tuyển dụng, chuyển vị trí, chấm dứt hợp đồng và thanh toán.

Luồng đề xuất:

1. Nhân viên/trưởng phòng khởi tạo đề nghị hoặc HR nhập quyết định đã có.
2. HR kiểm tra hồ sơ, căn cứ, mốc có hiệu lực và thông tin cần xử lý.
3. Người có thẩm quyền doanh nghiệp phê duyệt/ghi nhận quyết định. HR chỉ ký quyết định khi thực sự được giao thẩm quyền tương ứng.
4. Hệ thống tạo các đầu việc song song: quản lý phòng bàn giao; Admin thu hồi quyền; chuyên trách công/lương đối soát; HR kiểm tra danh mục hoàn tất.
5. Thu hồi truy cập theo thời điểm hiệu lực đã xác định, không chờ bàn giao hoặc lương xong. Chặn truy cập trực tiếp và refresh token sau thu hồi.
6. Giữ tài khoản/lịch sử ở trạng thái ngừng hoạt động, không xóa tác giả hoặc dữ liệu công việc.
7. Hồ sơ chỉ được ghi hoàn tất hành chính khi các mục bắt buộc của nó xong; trạng thái quyết định, truy cập, bàn giao và thanh toán hiển thị riêng.

Khóa khẩn cấp vì bảo mật là hành động kỹ thuật có lý do/nhật ký, không tự coi là sa thải. Không cho quên mật khẩu tự mở tài khoản đã bị khóa/ngừng làm việc.

Người HR, chuyên trách công/lương hoặc trưởng phòng nghỉ: có người tiếp nhận từng hồ sơ đang giữ, thu hồi quyền cũ và kiểm tra xung đột lợi ích; không chỉ bàn giao công việc chung.

## 5. Công và bảng tính lương

Mô hình đồ án: HCNS có nhân sự chuyên trách tổng hợp/kiểm tra công và lập bảng tính lương. Không mặc định toàn phòng có quyền. Giám đốc/người được giao quyền xem xét phê duyệt bảng tính; không thêm phân hệ kế toán đầy đủ.

- Trưởng phòng xác nhận dữ liệu công thuộc phòng; chuyên trách xử lý đối soát theo quyền, giữ nguồn gốc và lý do sửa.
- Người lập và người phê duyệt bảng tính phải khác người. Xử lý riêng phần liên quan chính người duyệt bằng người có thẩm quyền độc lập.
- Phân biệt nháp, chờ kiểm tra/phê duyệt, đã chốt và phiếu đã phát hành. Dữ liệu chốt có bản lưu; sửa cần quy trình điều chỉnh có lịch sử, không ghi đè im lặng.
- Chốt/phát hành phiếu không đồng nghĩa chuyển tiền. Chưa tích hợp ngân hàng thì không tự đánh dấu đã thanh toán.
- Không mặc định lương ngày bằng lương tháng/30. Phải có lịch, thỏa thuận và quy tắc được nhập, có phiên bản/mốc hiệu lực; chưa có thì chặn phép tính tương ứng và giải thích.
- Nghỉ hưởng lương, nghỉ không hưởng lương, thiếu dữ liệu, vắng có xác nhận là các trạng thái khác nhau.
- Tăng ca đăng ký/được duyệt chưa thành tiền: cần giờ thực tế xác nhận, không trùng giờ, không tự sửa đồng hồ để nhận tiền.
- Không tự phạt tiền hoặc suy ra bồi thường từ vi phạm.
- Thu nhập cá nhân ưu tiên mobile; web chuyên trách kiểm tra/lập/phê duyệt theo phạm vi. Admin kỹ thuật không mặc định xem dữ liệu lương nghiệp vụ.
- Không mở rộng thuế/BHXH/thực lĩnh đầy đủ, ca qua đêm và chuyển tiền ngân hàng trong đợt này.

## 6. Danh sách triển khai web

### A. Quyền, menu và dữ liệu

- Tách không gian quản trị và làm việc cá nhân; sửa quyền API song song UI.
- Admin: tổng quan quản trị, tài khoản, phòng ban/chức vụ, quyền truy cập, yêu cầu quản trị, cấu hình tiếp nhận và nhật ký.
- Nhân viên: việc của tôi, lịch, yêu cầu hỗ trợ, danh bạ phòng, công/nghỉ/tăng ca, hồ sơ và bảo mật.
- Trưởng phòng: chức năng cá nhân và khu quản lý phòng, điều phối, phê duyệt, nghiệm thu, bàn giao.
- Lãnh đạo: việc cần duyệt theo thẩm quyền và tổng quan nghiệp vụ cần thiết; không tự động đọc mọi hồ sơ/tệp riêng tư.
- Chuyên trách HCNS/công/lương chỉ có menu và dữ liệu thuộc trách nhiệm được giao.
- Tách nhãn và quyền theo ba lớp, mô tả rõ từng nhiệm vụ. Không dùng tên chức danh tùy ý để tự cấp quyền.

### B. Tài khoản và khôi phục

- Tạo riêng lẻ hoặc import hàng loạt có mẫu, kiểm tra dòng lỗi/trùng, xem trước và báo kết quả.
- Mỗi người có mã nhân viên ổn định; tên đăng nhập duy nhất. Cho chọn tên đăng nhập ở bước kích hoạt nếu áp dụng, không đổi ID lịch sử.
- Liên kết kích hoạt riêng từng người, có hạn, dùng một lần; tự đặt mật khẩu, xác minh email và bổ sung hồ sơ trước khi dùng nghiệp vụ.
- Không xuất mật khẩu yếu/dùng chung hoặc ghi bí mật vào log/Git.
- Kênh khôi phục chính đề xuất: email đã xác minh, liên kết một lần hết hạn 15 phút (chính sách đồ án, không phải con số pháp luật).
- Đặt mật khẩu ngay trong luồng khôi phục rồi đăng nhập bình thường; không cấp phiên nghiệp vụ bằng OTP trước khi đổi mật khẩu.
- Giới hạn gửi/nhập; phản hồi không tiết lộ tài khoản có tồn tại; lưu mã an toàn, thu hồi mã/phiên cũ sau thành công; thông báo và nhật ký không chứa bí mật.
- Không có email truy cập được: xác minh thủ công với đầu mối được giao; Admin phát hành lại kích hoạt theo căn cứ, không đọc mật khẩu.
- SMS không là phụ thuộc bắt buộc. Email thật cần cấu hình dịch vụ gửi và địa chỉ thật; local dùng hộp thư thử và ghi rõ đang thử.
- Tài khoản đặc quyền đề xuất thêm xác thực hai bước bằng ứng dụng xác thực và mã dự phòng lưu an toàn; không cố định mật khẩu/mã demo trong mã nguồn.

### C. Luồng nghiệp vụ chính

- Công việc phòng: tạo, giao, nhận, thực hiện, báo vướng, cập nhật tiến độ, gửi kết quả, nghiệm thu/yêu cầu sửa, hoàn tất.
- Phân biệt trạng thái với phần trăm; 100% chưa tự hoàn tất khi chưa nghiệm thu.
- Yêu cầu hỗ trợ: gửi đúng nơi, tiếp nhận/bổ sung/chuyển/từ chối, giao người xử lý, thực hiện, giải quyết, người gửi xác nhận hoặc trả lại.
- Tách giao việc nội bộ với yêu cầu liên phòng. Không mở rộng báo giá thành CRM; danh mục hỗ trợ phải có tình huống hợp lý và phòng chịu trách nhiệm.
- Hồ sơ quản trị tài khoản/quyền được phân luồng riêng với hỗ trợ máy tính thông thường.
- Hủy/chuyển/đổi hạn/đổi người phải đúng trạng thái, có quyền và lý do. Không hai người cùng nhận/duyệt một phiên bản trái nhau.
- Tệp và trao đổi theo quyền hồ sơ; không để liên kết trực tiếp vượt quyền hoặc lộ ghi chú nội bộ.
- Bàn giao giữ tiến độ/tác giả/tệp/lịch sử. Người mới kiểm tra phần cũ, ghi vấn đề rồi tiếp tục. Không xóa công của người trước.
- Thông báo dẫn đến đúng hồ sơ, phân biệt cần hành động và chỉ để biết; có đã đọc/chưa đọc.

### D. Danh bạ và giao diện

- Danh bạ phòng mặc định, đầu mối hỗ trợ liên phòng; không trả toàn bộ nhân sự qua API rồi mới ẩn ở UI.
- Tìm kiếm, lọc, phân trang máy chủ, mặc định 20 người/trang; áp dụng nhất quán cho các danh sách cần thiết.
- Thành viên có thể tìm người và đề nghị phối hợp; không có quyền tự giao việc bắt buộc cho đồng nghiệp.
- Menu có vùng logo/nút mở luôn truy cập được; logo cũng mở được; giữ vị trí cuộn, trạng thái chọn và thu gọn khi đổi trang.
- Hết tràn ngang không cần thiết; thanh cuộn gọn/tự ẩn nhưng giữ cuộn bằng chuột, bàn phím, cảm ứng.
- Tooltip/nhãn khi menu thu gọn, hỗ trợ focus; sáng/tối đồng bộ qua đăng nhập, bảng, biểu mẫu và hộp thoại.
- Trang đăng nhập cải thiện bố cục và chuyển động nhẹ; trạng thái chờ/lỗi rõ.
- Hiệu ứng ngắn khi nhận việc, mở hộp thoại, hoàn tất hành động; không chạy chữ/dữ liệu liên tục; hỗ trợ giảm chuyển động.
- Tổng quan theo người dùng: việc cần xử lý, chờ phản hồi, sắp quá hạn, quá hạn, bàn giao. Không trộn người chờ mình với mình đang chờ người khác.

## 7. Kiểm thử và điểm dừng web

Thử bằng nhiều danh tính thật trên cùng bộ dữ liệu: nhân viên, quản lý từng phòng, người thay thế, HR, chuyên trách công/lương, lãnh đạo, Admin.

- Kiểm tra đúng và sai quyền, URL/API trực tiếp, tệp, phạm vi tìm kiếm/phân trang, không tự duyệt.
- Đi hết luồng công việc, hỗ trợ, bàn giao, nghỉ việc và hồ sơ liên quan.
- Kiểm tra ủy quyền hết hạn/xung đột; hai người cùng duyệt; người bị khóa khi đang mở trình duyệt; đổi tài khoản không lẫn dữ liệu.
- Kích hoạt/reset hết hạn, dùng lại mã, gửi liên tục, mất email, tài khoản bị khóa, thu hồi phiên và 2FA đặc quyền nếu triển khai.
- Công/nghỉ/OT trùng, thiếu dữ liệu, thay chính sách và sửa sau chốt không phá bản lưu.
- Đăng nhập/menu/biểu mẫu/phím/chế độ sáng tối/màn hẹp, không có lỗi cuộn như ảnh phản hồi.
- Kết quả mới phải chạy và báo thật; không dùng lại số 120+5 cũ để khẳng định các sửa đổi tương lai đã được kiểm thử.

Web hoàn thành giai đoạn khi các luồng phạm vi trên đi xuyên suốt, dữ liệu/phiên/quyền nhất quán, không còn lỗi chặn hoặc vượt quyền đã biết, có hướng dẫn chạy và dữ liệu thử. Ý tưởng ngoài phạm vi ghi backlog; không trì hoãn mobile để làm ERP toàn diện.

## 8. Mobile sau mốc web

Dùng chung backend Spring Boot target Java 21, cơ sở dữ liệu, định danh và quy tắc quyền/trạng thái. Không làm một hệ thống nghiệp vụ độc lập hoặc sao chép dữ liệu bằng tay.

- Đăng nhập/kích hoạt/khôi phục và thu hồi phiên.
- Công việc cá nhân, nhận việc, cập nhật và gửi kết quả/tệp.
- Tiếp nhận bàn giao, kiểm tra phần đã làm.
- Gửi/theo dõi hỗ trợ, phản hồi và xác nhận.
- Thông báo theo quyền; thông báo đẩy không để lộ nội dung lương trên màn hình khóa.
- Công/nghỉ/tăng ca và phiếu cá nhân đã phát hành, khiếu nại sai lệch theo hồ sơ.
- Mobile không ôm toàn bộ bảng quản trị/phê duyệt hàng loạt của web.

Phương án chấm công đồ án đề xuất: QR xoay vòng tại điểm chấm công ở văn phòng, kiểm tra hạn/thử lại/trùng trên máy chủ, dùng thời gian máy chủ, lưu sự kiện gốc và điều chỉnh có duyệt. QR/GPS/thiết bị không chứng minh tuyệt đối người thật có mặt; không quảng cáo chống gian lận 100%. Phải chốt cơ chế trước khi code, vì người dùng từng hỏi vân tay. Máy vân tay thật cần thiết bị/giao thức; import nguồn thử phải ghi rõ, không gọi là tích hợp thật. Sinh trắc mở khóa điện thoại không thay máy chấm công vân tay doanh nghiệp.

Đồng bộ: thao tác được máy chủ xác nhận mới thành công; tải lại khi mở màn hình và sau thao tác; thông báo để cập nhật kịp. Chưa làm duyệt/chấm công ngoại tuyến; mất mạng hiển thị chưa ghi nhận, không tự tính công từ đồng hồ máy.

## 9. Thứ tự và ranh giới

1. Đối chiếu code/baseline; lập ma trận quyền và sơ đồ trạng thái theo kế hoạch.
2. Quyền tổ chức, lãnh đạo và thay thế; tài khoản/kích hoạt/khôi phục.
3. Công việc, hỗ trợ, bàn giao, hồ sơ nhân sự và yêu cầu quản trị.
4. Công và bảng tính lương trong phạm vi, độc lập người lập/duyệt.
5. Menu, danh bạ, sáng/tối, phân trang và hiệu ứng; kiểm tra UI từng đợt.
6. Kiểm thử xuyên suốt, hướng dẫn và bàn giao mốc web.
7. Mobile dùng chung API, sau đó thử tương tác web/mobile và thu hồi quyền xuyên thiết bị.

worksphere-app là nguồn nghiệp vụ chung. Repo An toàn thông tin và Triển khai phần mềm bổ sung kiểm thử/bằng chứng/cấu hình của môn mình theo phiên bản app xác định; không nhân ba bản nghiệp vụ để sửa khác nhau. Không tự merge main/publish dữ liệu nhạy cảm trong lúc lập kế hoạch.

Phải trao đổi khi có xung đột nghiệp vụ thực sự hoặc phụ thuộc cần người dùng cung cấp (email gửi thật, thiết bị, yêu cầu môn). Không hỏi người dùng tự đoán quy trình doanh nghiệp cơ bản; chủ động tra cứu và đưa phương án có căn cứ. Không tự thêm phòng ban/phân hệ thuế/CRM/kế toán/khung workflow tổng quát hoặc cam kết pháp lý ngoài phạm vi.
