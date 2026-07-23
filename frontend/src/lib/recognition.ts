import type { RecognitionResult, YoloDetection, YoloPredictResponse } from '../types';

export const BACKEND_PREDICT_URL =
  import.meta.env.VITE_BACKEND_PREDICT_URL || 'http://127.0.0.1:8000/predict';
export const REQUEST_TIMEOUT_MS = 30000;
export const LOW_CONFIDENCE_THRESHOLD = 0.5;
export const CALORIE_ESTIMATION_NOTE =
  'Calories chỉ là ước tính tham khảo theo khẩu phần chuẩn, không thay thế tư vấn dinh dưỡng chuyên môn.';

export const toNumber = (value: number | string | null | undefined): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized || normalized.toLowerCase().includes('chua') || normalized.toLowerCase().includes('missing')) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const formatConfidence = (confidence: number): number => {
  return Math.round(confidence * 1000) / 10;
};

export const hasUsableDetection = (detections: YoloDetection[]): boolean =>
  detections.some((detection) => detection.nutrition?.matched === true);

/**
 * Builds a display label for the summary header out of every detection whose
 * calories are actually folded into the total, so the header can never name
 * one dish while showing a total that covers several. Repeated dishes (two
 * separate bowls of the same thing) are grouped as "Tên món x2" for
 * readability - this only affects the label string, never the underlying
 * per-detection list or the total itself.
 */
export const buildDishSummaryLabel = (countedDetections: YoloDetection[]): string => {
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const detection of countedDetections) {
    const name = detection.dish_name || detection.class_name;
    if (!counts.has(name)) order.push(name);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return order.map((name) => (counts.get(name)! > 1 ? `${name} x${counts.get(name)}` : name)).join(', ');
};

export const buildRecognitionResult = (data: YoloPredictResponse): RecognitionResult => {
  const detections = Array.isArray(data.detections) ? data.detections : [];
  const hasUsableResult = hasUsableDetection(detections);
  // total_calories_estimated is the backend's single source of truth for the
  // total (already confidence-filtered and matched-only) - never recomputed
  // here, so the frontend can't independently drift from it.
  const calories = toNumber(data.total_calories_estimated) ?? 0;

  const countedDetections = detections.filter((detection) => detection.counted_in_total);
  // Detections that matched a food item but weren't counted in the total
  // (currently: below-threshold confidence) - shown with a warning, per item.
  const matchedButUncountedDetections = detections.filter(
    (detection) => detection.nutrition?.matched === true && !detection.counted_in_total,
  );

  const isSingleDish = countedDetections.length === 1;
  const primaryDetection = isSingleDish ? countedDetections[0] : undefined;

  const hasLowConfidence = detections.some((detection) => detection.confidence < LOW_CONFIDENCE_THRESHOLD);

  return {
    filename: data.filename,
    message: data.message,
    detections,
    annotatedImage: data.annotated_image_base64,
    // Single counted dish -> its own name. Multiple -> an honest combined
    // label naming every dish the total actually covers (never a single
    // dish's name standing in for a multi-dish total).
    dishName: primaryDetection
      ? primaryDetection.dish_name
      : countedDetections.length > 1
        ? buildDishSummaryLabel(countedDetections)
        : matchedButUncountedDetections.length > 0
          ? buildDishSummaryLabel(matchedButUncountedDetections)
          : 'Không nhận dạng được món ăn',
    calories,
    totalCalories: calories,
    protein: 0,
    carbs: 0,
    fat: 0,
    // Only meaningful for a single counted dish; multi-dish totals don't have
    // one confidence value that represents the whole sum.
    confidence: primaryDetection ? formatConfidence(primaryDetection.confidence) : 0,
    description:
      data.message ||
      'Không nhận dạng được món ăn. Vui lòng thử ảnh rõ hơn, đủ sáng và món ăn nằm trong khung hình.',
    // Only shown for a single counted dish - a range for a multi-dish sum
    // would be as misleading as the name mismatch this fixes.
    calorieRange: primaryDetection?.calorie_range ?? undefined,
    calorieNote: data.calorie_estimation_note || CALORIE_ESTIMATION_NOTE,
    hasLowConfidence,
    hasUsableResult,
    isMultiDish: countedDetections.length > 1,
  };
};
