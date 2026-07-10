# VietFood AI Frontend

Frontend demo cho dự án VietFood AI. Ứng dụng dùng React/TypeScript, chạy qua Vite middleware trong `server.ts` và gọi backend FastAPI tại `http://127.0.0.1:8000/predict`.

## Chạy local

```powershell
cd D:\DU-AN\dudoancalories\frontend
npm install
npm run dev
```

Mở:

```text
http://127.0.0.1:3000
```

## Phạm vi hiện tại

* Không có màn hình đăng nhập/đăng ký.
* Không có database, token, JWT hoặc session.
* Lịch sử nhận dạng chỉ lưu cục bộ trên trình duyệt bằng `localStorage`.
* Frontend gửi ảnh bằng `FormData` với field `file`.
* Frontend không tự set `Content-Type`.
* Frontend không gọi Gemini và không còn endpoint `/api/recognize`.
* Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn.

Nếu cần gọi backend qua IP LAN hoặc port khác, tạo `.env` trong thư mục `frontend`:

```text
VITE_BACKEND_PREDICT_URL=http://192.168.x.x:8000/predict
```
