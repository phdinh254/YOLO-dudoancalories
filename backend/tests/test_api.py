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
                "confidence": 0.55,
                "bbox": {"x1": 5.0, "y1": 5.0, "x2": 50.0, "y2": 50.0},
            },
        ]
        return detections, "data:image/jpeg;base64,FAKE"


class LowConfidenceDetectionPredictor:
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
                # Below CONFIDENCE_SUM_THRESHOLD: a shaky guess that happens to
                # match a food class shouldn't be allowed to inflate the total.
                "confidence": 0.4,
                "bbox": {"x1": 5.0, "y1": 5.0, "x2": 50.0, "y2": 50.0},
            },
        ]
        return detections, "data:image/jpeg;base64,FAKE"


class DuplicateDishPredictor:
    """Two distinct physical bowls of the same dish (e.g. two servings of Pho
    on the table), as separate boxes. Each must be counted on its own -
    duplicates by class_name are not the same thing as duplicate boxes for
    the same object (that's agnostic_nms's job, tested separately)."""

    loaded = True
    class_names = ["Pho", "Banh mi"]

    def predict(self, image):  # pragma: no cover - these tests avoid real YOLO inference.
        detections = [
            {
                "class_id": 52,
                "class_name": "Pho",
                "confidence": 0.9,
                "bbox": {"x1": 10.0, "y1": 20.0, "x2": 300.0, "y2": 240.0},
            },
            {
                "class_id": 52,
                "class_name": "Pho",
                "confidence": 0.7,
                "bbox": {"x1": 320.0, "y1": 20.0, "x2": 600.0, "y2": 240.0},
            },
        ]
        return detections, "data:image/jpeg;base64,FAKE"


