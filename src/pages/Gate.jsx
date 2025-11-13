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

  function unlock(e) {
    e.preventDefault();

    // Safety check: if env variable missing
    if (!REAL_PASSWORD) {
      alert("Configuration error: Password not set.");
      console.error("VITE_GATE_PWD is missing!");
      return;
    }

    // Compare to env password
    if (pwd.trim() === REAL_PASSWORD.trim()) {
      sessionStorage.setItem("horbox_unlocked", "1");
      window.dispatchEvent(new Event("horbox:auth-change"));
      navigate("/home", { replace: true });
    } else {
      alert("Wrong password");
    }
  }

  return (
    <div className="gate">
      <form className="card" onSubmit={unlock}>
        <h2>Welcome</h2>
        <input
          type="password"
          className="input"
          placeholder="Enter password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <button className="btn" type="submit">Enter</button>
        <div className="hint">Private space for Ocin & Salma</div>
      </form>
    </div>
  );
}
