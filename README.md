# VietFood AI

Web demo nhận diện món ăn Việt Nam từ ảnh và ước tính calo tham khảo, dùng YOLO (Ultralytics) cho nhận diện và một bộ dữ liệu calo tra cứu theo món.

```text
Upload ảnh → Backend YOLO nhận diện → Tra cứu calo → Hiển thị kết quả + ảnh đã khoanh vùng
```

## Tính năng chính

* Nhận diện món ăn Việt qua ảnh (kể cả ảnh nhiều món), hiển thị độ tin cậy và calo tham khảo theo từng món phát hiện được.
* Tổng calo được tính đúng theo danh sách món đang hiển thị: món có độ tin cậy thấp vẫn hiện kèm cảnh báo nhưng không bị cộng vào tổng; tên món và số calo hiển thị luôn khớp cùng một dữ liệu.
* Tự phân biệt "không nhận diện được" và "nhận diện được nhưng không phải món ăn" — không hiển thị kết quả giả.
* Lịch sử nhận diện lưu cục bộ trên trình duyệt (`localStorage`), có giới hạn dung lượng và xử lý lỗi khi quota đầy.
* Không có tài khoản/đăng nhập — đây là bản demo, không có database người dùng.

## Công nghệ

| | |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Uvicorn |
| AI/ML | Ultralytics YOLO (`backend/models/best.pt`, 68 class) |
| Dữ liệu | CSV calo + JSON mapping class → món ăn |

## Chạy dự án

**Backend** (`http://127.0.0.1:8000`):

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

**Frontend** (`http://127.0.0.1:3000`):

```powershell
cd frontend
npm install
npm run dev
```

Nếu frontend cần gọi backend qua địa chỉ khác, tạo `frontend/.env`:

```text
VITE_BACKEND_PREDICT_URL=http://192.168.x.x:8000/predict
```

Nếu deploy frontend ở domain khác localhost, set biến môi trường backend `ALLOWED_ORIGINS` (danh sách origin cách nhau bởi dấu phẩy) trước khi chạy uvicorn, ví dụ:

```powershell
$env:ALLOWED_ORIGINS = "https://app.example.com,https://staging.example.com"
```

Không set thì backend chỉ chấp nhận các port dev mặc định (3000/3001/5173 trên localhost).

## Kiểm thử

```powershell
# Backend
cd backend && .\.venv\Scripts\python.exe -m pytest -q

# Frontend
cd frontend && npm run test && npm run build
```

## Giới hạn cần biết

* Calo chỉ là **ước tính tham khảo** theo khẩu phần chuẩn, không đo khối lượng thực tế từ ảnh 2D — không thay thế tư vấn dinh dưỡng chuyên môn.
* Model chỉ nhận diện tốt trong phạm vi 68 class đã train; phần lớn số liệu calo là ước tính nội bộ, chưa đối chiếu đầy đủ nguồn (chi tiết ở `backend/data/`).
* Không có xác thực người dùng, không giới hạn tần suất gọi API; phù hợp làm demo, chưa sẵn sàng triển khai sản xuất.

## Hướng phát triển

Đăng ký/đăng nhập thật, database lưu lịch sử theo tài khoản, rate limiting cho `/predict`, đối chiếu lại nguồn số liệu calo còn thiếu.
