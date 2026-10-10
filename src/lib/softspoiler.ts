// 🔍 Soft-spoiler scanner — catches *hint* spoilers in thread comments.
//
// ResetEra's 100+ reply thread "Manga readers that spoil shit for anime
// watchers" documents the worst offender isn't outright plot reveals but
// soft spoilers: vague hints ("don't get too attached"), fake "theories"
// that are really spoilers, chapter-number mentions, and next-episode
// teaser comparisons. Multiple users say they stopped visiting discussion
// threads entirely because of it.
// https://www.resetera.com/threads/manga-readers-that-spoil-shit-for-anime-watchers.246292/page-2
//
// Hard spoiler blur can't catch these — they're never tagged. This scans
// comment text fully on-device and collapses matches behind a
// "possible hint-spoiler — tap to reveal" gate. False positives cost one
// tap; false negatives are what drove people off forums.

export interface SoftSpoilerHit {
  chapters: number[]; // cited manga chapter numbers, e.g. [45]
  hints: string[]; // matched hint-phrase labels
}

const HINTS: { re: RegExp; label: string }[] = [
  { re: /don't get too attached/i, label: '"don\'t get too attached"' },
  { re: /you'?re not ready/i, label: '"you\'re not ready"' },
  { re: /enjoy (it|this) while it lasts/i, label: '"enjoy it while it lasts"' },
  { re: /no spoilers,? but/i, label: '"no spoilers, but…"' },
  { re: /all i('ll| will) say is/i, label: '"all I\'ll say is…"' },
  { re: /\bjust wait\b( until| till)?/i, label: '"just wait"' },
  { re: /it gets dark/i, label: '"it gets dark"' },
  { re: /you'?ll see (soon|why)/i, label: '"you\'ll see"' },
  { re: /trust me on this/i, label: '"trust me on this"' },
  { re: /i won'?t spoil/i, label: '"I won\'t spoil, but…"' },
];

const CHAPTER_RES = [/\bchapters?\s+(\d+)/gi, /\bch\.?\s*(\d+)/gi];

export function scanSoftSpoiler(text: string): SoftSpoilerHit {
  const chapters: number[] = [];
  for (const re of CHAPTER_RES) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const n = parseInt(m[1], 10);
      if (n > 0 && !chapters.includes(n)) chapters.push(n);
    }
  }
  const hints = HINTS.filter((h) => h.re.test(text)).map((h) => h.label);
  return { chapters, hints };
}

export function hasSoftSpoiler(hit: SoftSpoilerHit): boolean {
  return hit.chapters.length > 0 || hit.hints.length > 0;
}

/** One-line reason shown on the collapsed comment. */
export function softSpoilerReason(hit: SoftSpoilerHit): string {
  const bits: string[] = [];
  if (hit.chapters.length > 0)
    bits.push(`cites chapter ${hit.chapters.join(', ')}`);
  if (hit.hints.length > 0) bits.push(`sounds like a hint (${hit.hints[0]})`);
  return bits.join(' · ');
}
