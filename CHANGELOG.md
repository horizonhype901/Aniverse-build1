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

### 🙈 One-tap spoiler shield (PostCard + Feed + PostDetail)
- Spoiler-blurred posts now carry a "🙈 Hide all spoilers for {anime}" button —
  one tap enables that anime's spoiler shield without leaving the feed/thread.
  Works even for anime you haven't started tracking (title-keyed progress
  entries); existing per-anime progress merges by title.
- Evidence: anime-only fans' spoiler-survival guides warn to avoid feeds and
  even DMs, relying on heavily-moderated Discords —
  https://myanimelist.net/forum/?topicid=1911903 ; manga readers spoil/harp
  on anime-onlys even for 1:1 adaptations —
  https://myanimelist.net/forum/?topicid=2003025&show=50&msgid=66376630
- Touched: `src/components/PostCard.tsx` (onShieldAnime prop + button),
  `src/screens/FeedScreen.tsx`, `src/screens/PostDetailScreen.tsx`,
  `src/lib/store.ts` (progress map now string-keyed; numeric MAL ids still
  work). Verified: tsc + expo-doctor 21/21 green.

### 🎯 For You — on-device taste-match recommender (Discover)
- New row scores the catalog against YOUR watchlist by genre overlap
  (watching/completed full weight, plan/on-hold half, dropped = no signal),
  tie-broken toward higher-scored titles — every pick shows its reason
  ("Because you watched Frieren"). Nothing leaves the phone; no
  popularity-ranked score bands.
- Evidence: MAL's "suggestions" are just unrated anime in a score band, not
  taste-based, skewing to already-famous titles —
  https://myanimelist.net/forum/?topicid=2252571&msgid=73843329 ;
  good older anime stay "buried beneath more recent and popular anime" —
  https://myanimelist.net/forum/?topicid=2136375&msgid=70306961
- New: `src/lib/tastematch.ts`. Touched: `src/screens/DiscoverScreen.tsx`
  (TasteRow, loads watchlist alongside live data; offline falls back to the
  bundled catalog). Verified: tsc + expo-doctor 21/21 green; 5/5 unit checks
  (overlap ranking, dropped-exclusion, in-list exclusion, attribution, empty
  watchlist).

### 📺 Dual thread lanes — Anime-only mode (Composer + Feed + PostDetail)
- Authors can flag Episode Talk posts/comments as "📖 Compares to the manga /
  LN" (composer switch; thread-level toggle under the comment box).
- Viewers get a persistent "📺 Anime-only" lane toggle (Feed chip + per-thread
  chip, stored on-device): flagged posts/comments are hidden with a
  "N manga-comparison replies hidden" note. Flagged comments show a 📖 badge
  so anime-only users can spot source-reader talk at a glance.
- Evidence: MAL episode threads dominated by source-readers declaring
  adaptations bad for cut details —
  https://myanimelist.net/forum/?topicid=1203181&msgid=31732631 ;
  2024 threads calling out manga readers nitpicking adaptations "to look cool" —
  https://myanimelist.net/forum/?topicid=2038681&msgid=67219009 ;
  anime-only spoiler-survival guides rely on heavily-moderated Discords —
  https://myanimelist.net/forum/?topicid=1911903
- Touched: `src/types.ts` (Post/Comment.mangaComparisons), `src/lib/store.ts`
  (lanes key + accessors), `ComposerScreen.tsx`, `FeedScreen.tsx`,
  `PostDetailScreen.tsx`. Verified: tsc + expo-doctor 21/21 green.

### 📅 Airing This Week calendar (Discover)
- New section groups Currently Airing titles by broadcast day with
  timezone-aware countdowns ("in 2h 14m", "🔴 airing around now") — computed
  fully on-device from Jikan's JST `broadcast.day`/`broadcast.time`
  (handles Jikan's "24:00"-style times). No more manual JST math.
- Graceful offline: the section hides when live broadcast data is missing.
- Evidence: MAL still has no native timezone-aware airing countdown (Feb 2025
  users still begging + third-party workarounds) —
  https://myanimelist.net/forum/?topicid=1759733&msgid=71901598
- New: `src/lib/airing.ts`. Touched: `src/types.ts` (AnimeItem.broadcastDay/
  broadcastTime), `src/lib/api.ts` (normAnime), `src/screens/DiscoverScreen.tsx`.
  Verified: tsc + expo-doctor 21/21 green; 13/13 unit checks on day parsing,
  next-airing math (incl. 24:00+/25:30 rollover), countdown + day labels.
