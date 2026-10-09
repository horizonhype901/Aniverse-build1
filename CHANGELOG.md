# AniVerse CHANGELOG

## v5 (shipped 2026-10-06 → APK 2026-10-07)

On-device mega-batch from the 500-idea profile bank:
- Blinking avatars; 3 new accessories (beanie, santa hat, flower crown); mood presets
- Avatar studio remembers last tab; per-category dice
- 5 profile themes; anthem history + auto-pause on podcast play
- Check-in heatmap; 10 achievement badges (profile + community)
- Now-watching strip with progress bars; animated poll bars
- Spoiler-shield "why" explainer; pace-learning ETA
- Undo toast on watchlist remove
- Onboarding step 3 (avatar design → opens studio)
- Also shipped in v2–v4: emoji reactions, episode check-ins, spoiler profiles/shield, mute words/anime filters, nested comment replies, 🔮 prediction polls + leaderboard, watchlist+ (on hold/dropped, time-to-finish), vibe-tag filters, taste-quiz onboarding, stats dashboard + podcast listening stats, custom SVG avatar builder ("Avatar Studio"), profile customization studio (banner, profile anthem via iTunes preview, favorite anime showcase, pinned post), deterministic community member profiles + "👁 Preview" visitor view.

## Sprint 2026-10-09 (relentless improvement, 2h)

Each entry cites the research evidence that motivated it.

### 🌱 Take-a-Break doomscroll guard (Feed + Profile)
- Tracks focused Feed time per day, fully on-device (AsyncStorage; no server, no analytics).
- Crossing your threshold (Off/15/30/45/60m, set in Profile → "⏳ Screen-time nudge")
  shows a gentle 🌱 interstitial instead of more content: "Keep scrolling"
  (snoozes 10 min) or "✨ Take a break" (logs a break, shows a calm rest screen).
- Profile stats show "breaks today" + "touch-grass streak"; 3-day streak earns the
  🌱 Touch Grass badge.
- Evidence: 88% of young people doomscroll, half lose 1+ hr of sleep nightly —
  https://www.morningstar.com/news/pr-newswire/20260917dc49262/new-poll-finds-88-of-young-people-doomscroll-and-half-lose-more-than-an-hour-of-sleep-a-night ;
  endless feeds create an "engagement trap" users can't exit —
  https://medicalxpress.com/news/2026-10-endless-video-users-adhd-struggling.html ;
  "automatic browsers" regret meaningless scrolling —
  https://discovermagazine.com/mind/escaping-the-doomscroll-how-social-media-could-work-with-us-not-against-us ;
  idea-bank #837/#838.
- New: `src/lib/screentime.ts`, `src/components/BreakNudge.tsx`. Touched:
  `FeedScreen.tsx`, `ProfileScreen.tsx`, `src/profile/badges.tsx`. Verified:
  tsc + expo-doctor 21/21 green; 11/11 unit checks on threshold/snooze/streak/rollover logic.

### 🎨 Artist credit on Art & Cosplay posts (Composer + PostCard)
- Composer shows an "🎨 Artist credit" field when the topic is Art & Cosplay;
  the credit renders as a "🎨 Art by …" chip on the post and is carried into
  the share text — a structural nudge against repost-without-credit theft.
- Evidence: artists report platforms do little to stop reposting; on Instagram/
  DeviantArt even followers can't report someone else's stolen art —
  https://scotscoop.com/stealing-art-is-not-limited-to-just-reposting/ ;
  idea-bank #303-area (fan-art credit).
- Touched: `src/types.ts` (Post.credit), `ComposerScreen.tsx`, `PostCard.tsx`.
  Verified: tsc + expo-doctor 21/21 green.

### 🌡️ Kindness nudge — pre-post toxicity friction (Composer)
- Drafts that trip the on-device chill filter (hostile words, ALL-CAPS ranting,
  exclamation spam — 2+ signals) get a "🌡️ Reads a bit heated" confirm dialog
  with "✏️ Let me edit" / "Post anyway". It never blocks; it's a speed bump.
  Single-signal drafts post normally. Nothing leaves the phone.
- Evidence: 44.7% of US teens witnessed online harassment; Instagram worst for
  negative self-perception —
  https://www.medscape.com/viewarticle/negative-online-experiences-common-among-us-adolescents-vary-2026a1000zp5 ;
  seven lines of evidence that platforms fail teen safety —
  https://www.afterbabel.com/p/the-many-lines-of-evidence-that-social .
- New: `src/lib/kindness.ts`. Touched: `ComposerScreen.tsx`. Verified: tsc +
  expo-doctor 21/21 green; 7/7 unit checks on heat levels.

### 📚 Manga Shelf + anime→manga chapter bridge (Profile + AnimeDetail)
- New "📚 Manga Shelf" section on Profile: add manga titles, chapter −/+ steppers,
  status filters (Reading / Completed / Plan / On Hold / Dropped), remove —
  all persisted on-device.
- On any anime's detail page, a "📖 Continue in the manga" card lets you link
  the manga title + the chapter the anime leaves off at; the linked entry shows
  on the shelf ("📖 from {anime}") and on the anime page with a ＋ stepper.
- Evidence: tracking is fragmented across apps and "continue anime from manga
  chapter X" has no single home; 7,000+ titles were DMCA'd off MangaDex —
  https://myanimelist.net/forum/?topicid=2214700&show=50 ;
  idea-bank #115/#621–630.
- Touched: `src/types.ts` (MangaEntry), `src/lib/store.ts` (manga/mangaShelf keys),
  `ProfileScreen.tsx`, `AnimeDetailScreen.tsx`. Verified: tsc + expo-doctor
  21/21 green; 4/4 store round-trip checks.

### 🐢 Comment slow mode + 🎉 "You're all caught up" footer (PostDetail + Feed)
- Comments are rate-limited to one per 30s per device, with a friendly
  "🐢 Slow mode — take a breath, post again in Xs" notice. Pile-ons and
  rage-reply threads need velocity; removing it keeps discussion human.
- The feed now ends with a deliberate stopping cue — "🎉 You're all caught
  up! No infinite scroll here — go watch some anime." — instead of an endless
  slot-machine scroll.
- Evidence: harassment/safety — https://www.medscape.com/viewarticle/negative-online-experiences-common-among-us-adolescents-vary-2026a1000zp5 ;
  finite "you're caught up" feeds — https://pckt.blog/b/jesseplusplus/people-not-feeds-91g2s7z ;
  stopping cues over endless refresh —
  https://discovermagazine.com/mind/escaping-the-doomscroll-how-social-media-could-work-with-us-not-against-us .
- Touched: `src/lib/kindness.ts` (slowModeWait), `src/lib/store.ts`
  (lastCommentAt), `PostDetailScreen.tsx`, `FeedScreen.tsx`. Verified: tsc +
  expo-doctor 21/21 green; 5/5 slow-mode unit checks.

### 🔍 Feed transparency line + backend backlog seeded
- The feed now states exactly how it's sorted under the header ("🔥 Hot =
  ranked by likes & recency — no black-box algorithm" / "🆕 New = purely
  chronological") — a direct answer to algorithmic-feed distrust:
  https://gizmodo.com/instagram-exec-thinks-people-dont-actually-want-a-chronological-feed-2000809867
- `BACKEND-BACKLOG.md` seeded with the two top backend-gated ideas from this
  sprint's research (watch-party scheduler + offline con mode), each with its
  evidence link and marked stub point.
- Verified: tsc + expo-doctor 21/21 green.

<!-- new entries go below -->
