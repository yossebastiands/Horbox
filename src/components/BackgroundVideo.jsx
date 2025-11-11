import { useEffect, useRef } from "react";

export default function BackgroundVideo() {
  const ref = useRef(null);

  useEffect(() => {
    const onVis = () => {
      const v = ref.current;
      if (!v) return;
      if (document.hidden) v.pause();
      else v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <>
      <video
        ref={ref}
        className="bg-video"
        src="/BGMain.mp4"
        autoPlay muted loop playsInline preload="auto"
        poster="/bg.jpg"
      />
      <div className="bg-overlay" />
    </>
  );
}
