import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FoodLog } from '../types';
import {
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ITEMS,
  clearHistory,
  loadHistory,
  matchesHistoryFilter,
  saveHistory,
} from './history-storage';

function makeFoodLog(overrides: Partial<FoodLog> = {}): FoodLog {
  return {
    id: 'id',
    dishName: 'Phở bò',
    calories: 410,
    protein: 0,
    carbs: 0,
    fat: 0,
    confidence: 90,
    description: 'Mô tả tham khảo.',
    date: '10:00 - Hôm nay',
    timestamp: Date.now(),
    image: 'data:image/jpeg;base64,AAAA',
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('loadHistory', () => {
  it('returns empty history with no warning on first visit (nothing stored yet)', () => {
    expect(loadHistory()).toEqual({ history: [], warning: null });
  });

  it('loads previously saved entries as-is', () => {
    const entry = makeFoodLog({ id: 'a' });
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([entry]));

    const result = loadHistory();

    expect(result.warning).toBeNull();
    expect(result.history).toEqual([entry]);
  });

  it('recovers from corrupted JSON without crashing and clears the bad key', () => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, '{not-json');

    const result = loadHistory();

    expect(result.history).toEqual([]);
    expect(result.warning).toMatch(/lỗi/);
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  it('resets a non-array JSON payload safely instead of crashing downstream code', () => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ not: 'an array' }));

    const result = loadHistory();

    expect(result.history).toEqual([]);
    expect(result.warning).not.toBeNull();
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  it('does not throw and reports a clear warning when storage is entirely blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked');
    });

    let result: ReturnType<typeof loadHistory> | undefined;
    expect(() => {
      result = loadHistory();
    }).not.toThrow();

    expect(result?.history).toEqual([]);
    expect(result?.warning).toMatch(/chặn/);
  });
});

describe('saveHistory', () => {
  it('saves a new entry successfully', () => {
    const entry = makeFoodLog({ id: 'a' });

    const result = saveHistory([entry]);

    expect(result).toEqual({ status: 'saved', history: [entry], trimmedCount: 0 });
    expect(JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? 'null')).toEqual([entry]);
  });

  it('caps history at MAX_HISTORY_ITEMS, keeping the newest entries first', () => {
    const entries = Array.from({ length: MAX_HISTORY_ITEMS + 5 }, (_, i) => makeFoodLog({ id: `id-${i}` }));

    const result = saveHistory(entries);

    expect(result.status).toBe('saved');
    if (result.status === 'saved') {
      expect(result.history).toHaveLength(MAX_HISTORY_ITEMS);
      expect(result.history[0].id).toBe('id-0');
      expect(result.history.at(-1)?.id).toBe(`id-${MAX_HISTORY_ITEMS - 1}`);
    }
  });

  it('progressively drops the oldest entries until the save fits under quota', () => {
    const bigImage = 'A'.repeat(300);
    const entries = [
      makeFoodLog({ id: 'newest', image: bigImage }),
      makeFoodLog({ id: 'middle', image: bigImage }),
      makeFoodLog({ id: 'oldest', image: bigImage }),
    ];
    // Threshold sized to fit exactly one entry, so the module is forced to
    // retry with progressively fewer (oldest-dropped-first) entries.
    const THRESHOLD = JSON.stringify([entries[0]]).length + 10;

    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === HISTORY_STORAGE_KEY && value.length > THRESHOLD) {
        throw new DOMException('QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    });

    const result = saveHistory(entries);

    expect(result.status).toBe('saved');
    if (result.status === 'saved') {
      expect(result.history.length).toBeLessThan(entries.length);
      expect(result.trimmedCount).toBeGreaterThan(0);
      expect(result.history[0].id).toBe('newest');
    }
  });

  it('reports quota-exceeded without crashing when even a single entry cannot fit, and leaves prior storage untouched', () => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([makeFoodLog({ id: 'existing' })]));
    const before = window.localStorage.getItem(HISTORY_STORAGE_KEY);

    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === HISTORY_STORAGE_KEY) {
        throw new DOMException('QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    });

    let result: ReturnType<typeof saveHistory> | undefined;
    expect(() => {
      result = saveHistory([makeFoodLog({ id: 'too-big' })]);
    }).not.toThrow();

    expect(result).toEqual({ status: 'quota-exceeded' });
    // A failed save must never silently wipe out history that was already stored.
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBe(before);
  });

  it('reports unavailable without crashing when storage is entirely blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked');
    });

    let result: ReturnType<typeof saveHistory> | undefined;
    expect(() => {
      result = saveHistory([makeFoodLog()]);
    }).not.toThrow();

    expect(result).toEqual({ status: 'unavailable' });
  });
});

