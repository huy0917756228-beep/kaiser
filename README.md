# NovaAuth - Hệ Thống Xác Thực & Bảng Điều Khiển Quản Trị Viên (Admin Console)

Dự án xác thực tài khoản hiện đại, giao diện đồ họa cao cấp chuẩn **Glassmorphism**, tích hợp **Trang Quản trị viên (Admin Dashboard)** và cơ chế **Lưu trữ, đồng bộ dữ liệu tài khoản trên [Drive của tôi - Google Drive](https://drive.google.com/drive/my-drive)**.

---

## ✨ 1. Tính Năng Trang Quản Trị Viên (`admin.html`)

- 🛡️ **Lớp bảo mật Admin PIN Gate**: Ngăn chặn truy cập trái phép bằng mã PIN bảo vệ 6 chữ số (Mã mặc định: `123456`).
- 👥 **Quản lý danh sách người dùng chuyên nghiệp (CRUD)**:
  - Xem danh sách đầy đủ: Avatar, Họ tên, Email, Vai trò, Phương thức, Ngày tham gia, Lần đăng nhập cuối, Trạng thái.
  - **Khóa / Mở khóa tài khoản (Lock/Unlock)**: Tài khoản bị khóa sẽ lập tức bị chặn khi cố gắng đăng nhập tại trang người dùng.
  - **Chuyển đổi vai trò**: Nâng cấp/hạ cấp nhanh giữa `Admin` và `User`.
  - **Thêm tài khoản thủ công**: Modal thêm tài khoản mới trực tiếp từ giao diện quản trị.
  - **Xóa tài khoản**: Xóa tài khoản với hộp thoại xác nhận an toàn.
- 🔍 **Tìm kiếm & Lọc thời gian thực**: Tìm tức thì theo tên/email; lọc theo Trạng thái (Hoạt động/Đã khóa), Phương thức (Google/Email), Vai trò (Admin/User).
- 📊 **Thẻ thống kê thông minh (KPIs)**: Đếm tổng tài khoản, tài khoản hoạt động, tài khoản bị khóa, tỉ lệ Google OAuth 2.0.
- 📥 **Xuất / Nhập dữ liệu sao lưu**:
  - Xuất danh sách dạng bảng tính Excel/CSV (`.csv` chuẩn UTF-8).
  - Tải về tệp sao lưu JSON (`users_database.json`).

---

## ☁️ 2. Kết Nối & Lưu Trữ Trên Google Drive

- 📁 **Vị trí lưu trữ tự động**: Hệ thống lưu vào thư mục `NovaAuth_Database` ngay trong **[Drive của tôi - Google Drive](https://drive.google.com/drive/my-drive)** dưới tệp `users_database.json`.
- 🔒 **Quyền truy cập an toàn tối đa**: Sử dụng scope `https://www.googleapis.com/auth/drive.file` — chỉ có quyền thao tác trên tệp do chính ứng dụng tạo ra, bảo đảm 100% an toàn cho toàn bộ dữ liệu cá nhân khác của bạn trên Drive.
- 🔄 **Tính năng đồng bộ thông minh**:
  - **Tự động đồng bộ (Auto-Sync)**: Mỗi khi có tài khoản mới đăng ký từ `index.html` hoặc khi Admin khóa/sửa tài khoản, dữ liệu tự động cập nhật lên Google Drive.
  - **Đồng bộ thủ công (Push to Drive)**: Nút đẩy bản ghi hiện tại lên Drive bất kỳ lúc nào.
  - **Khôi phục từ Drive (Pull from Drive)**: Nạp lại cơ sở dữ liệu mới nhất từ Drive về hệ thống.
  - **Huy hiệu trạng thái trực quan**: Đèn báo Live Sync (Xanh: Đã đồng bộ, Vàng: Đang đồng bộ, Đỏ: Chưa kết nối).

---

## 🚀 3. Hướng Dẫn Sử Dụng & Mở Trang

Mở trực tiếp trên bất kỳ trình duyệt nào:
- **Trang Đăng Nhập / Đăng Ký Người Dùng**: Mở file [`index.html`](index.html).
- **Trang Bảng Điều Khiển Quản Trị Viên**: Mở file [`admin.html`](admin.html) hoặc bấm nút **"Quản Trị"** ở góc trên bên phải của trang `index.html`.
  - Mã PIN mặc định để vào bảng quản trị: **`123456`** (hoặc bấm nút *"Dùng mã mặc định"*).

---

## 🛠 4. Cấu Hình Google Client ID Cho Production (Tùy Chọn)

Nếu bạn muốn cấu hình Client ID của riêng bạn trên Google Cloud Console:
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo dự án mới, vào mục **APIs & Services** ➔ Kích hoạt **Google Drive API**.
3. Tại **Credentials**, tạo **OAuth 2.0 Client ID** (Web application).
4. Thêm URL của trang web (ví dụ `http://localhost`, `http://127.0.0.1` hoặc tên miền hosting).
5. Mở `admin.html`, bấm biểu tượng **Cài đặt Google Drive (bánh răng)** và dán Client ID của bạn vào ô cấu hình rồi nhấn Lưu.