class UnmappedDishPredictor:
    loaded = True
    class_names = ["Pho", "Mystery Dish"]

    def predict(self, image):  # pragma: no cover - these tests avoid real YOLO inference.
        detections = [
            {
                "class_id": 52,
                "class_name": "Pho",
                "confidence": 0.9,
                "bbox": {"x1": 10.0, "y1": 20.0, "x2": 300.0, "y2": 240.0},
            },
            {
                "class_id": 99,
                "class_name": "Mystery Dish",
                "confidence": 0.9,
                "bbox": {"x1": 320.0, "y1": 20.0, "x2": 600.0, "y2": 240.0},
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


class PartiallyMappedNutritionLookup:
    """Mirrors real NutritionLookup.lookup: only classes with a mapping resolve;
    everything else comes back unmatched with no numeric calorie fields at all."""

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
            "matched": False,
            "food_id": None,
            "food_name_vi": class_name,
            "message": "Chưa có dữ liệu calories cho món này.",
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


@pytest.fixture()
def client_with_low_confidence_detection(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(backend_app, "VietFoodPredictor", lambda *args, **kwargs: LowConfidenceDetectionPredictor())
    monkeypatch.setattr(backend_app, "NutritionLookup", lambda *args, **kwargs: MixedNutritionLookup())

    with TestClient(backend_app.app) as test_client:
        yield test_client


@pytest.fixture()
def client_with_duplicate_dish(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(backend_app, "VietFoodPredictor", lambda *args, **kwargs: DuplicateDishPredictor())
    monkeypatch.setattr(backend_app, "NutritionLookup", lambda *args, **kwargs: MixedNutritionLookup())

    with TestClient(backend_app.app) as test_client:
        yield test_client


@pytest.fixture()
def client_with_unmapped_dish(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(backend_app, "VietFoodPredictor", lambda *args, **kwargs: UnmappedDishPredictor())
    monkeypatch.setattr(backend_app, "NutritionLookup", lambda *args, **kwargs: PartiallyMappedNutritionLookup())

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


def test_predict_rejects_corrupt_image_with_400_not_500(client: TestClient) -> None:
    # A truncated file passes the extension/size checks but fails to decode.
    # This used to escape as an unhandled 500 because the except clause only
    # caught UnidentifiedImageError, not the OSError a truncated JPEG raises.
    valid = _tiny_jpeg_bytes()
    truncated = valid[: len(valid) // 2]

    response = client.post(
        "/predict",
        files={"file": ("broken.jpg", truncated, "image/jpeg")},
    )

    assert response.status_code == 400
    assert "Không đọc được file ảnh" in response.json()["detail"]


def test_predict_rejects_decompression_bomb_with_400_not_500(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Lower Pillow's pixel-count guard so a small, cheap image trips the same
    # DecompressionBombError a genuinely huge image would, without allocating
    # one in the test. This used to escape as an unhandled 500. Pillow only
    # raises (rather than just warning) once the image exceeds *twice* the
    # configured limit, hence dividing by 4 here for the 10x10 fixture image.
    monkeypatch.setattr(Image, "MAX_IMAGE_PIXELS", (10 * 10) // 4)

    response = client.post(
        "/predict",
        files={"file": ("bomb.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
    )

    assert response.status_code == 400
    assert "quá lớn" in response.json()["detail"]


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
    # Unified per-detection fields: dish_name/calories/calorie_range/counted_in_total
    # must agree with the underlying nutrition data on the very same detection.
    assert pho_detection["dish_name"] == "Phở bò"
    assert pho_detection["calories"] == 410
    assert pho_detection["calorie_range"] == "350 - 500 KCAL"
    assert pho_detection["counted_in_total"] is True

    assert banh_mi_detection["class_name"] == "Banh mi"
    assert banh_mi_detection["nutrition"]["food_name_vi"] == "Bánh mì thịt"
    # calories_per_serving_selected came back as the string "300" from the lookup;
    # the endpoint should still fold it into the numeric total below.
    assert banh_mi_detection["nutrition"]["calories_per_serving_selected"] == "300"
    assert banh_mi_detection["dish_name"] == "Bánh mì thịt"
    assert banh_mi_detection["calories"] == 300
    assert banh_mi_detection["calorie_range"] == "300 - 500 KCAL"
    assert banh_mi_detection["counted_in_total"] is True

    # The headline total must equal the sum of exactly the detections that are
    # both shown AND flagged as counted - never a different dataset/order.
    counted = [d for d in data["detections"] if d["counted_in_total"]]
    assert sum(d["calories"] for d in counted) == data["total_calories_estimated"] == 710


def test_predict_excludes_low_confidence_detections_from_total(
    client_with_low_confidence_detection: TestClient,
) -> None:
    response = client_with_low_confidence_detection.post(
        "/predict",
        files={"file": ("pho.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()

    pho_detection, banh_mi_detection = data["detections"]
    assert pho_detection["confidence"] == 0.86
    assert banh_mi_detection["confidence"] == 0.4

    # Banh mi's nutrition still resolves and shows up per-detection, with a
    # real dish_name/calories/calorie_range - the UI can still display it and
    # warn about low confidence...
    assert banh_mi_detection["nutrition"]["matched"] is True
    assert banh_mi_detection["nutrition"]["calories_per_serving_selected"] == "300"
    assert banh_mi_detection["dish_name"] == "Bánh mì thịt"
    assert banh_mi_detection["calories"] == 300
    assert banh_mi_detection["calorie_range"] == "300 - 500 KCAL"
    # ...but counted_in_total is what actually gates the sum below, at 0.4
    # confidence (below CONFIDENCE_SUM_THRESHOLD) it must be False.
    assert banh_mi_detection["counted_in_total"] is False
    assert pho_detection["counted_in_total"] is True

    # ...but at 0.4 confidence (below CONFIDENCE_SUM_THRESHOLD) it must not
    # inflate the headline total. Only Pho's 410 counts.
    assert data["total_calories_estimated"] == 410


def test_predict_counts_each_detection_of_the_same_dish_separately(
    client_with_duplicate_dish: TestClient,
) -> None:
    # Two distinct bowls of the same dish must each contribute their own
    # calories - they are not the same object, so they must not be merged or
    # deduplicated by class_name.
    response = client_with_duplicate_dish.post(
        "/predict",
        files={"file": ("two_bowls.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()

    assert len(data["detections"]) == 2
    first, second = data["detections"]
    assert first["class_name"] == second["class_name"] == "Pho"
    assert first["dish_name"] == second["dish_name"] == "Phở bò"
    assert first["calories"] == second["calories"] == 410
    assert first["counted_in_total"] is True
    assert second["counted_in_total"] is True

    assert data["total_calories_estimated"] == 820


def test_predict_dish_without_calorie_mapping_is_excluded_from_total(
    client_with_unmapped_dish: TestClient,
) -> None:
    response = client_with_unmapped_dish.post(
        "/predict",
        files={"file": ("mystery.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()

    pho_detection, mystery_detection = data["detections"]
    assert pho_detection["class_name"] == "Pho"
    assert pho_detection["counted_in_total"] is True
    assert pho_detection["calories"] == 410

    assert mystery_detection["class_name"] == "Mystery Dish"
    assert mystery_detection["nutrition"]["matched"] is False
    # No mapping -> dish_name falls back to the raw class_name, and calories/
    # calorie_range/counted_in_total all reflect "no data", not zero.
    assert mystery_detection["dish_name"] == "Mystery Dish"
    assert mystery_detection["calories"] is None
    assert mystery_detection["calorie_range"] is None
    assert mystery_detection["counted_in_total"] is False

    # Only the mapped, matched detection contributes to the total.
    assert data["total_calories_estimated"] == 410


def test_predict_detection_order_and_total_stay_consistent(
    client_with_detections: TestClient,
) -> None:
    # The detections list is already sorted by confidence descending
    # (predictor.py), and the total must be derivable purely by summing the
    # `calories` field of the detections flagged `counted_in_total` in that
    # same list - no separate/duplicate aggregation path.
    response = client_with_detections.post(
        "/predict",
        files={"file": ("pho.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()

    confidences = [d["confidence"] for d in data["detections"]]
    assert confidences == sorted(confidences, reverse=True)

    recomputed_total = sum(d["calories"] for d in data["detections"] if d["counted_in_total"])
    assert recomputed_total == data["total_calories_estimated"]
