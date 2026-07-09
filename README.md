# VietFood AI Web Demo

## 1. Giới thiệu

**VietFood AI Web Demo** là hệ thống web dùng AI để nhận dạng món ăn Việt Nam từ hình ảnh và dự đoán lượng calo tương ứng. Người dùng đăng nhập/đăng ký, upload ảnh món ăn, hệ thống dùng mô hình YOLO `best.pt` để nhận dạng và trả về thông tin calo.

## 2. Công nghệ sử dụng

* **Frontend:** TypeScript, HTML/CSS, Node.js
* **Backend:** Python, FastAPI, Uvicorn
* **AI/ML:** Ultralytics YOLO, model `best.pt`
* **Xử lý dữ liệu:** Pandas, CSV/JSON/YAML calories mapping
* **Database:** Chưa sử dụng database server

## 3. Chức năng chính

* Đăng ký/đăng nhập demo.
* Chặn người chưa đăng nhập upload ảnh/dự đoán calo.
* Upload ảnh món ăn.
* Nhận dạng món ăn bằng YOLO.
* Tra cứu calories theo món ăn.
* Hiển thị tên món, độ tin cậy, calories, khoảng calories và ảnh annotated.
* Lưu/xem lịch sử dự đoán ở mức demo frontend.

## 4. Luồng hoạt động

```text
Đăng nhập/Đăng ký
→ Upload ảnh món ăn
→ Frontend gửi ảnh đến backend /predict
→ Backend chạy YOLO nhận dạng món ăn
→ Backend tra cứu calories
→ Frontend hiển thị kết quả
```

## 5. Cấu trúc thư mục chính

```text
dudoancalories/
├── backend/
│   ├── app.py
│   ├── best.pt
│   ├── run_backend.bat
│   └── tests/
│
├── frontend/
│   ├── src/App.tsx
│   ├── server.ts
│   └── package.json
│
├── test_images/
└── README.md
```

## 6. Cách chạy dự án

### Chạy backend

```powershell
cd D:\DU-AN\dudoancalories\backend
.\run_backend.bat
```

Hoặc:

```powershell
cd D:\DU-AN\dudoancalories\backend
.\.venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Backend chạy tại:

```text
http://127.0.0.1:8000
```

### Chạy frontend

```powershell
cd D:\DU-AN\dudoancalories\frontend
npm run dev
```

Frontend chạy tại:

```text
http://127.0.0.1:3000
```

## 7. API chính

### Kiểm tra backend

```http
GET /health
```

### Dự đoán món ăn

```http
POST /predict
```

Request:

```text
Content-Type: multipart/form-data
Field ảnh: file
```

Response gồm:

* Tên món ăn
* Độ tin cậy
* Calories
* Khoảng calories
* Ảnh annotated
* Danh sách món được phát hiện

## 8. Kiểm thử

### Test backend

```powershell
cd D:\DU-AN\dudoancalories\backend
.\.venv\Scripts\python.exe -m pytest -q
```

### Test frontend

```powershell
cd D:\DU-AN\dudoancalories\frontend
npm run build
```

## 9. Trạng thái hiện tại

* Backend FastAPI chạy được.
* Model YOLO `best.pt` load thành công.
* Endpoint `/predict` nhận ảnh và trả kết quả.
* Frontend đã gọi đúng backend `/predict`.
* Không còn dùng Gemini/mock trong luồng nhận diện chính.
* Người chưa đăng nhập bị chặn upload/dự đoán.
* Trang đăng nhập/đăng ký đã ẩn menu “Nhận diện”, “Lịch sử”, “Cài đặt”.

## 10. Giới hạn hiện tại

* Auth mới ở mức demo frontend.
* Backend `/predict` chưa có bảo mật token/session.
* Chưa có database lưu người dùng và lịch sử thật.
* Calories chỉ là giá trị ước tính.
* Chưa triển khai public server hoặc app mobile thật.

## 11. Hướng phát triển

* Thêm đăng nhập/đăng ký thật ở backend.
* Lưu lịch sử dự đoán vào database.
* Bảo vệ API bằng token/session.
* Tối ưu giao diện mobile.
* Phát triển thành PWA hoặc app Android.
* Huấn luyện thêm dữ liệu món ăn Việt Nam.

## 12. Kết luận

**VietFood AI Web Demo** là hệ thống demo nhận dạng món ăn Việt Nam bằng YOLO và ước tính calories từ hình ảnh. Dự án đã có luồng frontend-backend hoạt động, phù hợp để trình bày đồ án và tiếp tục mở rộng thành ứng dụng quản lý dinh dưỡng hoàn chỉnh hơn.
