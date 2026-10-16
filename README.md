# NovaAuth - Trang Đăng Nhập & Đăng Ký Tài Khoản Cao Cấp

Trang xác thực tài khoản hiện đại, giao diện đồ họa chuẩn Glassmorphism, hỗ trợ đăng ký/đăng nhập bằng Email/Mật khẩu hoặc Đăng nhập nhanh một chạm qua Google.

## ✨ Tính năng nổi bật

1. **Đăng nhập & Đăng ký linh hoạt (Dual Mode)**:
   - Chuyển đổi mượt mà giữa 2 chế độ: **Đăng nhập** và **Đăng ký** bằng hiệu ứng segmented tab trượt.
   - Ghi nhớ trạng thái phiên đăng nhập (*Remember me*) lưu trữ cục bộ an toàn.

2. **Tích hợp Đăng nhập bằng Google**:
   - Nút đăng nhập Google chuẩn thương hiệu chính thức (Official Google Branding Guidelines).
   - Mô phỏng hộp thoại chọn tài khoản Google One-Tap / OAuth 2.0 trực quan với nhiều tài khoản demo hoặc nhập Gmail tùy chọn.
   - Hướng dẫn tích hợp Google Identity Services (Client ID thật) khi đưa vào sản xuất.

3. **Thanh đo độ mạnh mật khẩu thông minh (Password Strength Meter)**:
   - Kiểm tra thời gian thực (Real-time) theo 4 tiêu chí: Độ dài tối thiểu 8 ký tự, Chữ hoa & chữ thường, Chữ số (0-9), Ký tự đặc biệt (!@#$...).
   - Hiển thị mức độ: *Rất yếu*, *Yếu*, *Trung bình*, *Rất mạnh* với thanh màu động và checklist trực quan.

4. **Trải nghiệm thị giác cao cấp**:
   - Hiệu ứng ánh sáng nền đa tầng (*Ambient Glowing Gradient Orbs*).
   - Thiết kế Glassmorphism trong suốt mờ với chiều sâu bóng đổ 3D.
   - Nút chuyển đổi giao diện **Chế độ Tối (Dark Mode)** và **Chế độ Sáng (Light Mode)** lưu tùy chọn người dùng.
   - Nút ẩn/hiện mật khẩu tiện lợi (Eye / Eye-off icon).
   - Hệ thống thông báo nổi (Toast Notifications) thông minh khi đăng nhập, đăng ký, khôi phục mật khẩu hoặc đổi theme.

5. **Khôi phục mật khẩu & Điều khoản**:
   - Hộp thoại quên mật khẩu mô phỏng gửi link xác nhận đến hòm thư.
   - Modal hiển thị Điều khoản dịch vụ và Chính sách bảo mật người dùng.

---

## 🚀 Cách mở và sử dụng

Bạn chỉ cần mở trực tiếp file `index.html` trong bất kỳ trình duyệt web nào (Chrome, Edge, Firefox, Cốc Cốc, Safari...):

- **Cách 1**: Kéo thả file `index.html` vào cửa sổ trình duyệt.
- **Cách 2**: Nhấp đúp chuột vào file `index.html` trong thư mục `C:\tinhoc1`.
- **Cách 3**: Chạy qua Live Server trên VS Code hoặc Antigravity IDE.

---

## 🛠 Hướng dẫn gắn Google Client ID thật (Production OAuth 2.0)

Nếu bạn muốn liên kết hệ thống backend thật của bạn với Google Cloud Console:
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo dự án mới và tạo **OAuth 2.0 Client ID** (Web application).
3. Thêm thư viện Google Identity Services vào thẻ `<head>` trong `index.html`:
   ```html
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   ```
4. Khởi tạo và xử lý token trả về trong `app.js`:
   ```javascript
   google.accounts.id.initialize({
       client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
       callback: handleCredentialResponse
   });
   ```
