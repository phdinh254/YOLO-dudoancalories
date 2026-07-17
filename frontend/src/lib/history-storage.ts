import type { FoodLog } from '../types';

export const HISTORY_STORAGE_KEY = 'vietfood_history';
export const MAX_HISTORY_ITEMS = 50;

const PROBE_KEY = '__vietfood_storage_probe__';

export interface HistoryLoadResult {
  history: FoodLog[];
  warning: string | null;
}

export type HistorySaveResult =
  | { status: 'saved'; history: FoodLog[]; trimmedCount: number }
  | { status: 'quota-exceeded' }
  | { status: 'unavailable' };

export type HistoryClearResult = { status: 'cleared' } | { status: 'unavailable' };

/** Cheap read/write/remove probe. localStorage can throw (not just return null)
 * when a browser blocks storage entirely (strict private-mode policies, some
 * enterprise lockdowns), so every real call below is guarded the same way. */
function isStorageAvailable(): boolean {
  try {
    window.localStorage.setItem(PROBE_KEY, '1');
    window.localStorage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

function isFoodLogArray(value: unknown): value is FoodLog[] {
  return Array.isArray(value);
}

export function loadHistory(): HistoryLoadResult {
  if (!isStorageAvailable()) {
    return {
      history: [],
      warning: 'Trình duyệt đang chặn lưu trữ cục bộ nên lịch sử sẽ không được lưu lại trong phiên này.',
    };
  }

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  } catch {
    return { history: [], warning: 'Không thể đọc lịch sử đã lưu trên trình duyệt này.' };
  }

  if (!raw) {
    return { history: [], warning: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    removeHistoryKeySilently();
    return { history: [], warning: 'Dữ liệu lịch sử cũ bị lỗi nên đã được đặt lại.' };
  }

  if (!isFoodLogArray(parsed)) {
    removeHistoryKeySilently();
    return { history: [], warning: 'Dữ liệu lịch sử cũ không hợp lệ nên đã được đặt lại.' };
  }

  return { history: parsed, warning: null };
}

function removeHistoryKeySilently(): void {
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Nothing more we can do here; the corrupted key just stays on disk and
    // the app keeps running with an empty in-memory history for this session.
  }
}

/**
 * Persists `entries` (expected newest-first), capped to MAX_HISTORY_ITEMS.
 * If the write throws (quota exceeded), progressively drops the oldest
 * entries and retries so a large annotated image on one item doesn't block
 * saving everything else. Every attempt is a single atomic localStorage
 * write, so a failed attempt never wipes out whatever was already stored.
 */
export function saveHistory(entries: FoodLog[]): HistorySaveResult {
  if (!isStorageAvailable()) {
    return { status: 'unavailable' };
  }

  const capped = entries.slice(0, MAX_HISTORY_ITEMS);

  if (capped.length === 0) {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, '[]');
      return { status: 'saved', history: [], trimmedCount: 0 };
    } catch {
      return { status: 'quota-exceeded' };
    }
  }

  for (let count = capped.length; count > 0; count -= 1) {
    const candidate = capped.slice(0, count);
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(candidate));
      return { status: 'saved', history: candidate, trimmedCount: capped.length - candidate.length };
    } catch {
      continue;
    }
  }

  return { status: 'quota-exceeded' };
}

export function clearHistory(): HistoryClearResult {
  if (!isStorageAvailable()) {
    return { status: 'unavailable' };
  }
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    return { status: 'cleared' };
  } catch {
    return { status: 'unavailable' };
  }
}
