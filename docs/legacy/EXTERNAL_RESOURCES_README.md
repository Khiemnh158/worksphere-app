# WorkSphere External Resource Isolation Workspace (.external/)

Thư mục này là khu vực cách ly, lưu trữ tham khảo và quản lý tài nguyên bên ngoài cục bộ (quarantine, downloads, portable tools, offline extensions, reference repositories, external skills, and scans) của dự án WorkSphere.

Toàn bộ nội dung trong thư mục này được cấu hình trong `.gitignore` ngoại trừ tệp `README.md` này để đảm bảo **không bao giờ commit mã nguồn, binary, package hoặc artifact bên thứ ba vào Git repository**.

---

## Cấu Trúc Phân Vùng

```text
D:\WorkSphere\.external\
├── quarantine\    # Vùng cách ly: Tài nguyên mới tải về, chưa kiểm duyệt, TUYỆT ĐỐI KHÔNG THỰC THI
├── repos\         # Kho mã tham khảo: Repository bên thứ ba đã qua kiểm duyệt bảo mật và giấy phép (chỉ đọc)
├── skills\        # Kỹ năng (skills/workflows) bên ngoài đã được kiểm tra prompt injection và phê duyệt
├── templates\     # Boilerplate, template hoặc code mẫu đã được thẩm định
├── packages\      # Lưu trữ package metadata, tarball, jar trích xuất để kiểm toán trước khi thêm vào lockfile
├── tools\         # Công cụ CLI portable hoặc tiện ích độc lập đã được xác minh chữ ký/checksum
├── extensions\    # VSIX, extension metadata và artifact ngoại tuyến đã được kiểm định cho Antigravity/VS Code
├── downloads\     # Thư mục tạm chứa tệp đang tải về trước khi chuyển sang quarantine
├── cache\         # Bộ nhớ đệm có thể tải lại bất kỳ lúc nào mà không làm gián đoạn dự án
├── scans\         # Kết quả quét mã độc, quét lỗ hổng và kiểm toán bảo mật cục bộ (không commit)
└── manifests\     # Tệp manifest nguồn gốc (provenance), metadata JSON định dạng máy đọc
```

---

## Nguyên Tắc Vận Hành

1. **Quarantine First**: Mọi tài nguyên tải từ Internet phải được đưa vào `.external/quarantine/` trước tiên.
2. **Không Thực Thi Khi Chưa Duyệt**: Tuyệt đối không chạy lệnh cài đặt, lifecycle scripts (`postinstall`), build, hoặc khởi động binary trong `quarantine/`.
3. **Thăng Cấp Sau Kiểm Tra (Promotion)**: Chỉ di chuyển tài nguyên từ `quarantine/` sang `repos/`, `skills/`, `templates/`, `tools/` sau khi hoàn tất các cổng kiểm soát:
   - Nguồn gốc chính thức và đáng tin cậy (Tier 1 hoặc Tier 2).
   - Giấy phép tương thích chuẩn SPDX (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC).
   - Kiểm tra SHA-256 checksum hoặc chữ ký số.
   - Quét secret, backdoor, obfuscated scripts, network calls.
   - Ghim commit cố định (immutable commit SHA hoặc version digest).
4. **Đăng Ký Sổ Theo Dõi**: Mọi tài nguyên được lưu trữ hoặc tái sử dụng bắt buộc phải được ghi nhận vào `reports/EXTERNAL_RESOURCE_REGISTRY.md` hoặc `reports/TOOL_EXTENSION_REGISTRY.md`.
5. **Dọn Dẹp**: Các tệp bị từ chối (`REJECTED`) hoặc vùng nhớ đệm `cache/`, `downloads/` có thể được dọn dẹp an toàn theo quy định tại `reports/runbooks/EXTERNAL_RESOURCE_ACQUISITION.md`.
