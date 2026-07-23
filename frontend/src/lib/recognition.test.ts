import { describe, expect, it } from 'vitest';
import { buildDishSummaryLabel, buildRecognitionResult } from './recognition';
import type { YoloDetection, YoloPredictResponse } from '../types';

function detection(overrides: Partial<YoloDetection>): YoloDetection {
  return {
    class_id: 0,
    class_name: 'Pho',
    dish_name: 'Phở bò',
    confidence: 0.9,
    calories: 410,
    calories_min: 350,
    calories_max: 500,
    calorie_range: '350 - 500 KCAL',
    counted_in_total: true,
    nutrition: {
      matched: true,
      food_id: 'pho_bo',
      food_name_vi: 'Phở bò',
      calories_per_serving_selected: 410,
      calories_min_final: 350,
      calories_max_final: 500,
    },
    ...overrides,
  };
}

function response(overrides: Partial<YoloPredictResponse>): YoloPredictResponse {
  return {
    success: true,
    filename: 'test.jpg',
    message: 'Nhận dạng thành công.',
    detections: [],
    total_calories_estimated: 0,
    calorie_estimation_note: 'note',
    annotated_image_base64: 'data:image/jpeg;base64,FAKE',
    ...overrides,
  };
}

describe('buildRecognitionResult', () => {
  it('labels a single counted dish with its own name, calories and range', () => {
    const pho = detection({});
    const result = buildRecognitionResult(response({ detections: [pho], total_calories_estimated: 410 }));

    expect(result.dishName).toBe('Phở bò');
    expect(result.calories).toBe(410);
    expect(result.totalCalories).toBe(410);
    expect(result.calorieRange).toBe('350 - 500 KCAL');
    expect(result.isMultiDish).toBe(false);
    expect(result.isPrimaryCounted).toBe(true);
    expect(result.hasUsableResult).toBe(true);
  });

  it('an image with two different dishes: header names both dishes covered by the total, never just one', () => {
    const pho = detection({ class_id: 52, class_name: 'Pho', dish_name: 'Phở bò', calories: 410, confidence: 0.86 });
    const banhMi = detection({
      class_id: 4,
      class_name: 'Banh mi',
      dish_name: 'Bánh mì thịt',
      calories: 300,
      calorie_range: '300 - 500 KCAL',
      confidence: 0.55,
      nutrition: { matched: true, food_id: 'banh_mi_thit', food_name_vi: 'Bánh mì thịt' },
    });

    const result = buildRecognitionResult(response({ detections: [pho, banhMi], total_calories_estimated: 710 }));

    // The bug this guards against: dishName used to come from only the
    // highest-confidence detection while calories summed every detection.
    expect(result.dishName).toBe('Phở bò, Bánh mì thịt');
    expect(result.calories).toBe(710);
    expect(result.totalCalories).toBe(710);
    expect(result.isMultiDish).toBe(true);
    // A single item's range can't represent a multi-dish sum, so it must not
    // be shown next to the combined total.
    expect(result.calorieRange).toBeUndefined();
    // No single confidence value represents a multi-dish total either.
    expect(result.confidence).toBe(0);
    // Detections list itself must retain both, in the order the backend sent.
    expect(result.detections).toEqual([pho, banhMi]);
  });

  it('two separate detections of the same dish are both counted and both listed, grouped only in the label', () => {
    const first = detection({ class_id: 52, confidence: 0.9, calories: 410 });
    const second = detection({ class_id: 52, confidence: 0.7, calories: 410 });

    const result = buildRecognitionResult(response({ detections: [first, second], total_calories_estimated: 820 }));

    expect(result.dishName).toBe('Phở bò x2');
    expect(result.calories).toBe(820);
    expect(result.isMultiDish).toBe(true);
    // The underlying detections are never merged - both boxes stay distinct.
    expect(result.detections).toHaveLength(2);
  });

  it('a low-confidence detection is shown but excluded from the total, and named honestly', () => {
    const lowConfidencePho = detection({ confidence: 0.304, counted_in_total: false });

    const result = buildRecognitionResult(response({ detections: [lowConfidencePho], total_calories_estimated: 0 }));

    expect(result.hasUsableResult).toBe(true);
    expect(result.hasLowConfidence).toBe(true);
    expect(result.calories).toBe(0);
    expect(result.isMultiDish).toBe(false);
    // Still names the dish that was detected (with a warning in the UI),
    // instead of falling back to "not recognized" for something that was.
    expect(result.dishName).toBe('Phở bò');
    // Regression: the header used to fall back to a blank 0% confidence and
    // hide the range for this exact case (single detection, matched, not
    // counted), even though the real confidence/range are known and useful.
    expect(result.confidence).toBe(30.4);
    expect(result.calorieRange).toBe('350 - 500 KCAL');
    // The 0 KCAL headline must not be presented as "this dish's calories
    // per serving" - isPrimaryCounted must be false so the UI doesn't
    // attach a "/ khẩu phần" suffix to a total that was never computed for it.
    expect(result.isPrimaryCounted).toBe(false);
  });

  it('a detection with no calorie mapping contributes nothing and is not treated as usable on its own', () => {
    const unmapped = detection({
      class_name: 'Mystery Dish',
      dish_name: 'Mystery Dish',
      calories: null,
      calories_min: null,
      calories_max: null,
      calorie_range: null,
      counted_in_total: false,
      nutrition: { matched: false, food_id: null, food_name_vi: 'Mystery Dish', message: 'Chưa có dữ liệu calories cho món này.' },
    });

    const result = buildRecognitionResult(response({ detections: [unmapped], total_calories_estimated: 0 }));

    expect(result.hasUsableResult).toBe(false);
    expect(result.calories).toBe(0);
    expect(result.dishName).toBe('Không nhận dạng được món ăn');
  });

  it('total_calories_estimated from the backend is trusted as-is, never recomputed from the detection list', () => {
    // If the frontend ever re-summed the detections itself, this would be
    // 820 (410 + 410); the backend's own total must win.
    const first = detection({ calories: 410 });
    const second = detection({ calories: 410 });

    const result = buildRecognitionResult(response({ detections: [first, second], total_calories_estimated: 500 }));

    expect(result.calories).toBe(500);
    expect(result.totalCalories).toBe(500);
  });

  it('detection list order from the backend is preserved as-is', () => {
    const low = detection({ class_id: 1, confidence: 0.55, dish_name: 'Bánh mì thịt' });
    const high = detection({ class_id: 2, confidence: 0.9, dish_name: 'Phở bò' });

    const result = buildRecognitionResult(response({ detections: [low, high], total_calories_estimated: 820 }));

    expect(result.detections.map((d) => d.dish_name)).toEqual(['Bánh mì thịt', 'Phở bò']);
  });
});

describe('buildDishSummaryLabel', () => {
  it('joins distinct dish names in order', () => {
    const pho = detection({ dish_name: 'Phở bò' });
    const banhMi = detection({ dish_name: 'Bánh mì thịt' });
    expect(buildDishSummaryLabel([pho, banhMi])).toBe('Phở bò, Bánh mì thịt');
  });

  it('groups repeated dish names with a count suffix', () => {
    const pho1 = detection({ dish_name: 'Phở bò' });
    const pho2 = detection({ dish_name: 'Phở bò' });
    const banhMi = detection({ dish_name: 'Bánh mì thịt' });
    expect(buildDishSummaryLabel([pho1, pho2, banhMi])).toBe('Phở bò x2, Bánh mì thịt');
  });
});
