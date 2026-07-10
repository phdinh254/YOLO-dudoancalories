# VietFood AI Frontend

Frontend demo cho dự án VietFood AI. Ứng dụng dùng React/TypeScript, chạy qua Vite middleware trong `server.ts` và gọi backend FastAPI thật tại `http://127.0.0.1:8000/predict`.

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

## Lưu ý tích hợp

* Frontend gửi ảnh bằng `FormData` với field `file`.
* Frontend không tự set `Content-Type`.
* Frontend không gọi Gemini và không còn endpoint `/api/recognize`.
* Auth hiện tại là demo frontend bằng `localStorage`.
* Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn.
