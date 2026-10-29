# Ghi chú import

- Role quản trị trong source là ADMIN. Một đoạn đề xuất trong PDF audit gốc dùng tên khái niệm SYSTEM_ADMIN; tài liệu PRODUCT_PLAN hiện hành dùng đúng ADMIN, chưa đổi enum/seed.
- Hai patch F01/F02 đã được nhập. Các trạng thái cục bộ trong findings/PDF là bằng chứng tại thời điểm audit, không có nghĩa các lỗi khác đã sửa.
- Metadata binary bảo vệ PDF/keystore khi clone trên Windows; wrapper Maven/Gradle giữ LF và quyền thực thi Git.
- Khoảng trắng thừa có sẵn trong migration/tài liệu kế thừa được giữ, không sửa migration đã chạy để làm sạch snapshot.
