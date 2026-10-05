import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { Episode, PodcastShow } from '../types';

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
  const wasPlaying = useRef(false);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
  }, []);

  const play = useCallback(
    (ep: Episode, show: PodcastShow, queue: Episode[] = []) => {
      setNow({ episode: ep, show, queue });
      player.replace({ uri: ep.audioUrl });
      player.play();
    },
    [player]
  );

  const toggle = useCallback(() => {
    if (status.playing) player.pause();
    else player.play();
  }, [player, status.playing]);

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
        setNow({ ...n, episode: ep });
        player.replace({ uri: ep.audioUrl });
        player.play();
      }
    },
    [player]
  );
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);
  const close = useCallback(() => {
    player.pause();
    setNow(null);
  }, [player]);

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

  return (
    <Ctx.Provider
      value={{ now, playing: status.playing, play, toggle, seekBy, seekTo, setRate, rate, next, prev, close, player }}
    >
      {children}
    </Ctx.Provider>
  );
}
