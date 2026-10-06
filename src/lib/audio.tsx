import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { Episode, PodcastShow } from '../types';
import { store } from './store';

export interface NowPlaying { episode: Episode; show: PodcastShow; queue: Episode[]; }

interface AudioCtxValue {
  now: NowPlaying | null;
  playing: boolean;
  play: (ep: Episode, show: PodcastShow, queue?: Episode[]) => void;
  toggle: () => void;
  seekBy: (sec: number) => void;
  seekTo: (sec: number) => void;
  setRate: (r: number) => void;
  rate: number;
  next: () => void;
  prev: () => void;
  close: () => void;
  player: ReturnType<typeof useAudioPlayer>;
}

const Ctx = createContext<AudioCtxValue | null>(null);

export function useAudio(): AudioCtxValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAudio must be used inside AudioProvider');
  return v;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [now, setNow] = useState<NowPlaying | null>(null);
  const [rate, setRateState] = useState(1);
  const nowRef = useRef(now);
  nowRef.current = now;
  const statusRef = useRef(status);
  statusRef.current = status;
  const wasPlaying = useRef(false);
  // listening-stats session tracking
  const sessionRef = useRef<{ epId: string | null; start: number }>({ epId: null, start: 0 });

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
  }, []);

  const flushStats = useCallback(async () => {
    const s = sessionRef.current;
    sessionRef.current = { epId: null, start: 0 };
    if (!s.epId) return;
    const elapsed = (Date.now() - s.start) / 1000;
    if (elapsed < 5) return;
    const st = statusRef.current;
    const ratio = st.duration > 0 ? st.currentTime / st.duration : 0;
    const l = await store.listening();
    l.secondsListened += Math.round(elapsed);
    if (ratio >= 0.9 && !l.completedIds.includes(s.epId)) {
      l.completedIds.push(s.epId);
      l.episodesCompleted += 1;
    }
    await store.saveListening(l);
  }, []);

  const beginSession = useCallback((epId: string) => {
    sessionRef.current = { epId, start: Date.now() };
  }, []);

  // periodic flush while playing (every 60s)
  useEffect(() => {
    if (!status.playing) return;
    const t = setInterval(() => {
      flushStats().then(() => {
        const n = nowRef.current;
        if (n) beginSession(n.episode.id);
      });
    }, 60000);
    return () => clearInterval(t);
  }, [status.playing, flushStats, beginSession]);

  const play = useCallback(
    (ep: Episode, show: PodcastShow, queue: Episode[] = []) => {
      flushStats().then(() => beginSession(ep.id));
      setNow({ episode: ep, show, queue });
      player.replace({ uri: ep.audioUrl });
      player.play();
    },
    [player, flushStats, beginSession]
  );

  const toggle = useCallback(() => {
    if (status.playing) {
      player.pause();
      flushStats().then(() => {
        const n = nowRef.current;
        if (n && statusRef.current.playing === false) {
          // session stays open for resume; restart timer from now
          beginSession(n.episode.id);
        }
      });
    } else {
      const n = nowRef.current;
      if (n) beginSession(n.episode.id);
      player.play();
    }
  }, [player, status.playing, flushStats, beginSession]);

  const seekBy = useCallback(
    (sec: number) => player.seekTo(Math.max(0, status.currentTime + sec)),
    [player, status.currentTime]
  );
  const seekTo = useCallback((sec: number) => player.seekTo(sec), [player]);
  const setRate = useCallback(
    (r: number) => {
      player.playbackRate = r;
      setRateState(r);
    },
    [player]
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      const n = nowRef.current;
      if (!n || n.queue.length === 0) return;
      const i = n.queue.findIndex((e) => e.id === n.episode.id);
      const j = i + dir;
      if (j >= 0 && j < n.queue.length) {
        const ep = n.queue[j];
        flushStats().then(() => beginSession(ep.id));
        setNow({ ...n, episode: ep });
        player.replace({ uri: ep.audioUrl });
        player.play();
      }
    },
    [player, flushStats, beginSession]
  );
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);
  const close = useCallback(() => {
    player.pause();
    flushStats();
    setNow(null);
  }, [player, flushStats]);

  // Auto-advance when an episode finishes
  useEffect(() => {
    if (
      wasPlaying.current &&
      !status.playing &&
      status.duration > 30 &&
      status.currentTime >= status.duration - 2
    ) {
      step(1);
    }
    wasPlaying.current = status.playing;
  }, [status, step]);

  // Flush stats on unmount
  useEffect(() => () => { flushStats(); }, [flushStats]);

  return (
    <Ctx.Provider
      value={{ now, playing: status.playing, play, toggle, seekBy, seekTo, setRate, rate, next, prev, close, player }}
    >
      {children}
    </Ctx.Provider>
  );
}
