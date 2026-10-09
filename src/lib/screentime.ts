// 🌱 Screen-time nudge ("Take a Break") — doomscroll guard.
//
// Pain point: 88% of young people doomscroll and half lose 1+ hour of sleep
// a night (PR Newswire poll, 2026-09-17); endless recommendation feeds create an
// "engagement trap" users can't voluntarily exit (MedicalXpress, 2026-10);
// "automatic browsers" call their scrolling meaningless and regret the time
// (Discover Magazine). Differentiation: the whole timer lives on-device —
// there is no server, no analytics, nobody to sell the data to.
//
// Tracks focused time on the Feed tab per day. When the daily total crosses
// the user's threshold, FeedScreen shows a gentle BreakNudge instead of
// another row of content.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'aniverse:screentime:v1';

export interface ScreenTime {
  date: string; // YYYY-MM-DD (local)
  feedSeconds: number; // focused feed time today
  lastNudgeAt: number; // epoch ms of last nudge; 0 = never (snooze gate)
  breaksTaken: number; // "take a break" taps today
  breakStreak: number; // consecutive days with >= 1 break
  lastBreakDay: string | null; // YYYY-MM-DD of last break day
  thresholdMin: number; // 0 = off; else 15/30/45/60
}

const FRESH: ScreenTime = {
  date: '',
  feedSeconds: 0,
  lastNudgeAt: 0,
  breaksTaken: 0,
  breakStreak: 0,
  lastBreakDay: null,
  thresholdMin: 30,
};

export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayStr(d);
}

async function read(): Promise<ScreenTime> {
  try {
    const s = await AsyncStorage.getItem(KEY);
    if (s) return { ...FRESH, ...(JSON.parse(s) as Partial<ScreenTime>) };
  } catch {
    /* corrupted or missing — start fresh */
  }
  return { ...FRESH };
}

async function write(st: ScreenTime): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(st));
}

/** Load, rolling daily counters over when the calendar day changes. */
export async function loadScreenTime(): Promise<ScreenTime> {
  const st = await read();
  const t = todayStr();
  if (st.date !== t) {
    st.date = t;
    st.feedSeconds = 0;
    st.lastNudgeAt = 0;
    st.breaksTaken = 0;
    // a streak lapses only after a full break-less day has passed
    if (st.lastBreakDay && st.lastBreakDay !== yesterdayStr()) st.breakStreak = 0;
    await write(st);
  }
  return st;
}

/** Add focused feed seconds; returns the fresh state. */
export async function addFeedSeconds(n: number): Promise<ScreenTime> {
  const st = await loadScreenTime();
  st.feedSeconds += n;
  await write(st);
  return st;
}

/** True when it's time to show the nudge (threshold crossed, not snoozed). */
export function shouldNudge(st: ScreenTime, now: number = Date.now()): boolean {
  if (st.thresholdMin <= 0) return false;
  if (st.feedSeconds < st.thresholdMin * 60) return false;
  // don't nag more than once per 10 minutes
  if (now - st.lastNudgeAt < 10 * 60 * 1000) return false;
  return true;
}

/** User saw the nudge (either choice) — starts the 10-minute snooze. */
export async function recordNudgeShown(): Promise<ScreenTime> {
  const st = await loadScreenTime();
  st.lastNudgeAt = Date.now();
  await write(st);
  return st;
}

/** User chose "take a break" — counts the break and maintains the streak. */
export async function recordBreak(): Promise<ScreenTime> {
  const st = await loadScreenTime();
  const t = todayStr();
  st.breaksTaken += 1;
  st.lastNudgeAt = Date.now();
  if (st.lastBreakDay !== t) {
    st.breakStreak = st.lastBreakDay === yesterdayStr() ? st.breakStreak + 1 : 1;
    st.lastBreakDay = t;
  }
  await write(st);
  return st;
}

export async function setNudgeThreshold(min: number): Promise<ScreenTime> {
  const st = await loadScreenTime();
  st.thresholdMin = min;
  await write(st);
  return st;
}

export const NUDGE_OPTIONS = [0, 15, 30, 45, 60];
export const nudgeLabel = (m: number) => (m === 0 ? 'Off' : `${m}m`);
