import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import OurSpace from "./pages/OurSpace.jsx";
import FirstAid from "./pages/FirstAid.jsx";
import Rest from "./pages/Rest.jsx";
import Gate from "./pages/Gate.jsx";
import OurAssets from "./pages/OurAssets.jsx"; // new page
import OurGallery from "./pages/OurGallery.jsx";
import BackgroundVideo from "./components/BackgroundVideo.jsx";

/* -------------------------------
   Track login/unlock state
--------------------------------*/
function useUnlocked() {
  const [unlocked, setUnlocked] = useState(
    sessionStorage.getItem("horbox_unlocked") === "1"
  );

  useEffect(() => {
    const onChange = () =>
      setUnlocked(sessionStorage.getItem("horbox_unlocked") === "1");
    window.addEventListener("storage", onChange);
    window.addEventListener("horbox:auth-change", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("horbox:auth-change", onChange);
    };
  }, []);

  return unlocked;
}

/* -------------------------------
   Guard: Redirect to login if locked
--------------------------------*/
function RequireAuth({ children }) {
  return sessionStorage.getItem("horbox_unlocked") === "1" ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}

/* -------------------------------
   Main App
--------------------------------*/
export default function App() {
  const unlocked = useUnlocked();
  const navigate = useNavigate();
  const [solid, setSolid] = useState(false);

  // Lite mode: true = static BG01.jpg, false = MP4 video
  const [lite, setLite] = useState(
    () => localStorage.getItem("horbox_lite") === "1"
  );

  // Persist lite mode
  useEffect(() => {
    localStorage.setItem("horbox_lite", lite ? "1" : "0");
  }, [lite]);

  // Detect scroll to toggle .solid class
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll(); // initial
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Background reacts to lite mode */}
      <BackgroundVideo lite={lite} />

      {/* ---------------- NAVBAR ---------------- */}
      {unlocked && (
        <header className={`topbar ${solid ? "solid" : ""}`}>
          <div className="brand">Horbox</div>

          <nav className="nav-actions">
            <Link to="/home" className="btn ghost">
              Home
            </Link>
            <Link to="/our-space" className="btn">
              Our Space
            </Link>
            <Link to="/our-assets" className="btn soft">
              Our Assets
            </Link>
            <Link to="/first-aid" className="btn soft">
              First Aid
            </Link>
            <Link to="/rest" className="btn">
              Rest
            </Link>
            <Link to="/our-gallery" className="btn soft">
              Our Gallery
            </Link>

            {/* LITE MODE TOGGLE */}
            <button
              type="button"
              className={`btn soft pill lite-toggle ${lite ? "active" : ""}`}
              onClick={() => setLite((prev) => !prev)}
              title={lite ? "Switch to full video mode" : "Switch to lite mode"}
            >
              {lite ? "Video On" : "Lite Mode"}
            </button>

            <button
              className="btn pill"
              onClick={() => {
                sessionStorage.removeItem("horbox_unlocked");
                window.dispatchEvent(new Event("horbox:auth-change"));
                navigate("/", { replace: true });
              }}
            >
              Logout
            </button>
          </nav>
        </header>
      )}

      {/* ---------------- ROUTES ---------------- */}
      <main className="page">
        <Routes>
          {/* Login / Password Gate */}
          <Route path="/" element={<Gate />} />

          {/* Protected Pages */}
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/our-space"
            element={
              <RequireAuth>
                <OurSpace />
              </RequireAuth>
            }
          />
          <Route
            path="/our-assets"
            element={
              <RequireAuth>
                <OurAssets />
              </RequireAuth>
            }
          />
          <Route
            path="/first-aid"
            element={
              <RequireAuth>
                <FirstAid />
              </RequireAuth>
            }
          />
          <Route
            path="/rest"
            element={
              <RequireAuth>
                <Rest />
              </RequireAuth>
            }
          />
          <Route
            path="/our-gallery"
            element={
              <RequireAuth>
                <OurGallery />
              </RequireAuth>
            }
          />

          {/* Fallback Routes */}
          <Route
            path="/index.html"
            element={<Navigate to={unlocked ? "/home" : "/"} replace />}
          />
          <Route
            path="*"
            element={<Navigate to={unlocked ? "/home" : "/"} replace />}
          />
        </Routes>
      </main>

      {/* ---------------- FOOTER ---------------- */}
      {unlocked && (
        <footer className="site-footer">
          © {new Date().getFullYear()} Horbox — with <span>❤️</span>
        </footer>
      )}
    </>
  );
}
