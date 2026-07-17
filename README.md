# Dự đoán số calo dựa trên tập dataset VietFood68 bằng hình ảnh thật

## Phạm vi hiện tại

* Người dùng mở app là vào thẳng giao diện nhận dạng.
* Không có màn hình đăng nhập/đăng ký.
* Không có database người dùng.
* Không có token, JWT hoặc session.
* Lịch sử nhận dạng chỉ lưu cục bộ trên trình duyệt bằng `localStorage`.

Luồng chính:

```text
Upload ảnh món ăn
→ Backend YOLO nhận dạng
→ Tra cứu calories mapping
→ Frontend hiển thị calo tham khảo và ảnh annotated
```

## Công nghệ

* Frontend: React, TypeScript, Vite, Node.js.
* Backend: Python, FastAPI, Uvicorn.
* AI/ML: Ultralytics YOLO, model `backend/models/best.pt`.
* Dữ liệu: `data.yaml`, CSV calories, JSON class-calorie mapping.

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

Nếu port `3000` đang bị chiếm, đóng tiến trình cũ hoặc chạy port khác:

```powershell
set PORT=3001&& npm run dev
```

Nếu frontend cần gọi backend qua IP LAN hoặc URL khác, tạo `frontend/.env`:

```text
VITE_BACKEND_PREDICT_URL=http://192.168.x.x:8000/predict
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
* Lịch sử không seed dữ liệu mẫu; chỉ lưu kết quả người dùng thực sự lưu.

## Giới hạn hệ thống

* Kiểm tra hiện tại: model có 68 class YOLO, 67 class có mapping calories numeric. Class `Con nguoi` cố ý không có mapping vì backend báo "không phải món ăn" thay vì tính calories.
* Chi tiết coverage nằm ở `backend/data/missing_calorie_mappings_report.json` (sinh tự động, xem cách sinh lại ở mục "Bộ dữ liệu calo" bên dưới).
* Dataset món ăn Việt Nam chưa phải bộ dữ liệu chuẩn lớn cho mọi món/biến thể.
* Model chỉ nhận dạng tốt trong phạm vi class đã train.
* Kết quả có thể sai nếu ảnh mờ, tối, món ăn bị che khuất hoặc không thuộc class đã train.
* Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn.
* Hệ thống chưa đo được khối lượng thực tế từ ảnh 2D, nên không thể tính calories chính xác tuyệt đối.
* Lịch sử hiện lưu cục bộ trên trình duyệt, chưa đồng bộ theo tài khoản.

## Bộ dữ liệu calo

File `backend/data/dataset_calories_v0_34.csv` gồm các nhóm dòng khác nhau, phân biệt qua cột `dataset_version`:

* **`calories_v0_34_research_ram`** (34 dòng, gồm 18 dòng ánh xạ tới class YOLO hiện tại + 16 dòng dự phòng) — số liệu có đối chiếu nguồn cụ thể, xem cột `source_used`/`note` từng dòng. Độ tin cậy `medium` đến `medium-high`.
* **`calories_v0_35_internal_estimate`** (49 dòng) — ước tính nội bộ dựa trên khẩu phần/100g phổ thông, **không** đối chiếu nguồn trích dẫn cụ thể như nhóm trên. Độ tin cậy `low-medium`. Cột `note` của các dòng này chỉ mô tả đặc điểm món ăn (khẩu phần, cách chế biến), **không lặp lại** disclaimer — disclaimer chung áp dụng cho toàn bộ nhóm `calories_v0_35_internal_estimate` là: *số liệu ước tính, nên kiểm chứng lại với nguồn thật trước khi dùng cho báo cáo chính thức hoặc mục đích y tế/dinh dưỡng.*
* **16 dòng chưa được class YOLO nào tham chiếu** (ví dụ `ga_nuong`, `pho_ga`, `banh_gio`, `trung_vit_lon`...) — giữ nguyên làm dữ liệu dự phòng cho phiên bản model tương lai có nhiều class hơn. Không tự ý tạo mapping cho các dòng này khi chưa có class YOLO tương ứng.

Cách sinh lại `backend/data/missing_calorie_mappings_report.json` (không sửa tay):

```powershell
cd D:\DU-AN\dudoancalories\backend
.\.venv\Scripts\python.exe scripts\generate_missing_calorie_report.py
```

## Hướng phát triển

Trong phiên bản mở rộng, hệ thống có thể bổ sung:

* Database lưu người dùng.
* Đăng ký/đăng nhập thật.
* Hash mật khẩu bằng bcrypt.
* JWT/session.
* Lưu lịch sử nhận dạng theo tài khoản.

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
'@ | .\.venv\Scripts\python.exe -
```

## Kết luận

Dự án phù hợp để báo cáo ở mức web demo nhận dạng món ăn bằng YOLO và ước tính calories tham khảo. Không nên trình bày hệ thống như một công cụ tính calories chính xác tuyệt đối.
