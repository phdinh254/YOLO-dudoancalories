from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field
import yaml

from utils.nutrition import NutritionLookup
from utils.predictor import VietFoodPredictor


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "best.pt"
DATA_DIR = BASE_DIR / "data"
DATA_YAML_PATH = DATA_DIR / "data.yaml"
CALORIES_CSV_PATH = DATA_DIR / "dataset_calories_v0_34.csv"
MAPPING_PATH = DATA_DIR / "class_calorie_mapping.json"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".jfif", ".webp"}
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
CALORIE_ESTIMATION_NOTE = (
    "Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn; "
    "hệ thống chưa đo được khối lượng thực tế từ ảnh 2D."
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("vietfood.backend")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    calories_loaded: bool
    errors: list[str] = Field(default_factory=list)


class ClassesResponse(BaseModel):
    classes: list[str]


class BoundingBoxResponse(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DetectionResponse(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBoxResponse
    nutrition: dict[str, Any] | None = None


class PredictResponse(BaseModel):
    success: bool
    filename: str
    message: str
    detections: list[DetectionResponse]
    total_calories_estimated: float
    calorie_estimation_note: str
    annotated_image_base64: str

app = FastAPI(title="VietFood AI Demo", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3001",
        "http://localhost:3001",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor: VietFoodPredictor | None = None
nutrition_lookup: NutritionLookup | None = None
startup_errors: list[str] = []


@app.on_event("startup")
def startup() -> None:
    global predictor, nutrition_lookup

    logger.info("Starting VietFood AI backend")
    startup_errors.clear()
    try:
        predictor = VietFoodPredictor(MODEL_PATH, DATA_YAML_PATH)
        logger.info("YOLO model loaded from %s", MODEL_PATH)
    except Exception as exc:  # noqa: BLE001 - expose startup issue through /health.
        predictor = None
        logger.exception("Failed to load YOLO model")
        startup_errors.append(f"Model error: {exc}")

    try:
        nutrition_lookup = NutritionLookup(CALORIES_CSV_PATH, MAPPING_PATH)
        logger.info("Nutrition data loaded from %s and %s", CALORIES_CSV_PATH, MAPPING_PATH)
    except Exception as exc:  # noqa: BLE001
        nutrition_lookup = None
        logger.exception("Failed to load nutrition data")
        startup_errors.append(f"Calories error: {exc}")


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "VietFood AI backend đang chạy. Xem /docs để thử API.",
    }


@app.get("/health", response_model=HealthResponse)
def health() -> dict[str, Any]:
    return {
        "status": "ok" if predictor and nutrition_lookup else "error",
        "model_loaded": bool(predictor and predictor.loaded),
        "calories_loaded": bool(nutrition_lookup and nutrition_lookup.loaded),
        "errors": startup_errors,
    }


@app.get("/classes", response_model=ClassesResponse)
def classes() -> dict[str, Any]:
    if predictor:
        return {"classes": predictor.class_names}

    return {"classes": _read_classes_from_yaml()}


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model YOLO chưa load được. Kiểm tra /health.")

    filename = file.filename or "uploaded_image"
    logger.info("[predict] Received file: %s", filename)
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Định dạng ảnh không hỗ trợ. Hãy dùng jpg, jpeg, png, jfif hoặc webp.",
        )

    content = await file.read()
    logger.info("[predict] Uploaded size: %s bytes", len(content))
    if not content:
        raise HTTPException(status_code=400, detail="File ảnh rỗng.")
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File ảnh vượt quá giới hạn 10MB.")

    try:
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except Image.DecompressionBombError as exc:
        logger.warning("[predict] Rejected oversized image %s: %s", filename, exc)
        raise HTTPException(
            status_code=400,
            detail="Ảnh có kích thước sau giải nén quá lớn. Vui lòng dùng ảnh khác.",
        ) from exc
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Không đọc được file ảnh.") from exc
    except Exception as exc:  # noqa: BLE001 - any other decode failure (truncated/corrupt file) is a bad upload, not a server error.
        logger.warning("[predict] Failed to decode uploaded image %s: %s", filename, exc)
        raise HTTPException(status_code=400, detail="Không đọc được file ảnh. File có thể bị lỗi hoặc không đầy đủ.") from exc

    try:
        detections, annotated_image_base64 = predictor.predict(image)
    except Exception as exc:  # noqa: BLE001 - keep API friendly while logging details server-side.
        logger.exception("Prediction failed for uploaded file %s", filename)
        raise HTTPException(status_code=500, detail="Backend gặp lỗi khi nhận dạng ảnh.") from exc

    logger.info("[predict] Detections: %s", len(detections))
    for detection in detections:
        class_name = detection["class_name"]
        if nutrition_lookup is None:
            detection["nutrition"] = _missing_nutrition(
                class_name,
                "CSV calories chưa load được. Backend vẫn trả detection nhưng chưa có dữ liệu calories.",
            )
            continue

        try:
            detection["nutrition"] = nutrition_lookup.lookup(class_name)
        except Exception as exc:  # noqa: BLE001 - keep recognition response stable if mapping has bad data.
            logger.exception("Nutrition lookup failed for class %s", class_name)
            detection["nutrition"] = _missing_nutrition(
                class_name,
                f"Lỗi tra cứu calories: {exc}",
            )

    total_calories_estimated = 0.0
    for detection in detections:
        nutrition = detection.get("nutrition") or {}
        value = nutrition.get("calories_per_serving_selected")
        if isinstance(value, (int, float)):
            total_calories_estimated += float(value)
            continue
        if isinstance(value, str):
            try:
                total_calories_estimated += float(value)
            except ValueError:
                continue

    message = (
        "Không nhận dạng được món ăn. Vui lòng thử ảnh rõ hơn, đủ sáng và món ăn nằm trong khung hình."
        if not detections
        else "Nhận dạng thành công."
    )

    return {
        "success": True,
        "filename": filename,
        "message": message,
        "detections": detections,
        "total_calories_estimated": total_calories_estimated,
        "calorie_estimation_note": CALORIE_ESTIMATION_NOTE,
        "annotated_image_base64": annotated_image_base64,
    }


def _missing_nutrition(class_name: str, message: str) -> dict[str, Any]:
    return {
        "matched": False,
        "food_id": None,
        "food_name_vi": class_name,
        "message": message,
    }


def _read_classes_from_yaml() -> list[str]:
    if not DATA_YAML_PATH.exists():
        return []
    with DATA_YAML_PATH.open("r", encoding="utf-8") as file:
        data = yaml.safe_load(file) or {}
    return [str(name) for name in data.get("names", [])]
