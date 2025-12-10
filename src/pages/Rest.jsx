import { useEffect, useRef, useState } from "react";
import QuickMessageBox from "../components/QuickMessageBox.jsx";

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
    <>
      <QuickMessageBox />
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

      <div className="nature-player">
        <div className="player-glow"></div>
        
        <button className="nature-play-btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          <div className="play-pulse" style={{ animationPlayState: playing ? 'running' : 'paused' }}></div>
          <span className="play-icon">{playing ? "❚❚" : "▶"}</span>
        </button>

        <div className="player-content">
          <div className="track-info">
            <div className="track-title">Our Resting Place</div>
            <div className="track-artist">I love you, Salma</div>
          </div>

          <div className="progress-container">
            <div className="time-display">{fmt(time)}</div>
            <div className="progress-wrapper">
              <input
                className="nature-seek"
                type="range"
                min="0"
                max={dur || 0}
                step="1"
                value={Math.min(time, dur || 0)}
                onChange={(e) => seek(Number(e.target.value))}
                disabled={!ready}
                aria-label="Seek"
                style={{
                  background: `linear-gradient(to right, 
                    rgba(201, 149, 120, 0.8) 0%, 
                    rgba(201, 149, 120, 0.5) ${(time / (dur || 1)) * 100}%, 
                    rgba(255, 255, 255, 0.15) ${(time / (dur || 1)) * 100}%, 
                    rgba(255, 255, 255, 0.15) 100%)`
                }}
              />
              <div className="progress-markers">
                <span className="marker" style={{ left: '0%' }}>🌱</span>
                <span className="marker" style={{ left: '50%' }}>🍃</span>
                <span className="marker" style={{ left: '100%' }}>🌸</span>
              </div>
            </div>
            <div className="time-display">{fmt(dur)}</div>
          </div>

          {err && <div className="player-message">{err}</div>}
        </div>

        <div className="player-controls">
          <label className="volume-control">
            <span className="control-icon" title="Volume">♫</span>
            <input
              className="volume-slider"
              type="range"
              min="0" max="1" step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </label>
          <button
            className={`loop-btn ${loop ? "active" : ""}`}
            onClick={() => setLoop(v => !v)}
            aria-pressed={loop}
            title={loop ? "Loop enabled" : "Loop disabled"}
          >
            <span className="loop-icon">∞</span>
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
