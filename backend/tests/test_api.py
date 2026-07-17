from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

import app as backend_app


def _tiny_jpeg_bytes() -> bytes:
    image = Image.new("RGB", (10, 10), color="red")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


class DummyPredictor:
    loaded = True
    class_names = ["Pho", "Banh mi"]

    def predict(self, image):  # pragma: no cover - these tests avoid real YOLO inference.
        return [], "data:image/jpeg;base64,"


class DummyNutritionLookup:
    loaded = True

    def lookup(self, class_name: str) -> dict[str, object]:
        return {
            "matched": False,
            "food_name_vi": class_name,
            "message": "No calories data for this class.",
        }


class DetectionPredictor:
    loaded = True
    class_names = ["Pho", "Banh mi"]

    def predict(self, image):  # pragma: no cover - these tests avoid real YOLO inference.
        detections = [
            {
                "class_id": 52,
                "class_name": "Pho",
                "confidence": 0.86,
                "bbox": {"x1": 10.0, "y1": 20.0, "x2": 300.0, "y2": 240.0},
            },
            {
                "class_id": 4,
                "class_name": "Banh mi",
                "confidence": 0.4,
                "bbox": {"x1": 5.0, "y1": 5.0, "x2": 50.0, "y2": 50.0},
            },
        ]
        return detections, "data:image/jpeg;base64,FAKE"


class MixedNutritionLookup:
    loaded = True

    def lookup(self, class_name: str) -> dict[str, object]:
        if class_name == "Pho":
            return {
                "matched": True,
                "food_id": "pho_bo",
                "food_name_vi": "Phở bò",
                "calories_per_serving_selected": 410,
                "calories_min_final": 350,
                "calories_max_final": 500,
            }
        return {
            "matched": True,
            "food_id": "banh_mi_thit",
            "food_name_vi": "Bánh mì thịt",
            # Intentionally a numeric string to exercise the string-parsing branch
            # in app.py's total_calories_estimated accumulation.
            "calories_per_serving_selected": "300",
            "calories_min_final": 300,
            "calories_max_final": 500,
        }


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(backend_app, "VietFoodPredictor", lambda *args, **kwargs: DummyPredictor())
    monkeypatch.setattr(backend_app, "NutritionLookup", lambda *args, **kwargs: DummyNutritionLookup())

    with TestClient(backend_app.app) as test_client:
        yield test_client


@pytest.fixture()
def client_with_detections(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(backend_app, "VietFoodPredictor", lambda *args, **kwargs: DetectionPredictor())
    monkeypatch.setattr(backend_app, "NutritionLookup", lambda *args, **kwargs: MixedNutritionLookup())

    with TestClient(backend_app.app) as test_client:
        yield test_client


def test_health_returns_loaded_status(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "model_loaded": True,
        "calories_loaded": True,
        "errors": [],
    }


def test_classes_returns_model_classes(client: TestClient) -> None:
    response = client.get("/classes")

    assert response.status_code == 200
    assert response.json() == {"classes": ["Pho", "Banh mi"]}


def test_predict_rejects_unsupported_file_extension(client: TestClient) -> None:
    response = client.post(
        "/predict",
        files={"file": ("notes.txt", b"not an image", "text/plain")},
    )

    assert response.status_code == 400
    assert "jpg, jpeg, png, jfif" in response.json()["detail"]


def test_predict_rejects_file_larger_than_limit(client: TestClient) -> None:
    oversized_payload = b"x" * (backend_app.MAX_UPLOAD_SIZE_BYTES + 1)

    response = client.post(
        "/predict",
        files={"file": ("large.jpg", oversized_payload, "image/jpeg")},
    )

    assert response.status_code == 413
    assert "10MB" in response.json()["detail"]


def test_predict_merges_nutrition_and_sums_total_calories(client_with_detections: TestClient) -> None:
    response = client_with_detections.post(
        "/predict",
        files={"file": ("pho.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["message"] == "Nhận dạng thành công."
    assert data["annotated_image_base64"] == "data:image/jpeg;base64,FAKE"
    assert len(data["detections"]) == 2

    pho_detection, banh_mi_detection = data["detections"]
    assert pho_detection["class_name"] == "Pho"
    assert pho_detection["nutrition"]["matched"] is True
    assert pho_detection["nutrition"]["food_name_vi"] == "Phở bò"
    assert pho_detection["nutrition"]["calories_per_serving_selected"] == 410

    assert banh_mi_detection["class_name"] == "Banh mi"
    assert banh_mi_detection["nutrition"]["food_name_vi"] == "Bánh mì thịt"
    # calories_per_serving_selected came back as the string "300" from the lookup;
    # the endpoint should still fold it into the numeric total below.
    assert banh_mi_detection["nutrition"]["calories_per_serving_selected"] == "300"

    assert data["total_calories_estimated"] == 710