describe('matchesHistoryFilter', () => {
  // Fixed reference instant instead of Date.now() so day/month boundaries
  // in the assertions below can't flip depending on when the suite runs.
  const now = new Date(2026, 0, 15, 12, 0, 0).getTime(); // 2026-01-15 12:00 local

  const at = (year: number, month: number, day: number, hour = 12): number =>
    new Date(year, month, day, hour).getTime();

  it('matches "today" only for entries from the same calendar day', () => {
    const todayLog = makeFoodLog({ timestamp: at(2026, 0, 15, 8) });
    const yesterdayLog = makeFoodLog({ timestamp: at(2026, 0, 14) });

    expect(matchesHistoryFilter(todayLog, 'today', now)).toBe(true);
    expect(matchesHistoryFilter(yesterdayLog, 'today', now)).toBe(false);
  });

  it('matches "week" for anything within the last 7 days, including today', () => {
    const todayLog = makeFoodLog({ timestamp: at(2026, 0, 15, 8) });
    const sixDaysAgo = makeFoodLog({ timestamp: at(2026, 0, 9) });
    const eightDaysAgo = makeFoodLog({ timestamp: at(2026, 0, 7) });

    expect(matchesHistoryFilter(todayLog, 'week', now)).toBe(true);
    expect(matchesHistoryFilter(sixDaysAgo, 'week', now)).toBe(true);
    expect(matchesHistoryFilter(eightDaysAgo, 'week', now)).toBe(false);
  });

  it('matches "month" for anything in the same calendar month, even outside the week window', () => {
    const tenDaysAgo = makeFoodLog({ timestamp: at(2026, 0, 5) }); // still January, >7 days ago
    const lastMonth = makeFoodLog({ timestamp: at(2025, 11, 20) }); // December

    expect(matchesHistoryFilter(tenDaysAgo, 'week', now)).toBe(false);
    expect(matchesHistoryFilter(tenDaysAgo, 'month', now)).toBe(true);
    expect(matchesHistoryFilter(lastMonth, 'month', now)).toBe(false);
  });

  it('re-evaluates against the current time rather than a value frozen at save time', () => {
    // Same underlying entry; only "now" moves forward. A real bug here was
    // that "today" was decided once via a string baked in at save time, so
    // it never stopped matching "today" even days later.
    const log = makeFoodLog({ timestamp: at(2026, 0, 15, 8) });
    const muchLaterSameDay = at(2026, 0, 15, 23);
    const nextWeek = at(2026, 0, 23, 8);

    expect(matchesHistoryFilter(log, 'today', muchLaterSameDay)).toBe(true);
    expect(matchesHistoryFilter(log, 'today', nextWeek)).toBe(false);
  });
});

describe('clearHistory', () => {
  it('removes stored history', () => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([makeFoodLog()]));

    const result = clearHistory();

    expect(result).toEqual({ status: 'cleared' });
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  it('reports unavailable without crashing when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked');
    });

    let result: ReturnType<typeof clearHistory> | undefined;
    expect(() => {
      result = clearHistory();
    }).not.toThrow();

    expect(result).toEqual({ status: 'unavailable' });
  });
});
