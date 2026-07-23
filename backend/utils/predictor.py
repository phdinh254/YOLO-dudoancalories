from __future__ import annotations

import base64
import io
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont
import yaml


class VietFoodPredictor:
    def __init__(self, model_path: Path, data_yaml_path: Path, conf_threshold: float = 0.25) -> None:
        self.model_path = model_path
        self.data_yaml_path = data_yaml_path
        self.conf_threshold = conf_threshold
        self.model = self._load_model()
        self.class_names = self._load_class_names()

    @property
    def loaded(self) -> bool:
        return self.model is not None

    def predict(self, image: Image.Image) -> tuple[list[dict[str, Any]], str]:
        # agnostic_nms=True suppresses overlapping boxes across *different*
        # classes too, not just within the same class. Without it, two visually
        # similar classes (e.g. "Phở bò" vs "Bún bò") can both pass threshold
        # for the same physical bowl, double-counting its calories downstream.
        results = self.model.predict(
            source=image, conf=self.conf_threshold, agnostic_nms=True, verbose=False
        )
        result = results[0]
        detections: list[dict[str, Any]] = []

        if result.boxes is not None:
            for box in result.boxes:
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                xyxy = [float(value) for value in box.xyxy[0].tolist()]
                detections.append(
                    {
                        "class_id": class_id,
                        "class_name": self._class_name(class_id),
                        "confidence": round(confidence, 4),
                        "bbox": {
                            "x1": round(xyxy[0], 2),
                            "y1": round(xyxy[1], 2),
                            "x2": round(xyxy[2], 2),
                            "y2": round(xyxy[3], 2),
                        },
                    }
                )

        detections.sort(key=lambda item: item["confidence"], reverse=True)
        annotated = self._annotate_image(image, detections)
        return detections, annotated

    def _load_model(self) -> Any:
        if not self.model_path.exists():
            raise FileNotFoundError(f"Không tìm thấy model: {self.model_path}")

        try:
            from ultralytics import YOLO
        except ImportError as exc:
            raise RuntimeError("Chưa cài ultralytics. Hãy chạy: pip install -r requirements.txt") from exc

        return YOLO(str(self.model_path))

    def _load_class_names(self) -> list[str]:
        names_from_model = getattr(self.model, "names", None)
        if isinstance(names_from_model, dict):
            return [str(names_from_model[index]) for index in sorted(names_from_model)]
        if isinstance(names_from_model, list) and names_from_model:
            return [str(name) for name in names_from_model]

        with self.data_yaml_path.open("r", encoding="utf-8") as file:
            data = yaml.safe_load(file) or {}
        return [str(name) for name in data.get("names", [])]

    def _class_name(self, class_id: int) -> str:
        if 0 <= class_id < len(self.class_names):
            return self.class_names[class_id]
        return f"Class {class_id}"

    def _annotate_image(self, image: Image.Image, detections: list[dict[str, Any]]) -> str:
        canvas = image.copy().convert("RGB")
        draw = ImageDraw.Draw(canvas)
        font = ImageFont.load_default()

        for detection in detections:
            bbox = detection["bbox"]
            label = f"{detection['class_name']} {detection['confidence'] * 100:.1f}%"
            x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
            color = "#006D5B" if detection["class_name"] != "Con nguoi" else "#BA1A1A"

            draw.rectangle((x1, y1, x2, y2), outline=color, width=4)
            text_bbox = draw.textbbox((x1, y1), label, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
            label_top = max(0, y1 - text_height - 10)
            draw.rounded_rectangle(
                (x1, label_top, x1 + text_width + 12, label_top + text_height + 8),
                radius=6,
                fill=color,
            )
            draw.text((x1 + 6, label_top + 4), label, fill="white", font=font)

        buffer = io.BytesIO()
        canvas.save(buffer, format="JPEG", quality=90)
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/jpeg;base64,{encoded}"
