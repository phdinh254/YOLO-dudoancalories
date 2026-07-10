# Dự đoán số calo dựa trên tập dataset VietFood68 bằng hình ảnh thật

## Công nghệ

* Frontend: React, TypeScript, Vite, Node.js.
* Backend: Python, FastAPI, Uvicorn.
* AI/ML: Ultralytics YOLO, model `backend/models/best.pt`.
* Dữ liệu: `data.yaml`, CSV calories, JSON class-calorie mapping.
* Auth: demo frontend bằng `localStorage`, chưa có database/server session.

## Chạy backend

```powershell
cd D:\DU-AN\dudoancalories\backend
.\.venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Backend chạy tại:

```text
http://127.0.0.1:8000
```

## Chạy frontend

```powershell
cd D:\DU-AN\dudoancalories\frontend
npm install
npm run dev
```

Mở:

```text
http://127.0.0.1:3000
```

Nếu port `3000` đang bị chiếm, đóng tiến trình cũ hoặc chạy PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ }
```

## Endpoint chính

### `GET /health`

Trả trạng thái backend, model YOLO và dữ liệu calories.

### `GET /classes`

Trả danh sách class mà model đang biết.

### `POST /predict`

Request:

```text
Content-Type: multipart/form-data
Field ảnh: file
```

Response mẫu:

```json
{
  "success": true,
  "filename": "test_pho.jfif",
  "message": "Nhận dạng thành công.",
  "detections": [
    {
      "class_id": 52,
      "class_name": "Pho",
      "confidence": 0.86,
      "bbox": { "x1": 10, "y1": 20, "x2": 300, "y2": 240 },
      "nutrition": {
        "matched": true,
        "food_name_vi": "Phở bò",
        "calories_per_serving_selected": 410,
        "calories_min_final": 350,
        "calories_max_final": 500
      }
    }
  ],
  "total_calories_estimated": 410,
  "calorie_estimation_note": "Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn; hệ thống chưa đo được khối lượng thực tế từ ảnh 2D.",
  "annotated_image_base64": "data:image/jpeg;base64,..."
}
```

## Cơ chế giảm rủi ro đã áp dụng

* Frontend chỉ gọi backend thật `/predict`, gửi `FormData` field `file`.
* Không dùng Gemini, không dùng `simulateAnalysis()`, không hard-code kết quả nhận dạng.
* Hiển thị confidence theo phần trăm.
* Cảnh báo khi confidence thấp hơn `0.5`.
* Hiển thị nhiều detection nếu ảnh có nhiều món.
* Hiển thị tổng calories chỉ là tổng tham khảo.
* Báo rõ “Chưa có dữ liệu calories cho món này.” khi mapping thiếu.
* Báo rõ khi không nhận dạng được món ăn và gợi ý dùng ảnh rõ/đủ sáng.
* Người chưa đăng nhập không thấy menu chức năng chính và không upload/nhận dạng được.
* Lịch sử không còn seed dữ liệu mẫu; chỉ lưu kết quả người dùng thực sự lưu.

## Giới hạn hệ thống

* Kiểm tra hiện tại: model có 68 class YOLO, 18 class có mapping calories numeric, 50 class còn thiếu mapping calories tin cậy.
* Danh sách thiếu mapping nằm ở `backend/data/missing_calorie_mappings_report.json`.
* Dataset món ăn Việt Nam chưa phải bộ dữ liệu chuẩn lớn cho mọi món/biến thể.
* Model chỉ nhận dạng tốt trong phạm vi class đã train.
* Kết quả có thể sai nếu ảnh mờ, tối, món ăn bị che khuất hoặc không thuộc class đã train.
* Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn.
* Hệ thống chưa đo được khối lượng thực tế từ ảnh 2D, nên không thể tính calories chính xác tuyệt đối.
* Auth hiện tại là demo frontend bằng `localStorage`, chưa có bảo mật token/session ở backend.
* Lịch sử hiện lưu ở trình duyệt, chưa đồng bộ theo database người dùng thật.

## Kiểm thử

Backend:

```powershell
cd D:\DU-AN\dudoancalories\backend
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend:

```powershell
cd D:\DU-AN\dudoancalories\frontend
npm run build
```

Smoke test API:

```powershell
cd D:\DU-AN\dudoancalories\backend
@'
from pathlib import Path
from fastapi.testclient import TestClient
from app import app

with TestClient(app) as client:
    image_path = Path("../test_images/test_pho.jfif")
    with image_path.open("rb") as f:
        response = client.post("/predict", files={"file": (image_path.name, f, "image/jpeg")})
    print(response.status_code)
    print(response.json()["message"])
'@ | .\backend\.venv\Scripts\python.exe -
```

## Kết luận

Dự án phù hợp để báo cáo ở mức web demo nhận dạng món ăn bằng YOLO và ước tính calories tham khảo. Không nên trình bày hệ thống như một công cụ tính calories chính xác tuyệt đối.
