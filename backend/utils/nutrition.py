from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


MISSING_TEXT = "Chưa có dữ liệu"
DISPLAY_COLUMNS = [
    "food_id",
    "food_name_vi",
    "serving_size",
    "serving_weight_g",
    "calories_per_serving_selected",
    "calories_per_100g",
    "calories_min_final",
    "calories_max_final",
    "confidence",
    "source_used",
    "note",
]
NUMERIC_COLUMNS = {
    "serving_weight_g",
    "calories_per_serving_selected",
    "calories_per_100g",
    "calories_min_final",
    "calories_max_final",
}


def _is_missing(value: Any) -> bool:
    if value is None:
        return True
    text = str(value).strip()
    return text == "" or text.lower() in {"missing", "nan", "null", "none"}


def _clean_value(column: str, value: Any) -> Any:
    if _is_missing(value):
        return MISSING_TEXT

    if column in NUMERIC_COLUMNS:
        try:
            number = float(str(value).strip())
        except ValueError:
            return str(value).strip()
        if number.is_integer():
            return int(number)
        return number

    return str(value).strip()


class NutritionLookup:
    def __init__(self, csv_path: Path, mapping_path: Path) -> None:
        self.csv_path = csv_path
        self.mapping_path = mapping_path
        self.mapping = self._load_mapping(mapping_path)
        self.calories_by_food_id = self._load_calories(csv_path)

    @property
    def loaded(self) -> bool:
        return bool(self.calories_by_food_id)

    def lookup(self, class_name: str) -> dict[str, Any]:
        if class_name == "Con nguoi":
            return {
                "matched": False,
                "food_id": None,
                "food_name_vi": "Không phải món ăn",
                "message": "AI phát hiện người trong ảnh, không tính calories cho class này.",
            }

        food_id = self.mapping.get(class_name)
        if not food_id:
            return {
                "matched": False,
                "food_id": None,
                "food_name_vi": class_name,
                "message": "Chưa có dữ liệu calories cho món này.",
            }

        nutrition = self.calories_by_food_id.get(food_id)
        if not nutrition:
            return {
                "matched": False,
                "food_id": food_id,
                "food_name_vi": class_name,
                "message": "Class đã có mapping nhưng không tìm thấy food_id trong CSV calories.",
            }

        return {
            "matched": True,
            **nutrition,
        }

    def _load_mapping(self, mapping_path: Path) -> dict[str, str]:
        with mapping_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return {str(key): str(value) for key, value in data.items()}

    def _load_calories(self, csv_path: Path) -> dict[str, dict[str, Any]]:
        dataframe = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
        rows: dict[str, dict[str, Any]] = {}

        for _, row in dataframe.iterrows():
            food_id = str(row.get("food_id", "")).strip()
            if not food_id:
                continue

            cleaned = {
                column: _clean_value(column, row.get(column))
                for column in DISPLAY_COLUMNS
                if column in dataframe.columns
            }
            rows[food_id] = cleaned

        return rows
