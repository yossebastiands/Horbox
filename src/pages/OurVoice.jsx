import { useEffect, useRef, useState } from "react";
import "../styles/styles.css";

// ⬇️ Adjust if your firebase exports are elsewhere
import { db, storage } from "../lib/firebase";
import {
  collection, addDoc, serverTimestamp, query, orderBy, limit, startAfter, getDocs
} from "firebase/firestore";
import {
  ref as sRef, uploadBytesResumable, getDownloadURL
} from "firebase/storage";

export default function OurVoice() {
  const [by, setBy] = useState("Ocin");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recBlob, setRecBlob] = useState(null);
  const [recUrl, setRecUrl] = useState("");
  const [recStatus, setRecStatus] = useState("Idle");
  const [duration, setDuration] = useState(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [memos, setMemos] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [qText, setQText] = useState("");

  const mediaRecorderRef = useRef(null);
  const recTimerRef = useRef(null);
  const startTimeRef = useRef(0);

  // ---------- Helpers
  const fmt = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  };

  const pickDurationFromAudio = (urlOrBlob) =>
    new Promise((resolve) => {
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => resolve(Math.round(a.duration));
      a.src = typeof urlOrBlob === "string" ? urlOrBlob : URL.createObjectURL(urlOrBlob);
    });

  // ---------- Recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop
      setRecStatus("Stopping…");
      mediaRecorderRef.current?.stop();
      clearInterval(recTimerRef.current);
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setRecBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecUrl(url);
        setRecStatus("Recorded");
        const secs = await pickDurationFromAudio(blob);
        setDuration(secs);
        // stop tracks
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start();
      setIsRecording(true);
      setRecStatus("Recording…");
      startTimeRef.current = Date.now();
      recTimerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecStatus(`Recording… ${s}s`);
      }, 500);
    } catch (err) {
      console.error(err);
      setRecStatus("Mic permission denied");
    }
  };

  // ---------- Upload (file OR recBlob)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const srcBlob = recBlob || file;
    if (!srcBlob) {
      alert("Choose a file or record a note first.");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // Duration if not known (for uploaded files)
      let dur = duration;
      if (!dur) dur = await pickDurationFromAudio(srcBlob);

      // Create storage path
      const stamp = Date.now();
      const ext = recBlob ? "webm" : (file?.name?.split(".").pop() || "dat");
      const path = `ourvoice/${by}/${stamp}.${ext}`;

      const storageRef = sRef(storage, path);
      const task = uploadBytesResumable(storageRef, srcBlob);

      await new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setProgress(pct);
          },
          reject,
          resolve
        );
      });

      const url = await getDownloadURL(task.snapshot.ref);

      await addDoc(collection(db, "voiceMemos"), {
        by,
        message,
        url,
        duration: dur,          // seconds
        storagePath: path,
        createdAt: serverTimestamp(),
      });

      // reset UI
      setMessage("");
      setFile(null);
      setRecBlob(null);
      setRecUrl("");
      setDuration(null);
      setProgress(0);
      setLoading(false);

      // refresh list head
      setMemos([]);
      setLastDoc(null);
      setHasMore(true);
      await loadMore(true);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check console.");
      setLoading(false);
    }
  };

  // ---------- Listing (paged)
  const PAGE = 10;

  const loadMore = async (replace = false) => {
    if (!hasMore && !replace) return;
    const baseQ = query(
      collection(db, "voiceMemos"),
      orderBy("createdAt", "desc"),
      limit(PAGE),
      ...(lastDoc && !replace ? [startAfter(lastDoc)] : [])
    );
    const snap = await getDocs(baseQ);
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (replace) {
      setMemos(rows);
    } else {
      setMemos(prev => prev.concat(rows));
    }
    setLastDoc(snap.docs[snap.docs.length - 1] || null);
    setHasMore(snap.size === PAGE);
  };

  useEffect(() => { loadMore(true); /* initial */ }, []);

  // ---------- Derived (search)
  const filtered = memos.filter(m =>
    (m.by || "").toLowerCase().includes(qText.toLowerCase()) ||
    (m.message || "").toLowerCase().includes(qText.toLowerCase())
  );

  return (
    <div className="page wrap">
      <header className="page-head">
        <h1 className="card-title">OurVoice</h1>
        <p className="muted">Share little voice notes—kept in a safe jar.</p>
      </header>

      <section className="grid-2">
        {/* Uploader */}
        <div className="card">
          <h3 className="card-title">Drop a new voice note</h3>

          <form onSubmit={handleSubmit} className="form vgap">
            <div className="grid-2">
              <label>
                <span className="muted">By</span>
                <select value={by} onChange={e => setBy(e.target.value)}>
                  <option>Ocin</option>
                  <option>Salma</option>
                </select>
              </label>

              <label>
                <span className="muted">Message (optional)</span>
                <input
                  maxLength={300}
                  placeholder="Write something sweet…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </label>
            </div>

            <div className="uibox">
              <div className="fileBox">
                <span className="muted">Upload</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setFile(f || null);
                    setRecBlob(null);
                    setRecUrl("");
                    setDuration(null);
                  }}
                />
              </div>

              <div className="recBox">
                <span className="muted">Or record</span>
                <div className="row">
                  <button type="button" className="btn" onClick={toggleRecording}>
                    {isRecording ? "■ Stop Recording" : "● Start Recording"}
                  </button>
                  <small className="muted" style={{ marginLeft: 8 }}>{recStatus}</small>
                </div>
                {recUrl && (
                  <audio src={recUrl} controls preload="metadata" style={{ marginTop: 8 }} />
                )}
              </div>
            </div>

            <div className="row aic">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Uploading…" : "Post"}
              </button>
              {loading && (
                <div className="progress" style={{ marginLeft: 12, width: 160 }}>
                  <div className="bar" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="card">
          <div className="row between aic">
            <h3 className="card-title">Voice Memos</h3>
            <input
              className="search"
              placeholder="Search name or message…"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              style={{ maxWidth: 280 }}
            />
          </div>

          <ul className="memos vgap">
            {filtered.map(m => (
              <li key={m.id} className="memo">
                <div className="memo__head">
                  <span className="pill">{m.by}</span>
                  <span className="muted">• {fmt(m.createdAt)}</span>
                  {m.duration != null && <span className="muted"> • {m.duration}s</span>}
                </div>
                {m.message && <p className="memo__msg">{m.message}</p>}
                <audio controls preload="none">
                  {/* prefer Opus/WebM if you encode that; mp3 will still play */}
                  <source src={m.url} />
                </audio>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="row">
              <button className="btn" onClick={() => loadMore(false)}>Load more</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
