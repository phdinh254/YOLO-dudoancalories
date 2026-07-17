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
  isVietnamese: boolean;
  filterGroup: FilterKey;
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
  confidence: number;
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
  totalCalories: number;
}
