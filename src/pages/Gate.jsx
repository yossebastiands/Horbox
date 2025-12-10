// Gate.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/gate.css";

export default function Gate() {
  const [pwd, setPwd] = useState("");
  const navigate = useNavigate();

  // Load password from environment variable
  const REAL_PASSWORD = import.meta.env.VITE_GATE_PWD;

  useEffect(() => {
    if (sessionStorage.getItem("horbox_unlocked") === "1") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const [error, setError] = useState("");

  function unlock(e) {
    e.preventDefault();
    setError("");

    // Safety check: if env variable missing
    if (!REAL_PASSWORD) {
      setError("Configuration error: Password not set. Please contact administrator.");
      return;
    }

    // Compare to env password
    if (pwd.trim() === REAL_PASSWORD.trim()) {
      sessionStorage.setItem("horbox_unlocked", "1");
      window.dispatchEvent(new Event("horbox:auth-change"));
      navigate("/home", { replace: true });
    } else {
      setError("Incorrect password. Please try again.");
      setPwd("");
    }
  }

  return (
    <div className="gate">
      <form className="card" onSubmit={unlock}>
        <h2>Welcome</h2>
        {error && (
          <div style={{ 
            padding: "10px", 
            marginBottom: "12px", 
            background: "rgba(255, 100, 100, 0.2)", 
            border: "1px solid rgba(255, 100, 100, 0.4)",
            borderRadius: "8px",
            color: "#ffcccc"
          }}>
            {error}
          </div>
        )}
        <input
          type="password"
          className="input"
          placeholder="Enter password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          aria-label="Password"
          autoFocus
        />
        <button className="btn" type="submit" aria-label="Enter Horbox">Enter</button>
        <div className="hint">Private space for Ocin & Salma</div>
      </form>
    </div>
  );
}
