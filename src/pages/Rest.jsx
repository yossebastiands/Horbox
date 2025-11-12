import { useEffect, useRef, useState } from "react";

export default function Rest() {
  const aRef = useRef(null);
  const rafRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [volume, setVolume] = useState(
    Number(localStorage.getItem("horbox_rest_vol") ?? 0.6)
  );
  const [loop, setLoop] = useState(false);
  const [err, setErr] = useState("");

  // wire events once
  useEffect(() => {
    const a = aRef.current;
    if (!a) return;

    a.volume = volume;
    a.loop = loop;

    const onPlay = () => {
      setPlaying(true);
      tick();
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
    };
    const onTime = () => setTime(a.currentTime || 0);
    const onLoaded = () => {
      const d = Number.isFinite(a.duration) ? a.duration : 0;
      setDur(d);
      setReady(true);
    };
    const onError = () => {
      setErr("Couldn’t load /audio/song.mp3. Check path and file type.");
      setReady(false);
    };

    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("canplaythrough", onLoaded);
    a.addEventListener("error", onError);

    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("canplaythrough", onLoaded);
      a.removeEventListener("error", onError);
      cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  // persist volume
  useEffect(() => {
    localStorage.setItem("horbox_rest_vol", String(volume));
    if (aRef.current) aRef.current.volume = volume;
  }, [volume]);

  const tick = () => {
    const a = aRef.current;
    if (!a) return;
    setTime(a.currentTime || 0);
    rafRef.current = requestAnimationFrame(tick);
  };

  const toggle = async () => {
    const a = aRef.current;
    if (!a) return;
    setErr("");
    if (a.paused) {
      try {
        await a.play(); // may throw if no user gesture yet
      } catch (e) {
        setErr("Press the ▶ button once to allow audio (autoplay policy).");
      }
    } else {
      a.pause();
    }
  };

  const seek = (t) => {
    const a = aRef.current;
    if (!a || !Number.isFinite(dur)) return;
    a.currentTime = Math.max(0, Math.min(t, dur));
  };

  const fmt = (s) => {
    s = Math.floor(s || 0);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="page rest-page">
      {/* Robust audio element */}
      <audio
        ref={aRef}
        preload="auto"
        playsInline
        crossOrigin="anonymous"
      >
        <source src="/audio/song.mp3" type="audio/mpeg" />
      </audio>

      <div className="mini-player">
        <button className="mp-btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "⏸" : "▶️"}
        </button>

        <div className="mp-meta">
          <div className="mp-title">Rest — song.mp3</div>
          <div className="mp-time">{fmt(time)} / {fmt(dur)}</div>

          <input
            className="mp-seek"
            type="range"
            min="0"
            max={dur || 0}
            step="1"
            value={Math.min(time, dur || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            disabled={!ready}
            aria-label="Seek"
          />
          {err && <div className="mp-err">{err}</div>}
        </div>

        <div className="mp-right">
          <label className="mp-vol">
            <span>🔊</span>
            <input
              type="range"
              min="0" max="1" step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </label>
          <button
            className={`mp-loop ${loop ? "on" : ""}`}
            onClick={() => setLoop(v => !v)}
            aria-pressed={loop}
            title="Loop"
          >
            🔁
          </button>
        </div>
      </div>
    </div>
  );
}
