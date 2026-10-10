# AniVerse BACKEND BACKLOG

Ideas researched during improvement sprints that genuinely need servers, multi-user
infrastructure, paid APIs, or licenses. Each entry ships (or shipped) with: UI +
local data layer + a clearly marked stub integration point in code. When a backend
exists, wire the stub.

Format: `### <idea>` — need, evidence, stub location, local behavior today.

<!-- entries go below -->

### Where-to-watch availability per title
- Need: which services legally stream each anime (and "nowhere — Blu-ray only"
  states), so fans can rotate subscriptions instead of stacking them. Requires
  licensor/availability data (paid API or scraped dataset + license).
- Evidence: anime scattered across services, nobody wants another subscription
  for one show — https://myanimelist.net/forum/?topicid=2141411&show=0&msgid=70473568 ;
  flagship titles vanishing from legal streaming (FMA 2003, May 2026) —
  https://comicbook.com/anime/news/anime-fans-are-heartbroken-one-of-the-biggest-series-isnt-streaming-anywhere/ ;
  fans stacking Crunchyroll + Netflix, "keep one anchor, rotate the rest" —
  https://huntervault.app/blog/anime-streaming-subscription-budget/
- On-device today: the title hub (progress, episode notes, manga bridge) is
  ready; stub point (when built): `src/lib/watchwhere.ts` —
  `availability(animeId)` returns cached service list + last-checked date;
  AnimeDetail renders a "📺 Where to watch" card from it.

### Watch-party scheduler + spoiler-safe reaction layer
- Need: coordinating a watch slot across friends/timezones + a shared live
  reaction feed. The reaction feed needs peers (server or P2P sync).
- Evidence: coordinating group watches is awkward; existing tools are desktop
  Chrome extensions — https://myanimelist.net/forum/?topicid=2173326&msgid=71518793 ;
  idea-bank watch-party entries.
- On-device today: nothing yet. Stub point (when built): `src/lib/watchparty.ts`
  — `scheduleParty({animeId, episode, at})` persists to AsyncStorage; countdown
  renders from local time; reaction feed posts to `POST /party/:id/react`
  (stub — currently a no-op that logs locally).

### Offline con mode (meetups over BLE/mesh)
- Need: check into a con, discover nearby fans, pin impromptu meetup shouts —
  requires nearby-peer discovery (BLE) no server can replace on-device.
- Evidence: cons are lonely solo; fans miss impromptu meetups —
  https://kotaku.com/an-app-for-people-going-to-nerd-conventions-1793105462 ;
  idea-bank con-meetup entries.
- On-device today: nothing yet. Stub point (when built): `src/lib/conmode.ts`
  — `checkIn(conName)` persists locally; nearby discovery via
  `react-native-ble-plx` (not installed); shouts queue in AsyncStorage and sync
  opportunistically.
