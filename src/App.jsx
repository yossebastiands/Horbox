import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { ToastContainer } from "./components/Toast.jsx";
import BackgroundVideo from "./components/BackgroundVideo.jsx";

// Lazy load route components
const Gate = lazy(() => import("./pages/Gate.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const OurSpace = lazy(() => import("./pages/OurSpace.jsx"));
const FirstAid = lazy(() => import("./pages/FirstAid.jsx"));
const Rest = lazy(() => import("./pages/Rest.jsx"));
const OurAssets = lazy(() => import("./pages/OurAssets.jsx"));
const OurGallery = lazy(() => import("./pages/OurGallery.jsx"));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
    <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
      <p className="muted">Loading...</p>
    </div>
  </div>
);

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

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("horbox_unlocked");
    window.dispatchEvent(new Event("horbox:auth-change"));
    navigate("/", { replace: true });
  }, [navigate]);

  const toggleLiteMode = useCallback(() => {
    setLite(prev => !prev);
  }, []);

  return (
    <ErrorBoundary>
      <ToastContainer />
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
            <Link to="/rest" className="btn">
              Rest
            </Link>
            <Link to="/our-assets" className="btn soft">
              Our Assets
            </Link>
            <Link to="/our-gallery" className="btn soft">
              Our Gallery
            </Link>
            <Link to="/first-aid" className="btn soft">
              First Aid
            </Link>
            <Link to="/our-space" className="btn">
              About Us
            </Link>

            {/* LITE MODE TOGGLE */}
            <button
              type="button"
              className={`btn soft pill lite-toggle ${lite ? "active" : ""}`}
              onClick={toggleLiteMode}
              title={lite ? "Switch to full video mode" : "Switch to lite mode"}
              aria-pressed={lite}
              aria-label={lite ? "Switch to video mode" : "Switch to lite mode"}
            >
              {lite ? "Video On" : "Lite Mode"}
            </button>

            <button
              className="btn pill"
              onClick={handleLogout}
              aria-label="Logout"
            >
              Logout
            </button>
          </nav>
        </header>
      )}

      {/* ---------------- ROUTES ---------------- */}
      <main className="page">
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </main>

      {/* ---------------- FOOTER ---------------- */}
      {unlocked && (
        <footer className="site-footer">
          © {new Date().getFullYear()} Horbox — with <span>❤️</span>
        </footer>
      )}
    </ErrorBoundary>
  );
}
