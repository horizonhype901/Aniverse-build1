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

<!-- new entries go below -->
