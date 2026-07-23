export type TabKey = 'recognize' | 'history' | 'settings';
export type FilterKey = 'today' | 'week' | 'month';
export type ToastType = 'success' | 'error' | 'info';

export interface FoodLog {
  id: string;
  dishName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  description: string;
  date: string;
  timestamp: number;
  image: string; // Base64 or URL
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface YoloNutrition {
  matched?: boolean;
  food_id?: string | null;
  food_name_vi?: string;
  message?: string;
  calories_per_serving_selected?: number | string;
  calories_min_final?: number | string;
  calories_max_final?: number | string;
}

export interface YoloDetection {
  class_id: number;
  class_name: string;
  /** Backend-normalized display name for this detection: nutrition.food_name_vi
   * when known, otherwise class_name. Single source of truth - do not re-derive. */
  dish_name: string;
  confidence: number;
  /** Backend-normalized calories for this detection (null when no calorie data). */
  calories: number | null;
  calories_min?: number | null;
  calories_max?: number | null;
  /** Pre-formatted "min - max KCAL", or null when no range is available. */
  calorie_range: string | null;
  /** Whether this detection's `calories` is folded into total_calories_estimated
   * (false when unmatched, or confidence is below the backend's threshold). */
  counted_in_total: boolean;
  nutrition?: YoloNutrition | null;
}

export interface YoloPredictResponse {
  success: boolean;
  filename: string;
  message: string;
  detections: YoloDetection[];
  total_calories_estimated?: number | string;
  calorie_estimation_note?: string;
  annotated_image_base64?: string;
}

export interface RecognitionResult extends Partial<FoodLog> {
  filename?: string;
  message?: string;
  detections: YoloDetection[];
  annotatedImage?: string;
  calorieRange?: string;
  calorieNote?: string;
  hasLowConfidence?: boolean;
  /** True when more than one detection is counted in the total - the header
   * shows a combined label/total instead of a single dish's info. */
  isMultiDish?: boolean;
  totalCalories: number;
  /** True when at least one detection resolved to real nutrition data
   * (nutrition.matched === true). False for zero detections *and* for
   * detections that exist but aren't food (e.g. only "Con nguoi"). */
  hasUsableResult?: boolean;
}
