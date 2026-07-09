from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app as backend_app


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


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(backend_app, "VietFoodPredictor", lambda *args, **kwargs: DummyPredictor())
    monkeypatch.setattr(backend_app, "NutritionLookup", lambda *args, **kwargs: DummyNutritionLookup())

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
