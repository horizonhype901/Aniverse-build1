// 🌡️ Kindness nudge — pre-post toxicity friction.
//
// Pain point: 44.7% of US teens witnessed online harassment and Instagram
// ranks worst for negative self-perception (Medscape, 2026); seven lines of
// evidence say current platforms fail any reasonable safety test for teens
// (After Babel). Differentiation: safety friction is on by default and
// entirely on-device — no moderation server, no one reading your drafts.
//
// heatCheck() scans a draft for heated signals (hostile words, all-caps
// ranting, exclamation spam). It NEVER blocks: the composer just asks
// "post anyway?" — a speed bump, not censorship. False positives are
// acceptable by design.
const HOSTILE = [
  'idiot', 'idiots', 'stupid', 'dumb', 'moron', 'morons', 'loser', 'losers',
  'shut up', 'kill yourself', 'kys', 'worthless', 'pathetic', 'braindead',
  'retard', 'retarded', 'hate you', 'die mad',
];

export interface HeatResult {
  level: 'ok' | 'warm' | 'hot';
  flags: string[];
}

/** Pure — safe to unit test. */
export function heatCheck(body: string): HeatResult {
  const flags: string[] = [];
  const text = body.toLowerCase();

  const hits = HOSTILE.filter((w) => {
    // whole-word match for single words, substring for phrases
    return w.includes(' ')
      ? text.includes(w)
      : new RegExp(`\\b${w}\\b`).test(text);
  });
  if (hits.length > 0) flags.push(`heated words: ${hits.slice(0, 3).join(', ')}`);

  const letters = body.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= 30) {
    const upper = letters.replace(/[^A-Z]/g, '').length;
    if (upper / letters.length > 0.7) flags.push('mostly ALL CAPS');
  }

  const bangs = (body.match(/!/g) || []).length;
  if (bangs >= 5) flags.push('lots of exclamation marks');

  if (flags.length >= 2) return { level: 'hot', flags };
  if (flags.length === 1) return { level: 'warm', flags };
  return { level: 'ok', flags };
}
