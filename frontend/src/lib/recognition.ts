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

export const getDetectionName = (detection: YoloDetection): string => {
  return detection.nutrition?.food_name_vi || detection.class_name;
};

export const getDetectionCalories = (detection: YoloDetection): number | null => {
  return toNumber(detection.nutrition?.calories_per_serving_selected);
};

export const formatConfidence = (confidence: number): number => {
  return Math.round(confidence * 1000) / 10;
};

export const buildRecognitionResult = (data: YoloPredictResponse): RecognitionResult => {
  const detections = Array.isArray(data.detections) ? data.detections : [];
  const primaryDetection = detections[0];
  const calories =
    toNumber(data.total_calories_estimated) ??
    detections.reduce((sum, detection) => sum + (getDetectionCalories(detection) ?? 0), 0);
  const primaryMin = toNumber(primaryDetection?.nutrition?.calories_min_final);
  const primaryMax = toNumber(primaryDetection?.nutrition?.calories_max_final);
  const hasLowConfidence = detections.some((detection) => detection.confidence < LOW_CONFIDENCE_THRESHOLD);

  return {
    filename: data.filename,
    message: data.message,
    detections,
    annotatedImage: data.annotated_image_base64,
    dishName: primaryDetection ? getDetectionName(primaryDetection) : 'Không nhận dạng được món ăn',
    calories,
    totalCalories: calories,
    protein: 0,
    carbs: 0,
    fat: 0,
    confidence: primaryDetection ? formatConfidence(primaryDetection.confidence) : 0,
    description:
      data.message ||
      'Không nhận dạng được món ăn. Vui lòng thử ảnh rõ hơn, đủ sáng và món ăn nằm trong khung hình.',
    isVietnamese: true,
    calorieRange: primaryMin !== null && primaryMax !== null ? `${primaryMin} - ${primaryMax} KCAL` : undefined,
    calorieNote: data.calorie_estimation_note || CALORIE_ESTIMATION_NOTE,
    hasLowConfidence,
  };
};
