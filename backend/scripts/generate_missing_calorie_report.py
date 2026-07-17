# -*- coding: utf-8 -*-
"""Regenerate backend/data/missing_calorie_mappings_report.json.

A YOLO class counts as "mapped with numeric calories" only if
NutritionLookup actually resolves it to a numeric
calories_per_serving_selected — not merely if it has an entry in
class_calorie_mapping.json. This catches cases like the CSV row
having "missing" in that column despite a mapping existing.

"Con nguoi" is intentionally excluded: utils/nutrition.py special-cases
it to report "not a food" instead of calories, so it is never expected
to resolve to a number.

Usage:
    .venv\\Scripts\\python.exe scripts\\generate_missing_calorie_report.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import yaml  # noqa: E402

from utils.nutrition import NutritionLookup  # noqa: E402

DATA_DIR = BACKEND_DIR / "data"
DATA_YAML_PATH = DATA_DIR / "data.yaml"
CALORIES_CSV_PATH = DATA_DIR / "dataset_calories_v0_34.csv"
MAPPING_PATH = DATA_DIR / "class_calorie_mapping.json"
REPORT_PATH = DATA_DIR / "missing_calorie_mappings_report.json"

INTENTIONALLY_EXCLUDED = {"Con nguoi"}


def _resolves_to_number(nutrition: dict) -> bool:
    if not nutrition.get("matched"):
        return False
    value = nutrition.get("calories_per_serving_selected")
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, str):
        try:
            float(value)
            return True
        except ValueError:
            return False
    return False


def main() -> None:
    data_yaml = yaml.safe_load(DATA_YAML_PATH.read_text(encoding="utf-8")) or {}
    yolo_classes = [str(name) for name in data_yaml.get("names", [])]

    lookup = NutritionLookup(CALORIES_CSV_PATH, MAPPING_PATH)

    missing = []
    for class_name in yolo_classes:
        if class_name in INTENTIONALLY_EXCLUDED:
            continue
        nutrition = lookup.lookup(class_name)
        if not _resolves_to_number(nutrition):
            missing.append(class_name)

    mapped_count = len(yolo_classes) - len(missing) - len(INTENTIONALLY_EXCLUDED & set(yolo_classes))

    report = {
        "total_yolo_classes": len(yolo_classes),
        "mapped_classes_with_numeric_calories": mapped_count,
        "missing_calorie_mapping_count": len(missing) + len(INTENTIONALLY_EXCLUDED & set(yolo_classes)),
        "missing_calorie_mapping_classes": sorted(INTENTIONALLY_EXCLUDED & set(yolo_classes)) + missing,
        "note": (
            "Class 'Con nguoi' được backend xử lý riêng (utils/nutrition.py) để báo "
            "'không phải món ăn' thay vì tính calories, nên cố ý không có trong mapping. "
            "Các class còn lại trong danh sách này (nếu có) là lỗi dữ liệu thật cần sửa: "
            "class có mapping nhưng calories_per_serving_selected không phải số hợp lệ, "
            "hoặc class chưa có mapping trong class_calorie_mapping.json. "
            "Report này được sinh tự động bởi scripts/generate_missing_calorie_report.py, "
            "không chỉnh sửa thủ công."
        ),
    }

    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"total_yolo_classes: {report['total_yolo_classes']}")
    print(f"mapped_classes_with_numeric_calories: {report['mapped_classes_with_numeric_calories']}")
    print(f"missing_calorie_mapping_count: {report['missing_calorie_mapping_count']}")
    print(f"missing_calorie_mapping_classes: {report['missing_calorie_mapping_classes']}")


if __name__ == "__main__":
    main()
