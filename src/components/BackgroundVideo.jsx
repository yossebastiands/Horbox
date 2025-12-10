import { useEffect, useRef, memo } from "react";

function BackgroundVideo({ lite = false }) {
  const ref = useRef(null);

  // Only attach video visibility handlers when NOT in lite mode
  useEffect(() => {
    if (lite) return;

    const onVis = () => {
      const v = ref.current;
      if (!v) return;
      if (document.hidden) v.pause();
      else v.play().catch(() => {});
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [lite]);

  if (lite) {
    // Lite mode: static image background only
    return (
      <>
        <div className="bg-static bg-static-lite" aria-hidden="true" />
        <div className="bg-overlay" />
      </>
    );
  }

  // Normal mode: video background
  return (
    <>
      <video
        ref={ref}
        className="bg-video"
        src="/BGMain.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/BG01.jpg"
        aria-hidden="true"
      />
      <div className="bg-overlay" aria-hidden="true" />
    </>
  );
}

export default memo(BackgroundVideo);
