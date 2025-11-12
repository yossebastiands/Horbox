import { useEffect, useRef, useState } from "react";

export default function GlobalAudio({
  src = "/audio/song.mp3",
  title = "Our Song",
}) {
  const audioRef = useRef(null);
  const [show, setShow] = useState(true);          // collapse/expand UI
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(
    Number(localStorage.getItem("horbox_audio_vol") ?? 0.4)
  );

  // Restore position & play state
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.volume = volume;

    const saved = JSON.parse(localStorage.getItem("horbox_audio_state") || "{}");
    if (saved.src === src) {
      if (typeof saved.t === "number") a.currentTime = saved.t;
      if (saved.playing) {
        // Browser autoplay policies: this will work after a user gesture (e.g., clicking play once)
        a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
    }

    const onTime = () => {
      localStorage.setItem(
        "horbox_audio_state",
        JSON.stringify({ src, t: a.currentTime, playing })
      );
    };
    const id = setInterval(onTime, 1000);
    return () => clearInterval(id);
  }, [src]); // eslint-disable-line

  // Persist volume
  useEffect(() => {
    localStorage.setItem("horbox_audio_vol", String(volume));
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        // user gesture required; UI remains ready
      }
    }
  };

  return (
    <>
      <audio ref={audioRef} src={src} preload="auto" />
      <div className={`audio-fab ${show ? "" : "collapsed"}`}>
        <button className="btn-ghost" onClick={() => setShow(s => !s)} aria-label="Toggle player">
          {show ? "▾" : "▴"}
        </button>

        {show && (
          <>
            <button className="btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
              {playing ? "⏸" : "▶️"}
            </button>
            <span className="title" title={title}>{title}</span>
            <input
              className="vol"
              type="range"
              min="0" max="1" step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </>
        )}
      </div>
    </>
  );
}
