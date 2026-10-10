import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { C, R } from '../theme';
import { animeFull } from '../lib/api';
import { store } from '../lib/store';
import { AnimeItem, MangaEntry, ProgressEntry, WatchStatus, AnimeNote } from '../types';
import { compact } from '../lib/format';

const STATUSES: { key: WatchStatus; label: string }[] = [
  { key: 'watching', label: '▶️ Watching' },
  { key: 'completed', label: '✅ Completed' },
  { key: 'plan', label: '📌 Plan to Watch' },
  { key: 'onhold', label: '⏸️ On Hold' },
  { key: 'dropped', label: '🗑️ Dropped' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AnimeDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const passed: AnimeItem | undefined = route.params?.anime;
  const animeId: number | undefined = route.params?.animeId || passed?.id;

  const [anime, setAnime] = useState<AnimeItem | null>(passed || null);
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState<ProgressEntry | null>(null);
  const [pace, setPace] = useState(0); // episodes per active day, learned
  const [linkedManga, setLinkedManga] = useState<MangaEntry | null>(null);
  const [mangaTitle, setMangaTitle] = useState('');
  const [mangaChapter, setMangaChapter] = useState('');
  const [notes, setNotes] = useState<AnimeNote[]>([]);
  const [noteEp, setNoteEp] = useState('');
  const [noteText, setNoteText] = useState('');
  const [shieldSuggest, setShieldSuggest] = useState(false); // 🛡️ auto-suggest shield for airing anime

  useEffect(() => {
    (async () => {
      if (animeId) {
        try {
          const full = await animeFull(animeId);
          setAnime((prev) => ({ ...prev, ...full, id: animeId } as AnimeItem));
        } catch {
          /* offline — passed data stands */
        }
        const w = await store.watchlist();
        const e = w.find((x) => x.anime.id === animeId);
        setStatus(e ? e.status : null);
        setNote(e?.note || '');
        const pg = await store.progress();
        setProgress(pg[animeId] || null);
        // personal pace: episodes per active day, learned from check-ins
        const days = await store.checkins();
        const totalEps = Object.values(pg).reduce((a, e: any) => a + (e.watched || 0), 0);
        setPace(days.length > 0 && totalEps > 0 ? totalEps / days.length : 0);
        // manga bridge: is this anime continued in the manga shelf?
        const mg = await store.manga();
        setLinkedManga(mg.find((m) => m.fromAnime?.id === animeId) || null);
        // 📝 notes for this title
        const all = await store.notes();
        setNotes(all.filter((n) => n.animeId === animeId));
      }
    })();
  }, [animeId]);

  const linkManga = async () => {
    if (!anime || !animeId) return;
    const title = mangaTitle.trim() || anime.title;
    const ch = Math.max(0, parseInt(mangaChapter.replace(/\D/g, ''), 10) || 0);
    const mg = await store.manga();
    const entry: MangaEntry = {
      id: `m-${Date.now()}`,
      title,
      status: 'reading',
      chapter: ch,
      fromAnime: { id: animeId, title: anime.title },
      addedAt: Date.now(),
    };
    await store.saveManga([entry, ...mg]);
    setLinkedManga(entry);
    setMangaTitle('');
    setMangaChapter('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const addNote = async () => {
    if (!noteText.trim() || !animeId || !anime) return;
    const entry: AnimeNote = {
      id: `n-${Date.now()}`,
      animeId,
      animeTitle: anime.title,
      episode: noteEp.trim() || undefined,
      text: noteText.trim(),
      createdAt: Date.now(),
    };
    const all = await store.notes();
    await store.saveNotes([entry, ...all]);
    setNotes([entry, ...notes]);
    setNoteEp('');
    setNoteText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeNote = async (id: string) => {
    const all = await store.notes();
    const next = all.filter((n) => n.id !== id);
    await store.saveNotes(next);
    setNotes(next.filter((n) => n.animeId === animeId));
  };

  const setWatch = async (s: WatchStatus | null, n?: string) => {
    if (!anime) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const w = await store.watchlist();
    const rest = w.filter((x) => x.anime.id !== anime.id);
    if (s) rest.unshift({ anime, status: s, addedAt: Date.now(), note: n });
    await store.saveWatchlist(rest);
    setStatus(s);
    if (n !== undefined) setNote(n);
    // 🛡️ auto-suggest the spoiler shield when tracking a currently-airing anime
    if ((s === 'watching' || s === 'plan') && animeId && /currently airing/i.test(anime.status || '')) {
      const pg = await store.progress();
      setShieldSuggest(!pg[animeId]?.hideSpoilers);
    } else {
      setShieldSuggest(false);
    }
  };

  const bumpProgress = async (delta: number) => {
    if (!anime || !animeId) return;
    const pg = await store.progress();
    const cur = pg[animeId] || {
      title: anime.title,
      watched: 0,
      total: anime.episodes,
      hideSpoilers: false,
    };
    const cap = cur.total || anime.episodes || 500;
    const watched = Math.max(0, Math.min(cap, cur.watched + delta));
    const next = { ...cur, watched, total: cur.total ?? anime.episodes, title: anime.title };
    pg[animeId] = next;
    await store.saveProgress(pg);
    setProgress(next);
    // daily check-in for streaks
    const days = await store.checkins();
    const t = todayStr();
    if (!days.includes(t)) {
      await store.saveCheckins([...days, t].slice(-365));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // auto-suggest completed when reaching the total
    if (next.total && watched >= next.total && status !== 'completed') {
      setWatch('completed');
    }
  };

  const toggleShield = async () => {
    if (!anime || !animeId || !progress) return;
    const pg = await store.progress();
    pg[animeId] = { ...progress, hideSpoilers: !progress.hideSpoilers };
    await store.saveProgress(pg);
    setProgress(pg[animeId]);
  };

  // 🛡️ one-tap enable from the auto-suggest card
  const enableSuggestedShield = async () => {
    if (!anime || !animeId) return;
    const pg = await store.progress();
    const cur = pg[animeId] || { title: anime.title, watched: 0, hideSpoilers: false };
    pg[animeId] = { ...cur, hideSpoilers: true, title: cur.title || anime.title };
    await store.saveProgress(pg);
    setProgress(pg[animeId]);
    setShieldSuggest(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const discuss = () => {
    if (!anime) return;
    nav.navigate('Composer', {
      prefill: { topic: 'Episode Talk', title: `[${anime.title}] `, animeTag: anime.title },
    });
  };

  const remaining = progress?.total ? Math.max(0, progress.total - progress.watched) : null;
  const eta = (() => {
    if (remaining === null || remaining <= 0) return null;
    const hours = `${Math.floor((remaining * 24) / 60)}h ${(remaining * 24) % 60}m`;
    if (pace > 0) {
      const days = Math.max(1, Math.ceil(remaining / pace));
      return `≈ ${hours} left · ~${days}d at your pace`;
    }
    return `≈ ${hours} left`;
  })();

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => nav.goBack()}><Text style={s.back}>‹ Back</Text></Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>Anime Details</Text>
        <View style={{ width: 60 }} />
      </View>
      {!anime ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 80 }} size="large" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={s.top}>
            <Image source={{ uri: anime.image }} style={s.poster} />
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{anime.title}</Text>
              <Text style={s.score}>
                {anime.score ? `⭐ ${anime.score.toFixed(2)}` : '⭐ --'}
                {anime.scoredBy ? <Text style={s.scoreBy}> ({compact(anime.scoredBy)})</Text> : null}
              </Text>
              <Text style={s.meta}>
                {[anime.year, anime.episodes ? `${anime.episodes} eps` : null, anime.status]
                  .filter(Boolean).join(' • ')}
              </Text>
            </View>
          </View>

          <View style={s.genres}>
            {anime.genres.map((g) => (
              <View key={g} style={s.genre}><Text style={s.genreText}>{g}</Text></View>
            ))}
          </View>

          <Text style={s.synopsis}>{anime.synopsis}</Text>

          {/* Watch progress */}
          <View style={s.card}>
            <Text style={s.cardTitle}>📺 My progress</Text>
            <View style={s.stepRow}>
              <Pressable style={s.stepBtn} onPress={() => bumpProgress(-1)}>
                <Text style={s.stepText}>−</Text>
              </Pressable>
              <Text style={s.stepCount}>
                {progress?.watched || 0}{progress?.total ? ` / ${progress.total}` : ''} eps
              </Text>
              <Pressable style={s.stepBtn} onPress={() => bumpProgress(1)}>
                <Text style={s.stepText}>＋</Text>
              </Pressable>
            </View>
            {eta && <Text style={s.eta}>{eta}</Text>}
            {progress && (
              <View style={s.shieldRow}>
                <Text style={s.shieldLabel}>🛡️ Hide spoilers for this anime</Text>
                <Switch
                  value={progress.hideSpoilers}
                  onValueChange={toggleShield}
                  trackColor={{ true: C.primary }}
                  thumbColor="#fff"
                />
              </View>
            )}
            {!progress && (
              <Pressable style={s.startTrack} onPress={() => bumpProgress(0)}>
                <Text style={s.startTrackText}>Start tracking episodes</Text>
              </Pressable>
            )}
          </View>

          {/* 📖 anime → manga chapter bridge */}
          <View style={s.card}>
            <Text style={s.cardTitle}>📖 Continue in the manga</Text>
            {linkedManga ? (
              <View style={s.bridgeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.bridgeTitle} numberOfLines={1}>{linkedManga.title}</Text>
                  <Text style={s.bridgeSub}>ch {linkedManga.chapter} · on your Manga Shelf</Text>
                </View>
                <Pressable
                  style={s.stepBtn}
                  onPress={async () => {
                    const mg = await store.manga();
                    const next = mg.map((m) =>
                      m.id === linkedManga.id ? { ...m, chapter: m.chapter + 1 } : m
                    );
                    await store.saveManga(next);
                    setLinkedManga({ ...linkedManga, chapter: linkedManga.chapter + 1 });
                  }}
                >
                  <Text style={s.stepText}>＋</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={s.bridgeHint}>
                  Know which chapter this anime leaves off at? Link it — your
                  shelf tracks chapters from there.
                </Text>
                <TextInput
                  style={s.noteInput}
                  value={mangaTitle}
                  onChangeText={setMangaTitle}
                  placeholder={`Manga title (default: ${anime?.title || 'this anime'})`}
                  placeholderTextColor={C.faint}
                />
                <View style={s.bridgeForm}>
                  <TextInput
                    style={[s.noteInput, { flex: 1, marginRight: 8 }]}
                    value={mangaChapter}
                    onChangeText={setMangaChapter}
                    placeholder="Starts at chapter…"
                    placeholderTextColor={C.faint}
                    keyboardType="numeric"
                  />
                  <Pressable style={s.addBtn} onPress={linkManga}>
                    <Text style={s.addText}>🔗 Link</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {/* 📝 episode notes — the title's personal hub */}
          <View style={s.card}>
            <Text style={s.cardTitle}>📝 My notes</Text>
            {notes.length === 0 && (
              <Text style={s.bridgeHint}>
                Theories, favorite moments, episode reactions — kept with the title.
              </Text>
            )}
            {notes.map((n) => (
              <View key={n.id} style={s.noteRow}>
                <View style={{ flex: 1 }}>
                  {n.episode ? <Text style={s.noteEp}>Ep {n.episode}</Text> : null}
                  <Text style={s.noteText}>{n.text}</Text>
                </View>
                <Pressable onPress={() => removeNote(n.id)}>
                  <Text style={s.noteDel}>✕</Text>
                </Pressable>
              </View>
            ))}
            <View style={s.bridgeForm}>
              <TextInput
                style={[s.noteInput, { width: 70, marginRight: 8 }]}
                value={noteEp}
                onChangeText={setNoteEp}
                placeholder="Ep #"
                placeholderTextColor={C.faint}
              />
              <TextInput
                style={[s.noteInput, { flex: 1, marginRight: 8 }]}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Add a note…"
                placeholderTextColor={C.faint}
              />
              <Pressable style={s.addBtn} onPress={addNote}>
                <Text style={s.addText}>＋</Text>
              </Pressable>
            </View>
          </View>

          <View style={s.actions}>
            {status === null ? (
              <Pressable style={s.addBtn} onPress={() => setWatch('watching')}>
                <Text style={s.addText}>＋ Add to Watchlist</Text>
              </Pressable>
            ) : (
              <View>
                <View style={s.statusRow}>
                  {STATUSES.map((x) => (
                    <Pressable
                      key={x.key}
                      onPress={() => setWatch(x.key, x.key === 'dropped' ? note : undefined)}
                      style={[s.statusChip, status === x.key && s.statusActive]}
                    >
                      <Text style={[s.statusText, status === x.key && { color: '#fff' }]}>{x.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => setWatch(null)}>
                    <Text style={s.remove}>Remove</Text>
                  </Pressable>
                </View>
                {status === 'dropped' && (
                  <TextInput
                    style={s.noteInput}
                    value={note}
                    onChangeText={(v) => {
                      setNote(v);
                      setWatch('dropped', v);
                    }}
                    placeholder="Why did you drop it? (pacing, art, bored…)"
                    placeholderTextColor={C.faint}
                  />
                )}
              </View>
            )}
            <Pressable style={s.discussBtn} onPress={discuss}>
              <Text style={s.discussText}>💬 Discuss this anime</Text>
            </Pressable>
            {shieldSuggest && (
              <View
                style={s.shieldSuggest}
                accessibilityLabel={`Spoiler shield suggestion for ${anime?.title}`}
              >
                <Text style={s.shieldSuggestText}>
                  🛡️ {anime?.title} is airing now — spoilers are everywhere. Shield them?
                </Text>
                <View style={s.shieldSuggestRow}>
                  <Pressable style={s.shieldSuggestBtn} onPress={enableSuggestedShield}>
                    <Text style={s.shieldSuggestBtnText}>🙈 Enable shield</Text>
                  </Pressable>
                  <Pressable onPress={() => setShieldSuggest(false)} accessibilityLabel="Dismiss spoiler shield suggestion">
                    <Text style={s.shieldSuggestDismiss}>Not now</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { color: C.primary, fontSize: 17, fontWeight: '700', width: 60 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  top: { flexDirection: 'row', padding: 16 },
  poster: { width: 120, height: 175, borderRadius: R.md, marginRight: 14, backgroundColor: C.card2 },
  title: { color: C.text, fontSize: 20, fontWeight: '900', marginBottom: 6 },
  score: { color: C.gold, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  scoreBy: { color: C.faint, fontSize: 12, fontWeight: '400' },
  meta: { color: C.muted, fontSize: 13 },
  genres: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 8 },
  genre: { backgroundColor: C.card2, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  genreText: { color: C.accent, fontSize: 12, fontWeight: '700' },
  synopsis: { color: C.muted, fontSize: 14, lineHeight: 22, paddingHorizontal: 16 },
  card: { backgroundColor: C.card, borderRadius: R.lg, margin: 16, marginBottom: 0, padding: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { color: C.text, fontWeight: '800', fontSize: 15, marginBottom: 10 },
  bridgeRow: { flexDirection: 'row', alignItems: 'center' },
  bridgeTitle: { color: C.text, fontWeight: '700', fontSize: 14 },
  bridgeSub: { color: C.accent, fontSize: 12, marginTop: 3, fontWeight: '600' },
  bridgeHint: { color: C.faint, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.card2, borderRadius: R.md, padding: 10, marginBottom: 8 },
  noteEp: { color: C.gold, fontSize: 11, fontWeight: '800', marginBottom: 2 },
  noteText: { color: C.text, fontSize: 13, lineHeight: 18 },
  noteDel: { color: C.faint, fontSize: 14, padding: 4 },
  bridgeForm: { flexDirection: 'row', alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  stepText: { color: C.text, fontSize: 22, fontWeight: '700' },
  stepCount: { color: C.text, fontSize: 17, fontWeight: '800', marginHorizontal: 18 },
  eta: { color: C.faint, textAlign: 'center', marginTop: 8, fontSize: 13 },
  shieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  shieldLabel: { color: C.text, fontWeight: '600', fontSize: 14 },
  startTrack: { alignSelf: 'center', marginTop: 4, backgroundColor: C.card2, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  startTrackText: { color: C.secondary, fontWeight: '700' },
  actions: { padding: 16 },
  addBtn: { backgroundColor: C.primary, borderRadius: R.lg, padding: 14, alignItems: 'center', marginBottom: 10 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 },
  statusChip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  statusActive: { backgroundColor: C.secondary, borderColor: C.secondary },
  statusText: { color: C.muted, fontWeight: '700', fontSize: 13 },
  remove: { color: C.faint, fontWeight: '600', marginLeft: 4 },
  noteInput: { backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.border, color: C.text, padding: 10, fontSize: 14, marginBottom: 10 },
  discussBtn: { backgroundColor: C.card, borderRadius: R.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.secondary },
  discussText: { color: C.secondary, fontWeight: '800', fontSize: 16 },
  shieldSuggest: { backgroundColor: C.card2, borderRadius: R.lg, padding: 14, marginTop: 10, borderWidth: 1, borderColor: C.border },
  shieldSuggestText: { color: C.text, fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 10 },
  shieldSuggestRow: { flexDirection: 'row', alignItems: 'center' },
  shieldSuggestBtn: { backgroundColor: C.primary, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, marginRight: 14 },
  shieldSuggestBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  shieldSuggestDismiss: { color: C.muted, fontWeight: '600', fontSize: 14 },
});
