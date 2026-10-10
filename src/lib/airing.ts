/**
 * Airing calendar helpers — timezone-aware broadcast countdowns, fully on-device.
 * Jikan gives broadcast day/time in JST (e.g. { day: "Saturdays", time: "24:00" }).
 * We convert to the user's local timezone so nobody has to do JST math by hand.
 */

const DAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

/** Accepts "Saturday", "Saturdays", "saturdays" → 6 */
export function parseBroadcastDay(day?: string | null): number | null {
  if (!day) return null;
  const base = day.trim().replace(/s$/i, '');
  const key = Object.keys(DAY_INDEX).find(
    (k) => k.toLowerCase() === base.toLowerCase()
  );
  return key ? DAY_INDEX[key] : null;
}

/**
 * Next airing moment (epoch ms) for a JST broadcast slot.
 * Handles Jikan's "24:00"-style times (25:30 = 01:30 next day).
 * Returns null when the slot is unknown.
 */
export function nextAiringAt(
  day: string | null | undefined,
  time: string | null | undefined,
  nowMs: number = Date.now()
): number | null {
  const dow = parseBroadcastDay(day ?? null);
  if (dow === null) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec((time || '').trim());
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  let dayOffset = Math.floor(h / 24);
  h = h % 24;

  // Work in JST (UTC+9, no DST) — shift UTC clock, do weekday math there.
  const JST = 9 * 3600 * 1000;
  const jstNow = new Date(nowMs + JST);
  const jstDow = jstNow.getUTCDay();
  let delta = (dow - jstDow + 7) % 7;
  const target = new Date(
    Date.UTC(
      jstNow.getUTCFullYear(),
      jstNow.getUTCMonth(),
      jstNow.getUTCDate() + delta + dayOffset,
      h,
      min
    )
  );
  let at = target.getTime() - JST;
  // If it aired more than ~35 min ago, it means next week.
  if (at < nowMs - 35 * 60 * 1000) at += 7 * 24 * 3600 * 1000;
  return at;
}

export interface AiringSoon {
  id: number;
  title: string;
  at: number;
  dayLabel: string;
}

/** Human countdown: "in 2h 14m", "in 3d 1h", "started ~20m ago", "airing now-ish". */
export function countdownLabel(at: number, nowMs: number = Date.now()): string {
  const diff = at - nowMs;
  if (Math.abs(diff) < 35 * 60 * 1000) return '🔴 airing around now';
  if (diff < 0) {
    const m = Math.round(-diff / 60000);
    return m < 90 ? `started ~${m}m ago` : `started ~${Math.round(m / 60)}h ago`;
  }
  const mins = Math.floor(diff / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const mm = mins % 60;
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${mm}m`;
  return `in ${mm}m`;
}

export function dayLabel(at: number, nowMs: number = Date.now()): string {
  const a = new Date(at);
  const n = new Date(nowMs);
  const days = Math.floor(
    (new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() -
      new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()) /
      86400000
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return a.toLocaleDateString(undefined, { weekday: 'long' });
}
