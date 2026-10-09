# AniVerse BACKEND BACKLOG

Ideas researched during improvement sprints that genuinely need servers, multi-user
infrastructure, paid APIs, or licenses. Each entry ships (or shipped) with: UI +
local data layer + a clearly marked stub integration point in code. When a backend
exists, wire the stub.

Format: `### <idea>` — need, evidence, stub location, local behavior today.

<!-- entries go below -->

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
