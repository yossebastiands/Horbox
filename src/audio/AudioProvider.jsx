import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const AudioCtx = createContext(null);

export function AudioProvider({ children }) {
  const audioRef = useRef(typeof Audio !== "undefined" ? new Audio() : null);
  const [queue, setQueue] = useState([]);          // [{ id, url, title, artist, cover }]
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(null);     // current track object
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem("horbox_audio_vol") ?? 0.5));

  // Wire up audio element once
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.preload = "auto";
    a.volume = volume;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setTime(a.currentTime || 0);
    const onLoaded = () => setDur(Number.isFinite(a.duration) ? a.duration : 0);
    const onEnd = () => next();

    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("ended", onEnd);

    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("ended", onEnd);
      a.pause();
      a.src = "";
    };
  }, []);

  // Persist volume
  useEffect(() => {
    localStorage.setItem("horbox_audio_vol", String(volume));
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const loadIndex = async (i) => {
    if (!queue.length) return;
    const safe = Math.max(0, Math.min(i, queue.length - 1));
    const track = queue[safe];
    const a = audioRef.current;
    if (!a || !track?.url) return;
    a.src = track.url;
    setCurrent(track);
    setIndex(safe);
    setTime(0);
    setDur(0);
    try {
      await a.play();
    } catch {
      // autoplay blocked until a user gesture
    }
  };

  const playQueue = async (tracks, startAt = 0) => {
    setQueue(tracks);
    await loadIndex(startAt);
  };

  const playTrack = async (track) => {
    await playQueue([track], 0);
  };

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try { await a.play(); } catch {}
    } else {
      a.pause();
    }
  };

  const next = async () => {
    if (index + 1 < queue.length) await loadIndex(index + 1);
  };

  const prev = async () => {
    if (time > 3) {
      // restart current if >3s in
      const a = audioRef.current;
      if (a) a.currentTime = 0;
      return;
    }
    if (index - 1 >= 0) await loadIndex(index - 1);
  };

  const seek = (t) => {
    const a = audioRef.current;
    if (a && Number.isFinite(t)) a.currentTime = Math.max(0, Math.min(t, dur || 0));
  };

  const value = useMemo(() => ({
    // state
    queue, index, current, playing, time, dur, volume,
    // controls
    playQueue, playTrack, toggle, next, prev, seek, setVolume,
  }), [queue, index, current, playing, time, dur, volume]);

  return (
    <AudioCtx.Provider value={value}>
      {children}
      {/* Hidden element: persists across routes */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </AudioCtx.Provider>
  );
}

export const useAudio = () => useContext(AudioCtx);
