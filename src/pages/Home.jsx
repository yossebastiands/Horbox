import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ensureAuth,
  rtdb,
  rRef,
  onValue,
  push,
  query,
  orderByChild,
  limitToLast,
} from "../firebase";

import "../styles/home.css";
import "../styles/playlist.css";

/* -------------------------------
   Helpers
--------------------------------*/
const CURRENT_PL_KEY = "horbox_current_playlist";

function ytIdFromUrl(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname === "youtu.be") return u.pathname.replace("/", "");
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
      return u.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}


/* -------------------------------
   YouTube IFrame Player
--------------------------------*/
function YTPlayer({ videoId, onEnded, onTitle }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function create() {
      if (cancelled || !containerRef.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        width: "100%",
        height: "360",
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          controls: 1,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            try {
              const data = playerRef.current?.getVideoData?.();
              if (data?.title) onTitle?.(data.title, data.author);
            } catch {}
          },
          onStateChange: (e) => {
            // 1 = PLAYING; grab title again (covers when videoId changes)
            if (e.data === window.YT.PlayerState.PLAYING) {
              try {
                const data = playerRef.current?.getVideoData?.();
                if (data?.title) onTitle?.(data.title, data.author);
              } catch {}
            }
            if (e.data === window.YT.PlayerState.ENDED) onEnded?.();
          },
        },
      });
    }

    if (!window.YT?.Player) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        create();
      };
    } else {
      create();
    }

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (playerRef.current && videoId) {
      try {
        playerRef.current.loadVideoById(videoId);
      } catch {}
    }
  }, [videoId]);

  return <div ref={containerRef} className="yt-iframe" />;
}

/* -------------------------------
   Playlist Panel (left column)
--------------------------------*/
function PlaylistPanel() {
  const [playlists, setPlaylists] = useState([]);
  const [currentId, setCurrentId] = useState(
    () => sessionStorage.getItem(CURRENT_PL_KEY) || ""
  );

  // Create playlist form
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");

  // Add song form
  const [url, setUrl] = useState("");
  const [songTitle, setSongTitle] = useState(""); 
  const [by, setBy] = useState("Ocin");
  const [msg, setMsg] = useState("");

  // Songs of current playlist
  const [songs, setSongs] = useState([]);
  const [index, setIndex] = useState(0); // now playing index
  const [search, setSearch] = useState("");

  // Load playlists
  useEffect(() => {
    let off;
    (async () => {
      await ensureAuth();
      const q = query(
        rRef(rtdb, "playlists"),
        orderByChild("createdAt"),
        limitToLast(50)
      );
      off = onValue(q, (snap) => {
        const val = snap.val() || {};
        const rows = Object.entries(val).map(([id, v]) => ({
          id,
          title: v.title || "",
          description: v.description || "",
          createdAt: v.createdAt || 0,
        }));
        rows.sort((a, b) => b.createdAt - a.createdAt);
        setPlaylists(rows);
      });
    })();
    return () => off && off();
  }, []);

  // Persist selected playlist id
  useEffect(() => {
    if (currentId) sessionStorage.setItem(CURRENT_PL_KEY, currentId);
    else sessionStorage.removeItem(CURRENT_PL_KEY);
  }, [currentId]);

  // Load songs for current playlist
  useEffect(() => {
    if (!currentId) {
      setSongs([]);
      return;
    }
    let off;
    (async () => {
      await ensureAuth();
      const q = query(
        rRef(rtdb, `playlists/${currentId}/songs`),
        orderByChild("createdAt"),
        limitToLast(400)
      );
      off = onValue(q, (snap) => {
        const val = snap.val() || {};
        const rows = Object.entries(val).map(([id, v]) => ({
          id,
          videoId: v.videoId,
          url: v.url,
          addedBy: v.addedBy,
          message: v.message || "",
          title: v.title || "",        // <-- stored title (if fetched)
          authorName: v.authorName || "",
          createdAt: v.createdAt || 0,
        }));
        rows.sort((a, b) => b.createdAt - a.createdAt); // newest first
        setSongs(rows);
        setIndex(0);
      });
    })();
    return () => off && off();
  }, [currentId]);

  const currentPlaylist = useMemo(
    () => playlists.find((p) => p.id === currentId) || null,
    [playlists, currentId]
  );

  const filteredSongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((s) => {
      return (
        (s.title || "").toLowerCase().includes(q) ||
        (s.addedBy || "").toLowerCase().includes(q) ||
        (s.message || "").toLowerCase().includes(q) ||
        (s.videoId || "").toLowerCase().includes(q)
      );
    });
  }, [songs, search]);

  const now = filteredSongs[index] || null;

  async function handleCreatePlaylist(e) {
    e.preventDefault();
    const title = pTitle.trim();
    if (!title) return;
    try {
      await ensureAuth();
      const ref = await push(rRef(rtdb, "playlists"), {
        title,
        description: pDesc.trim(),
        createdAt: Date.now(),
      });
      setCurrentId(ref.key);
      setPTitle("");
      setPDesc("");
    } catch (err) {
      console.error(err);
      alert("Failed to create playlist.");
    }
  }

async function handleAddSong(e) {
  e.preventDefault();
  if (!currentId) return;

  const title = songTitle.trim();
  const vid = ytIdFromUrl(url);

  if (!title) return alert("Please enter a song title.");
  if (!vid)   return alert("Please enter a valid YouTube URL.");

  try {
    await ensureAuth();
    await push(rRef(rtdb, `playlists/${currentId}/songs`), {
      videoId: vid,
      url: url.trim(),
      title,              // <-- always store user-entered title
      addedBy: by,
      message: msg.trim(),
      createdAt: Date.now(),
    });

    // clear form
    setSongTitle("");
    setUrl("");
    setMsg("");
  } catch (err) {
    console.error(err);
    alert("Failed to add song.");
  }
}

  function nextTrack() {
    const nextI = index + 1;
    if (nextI < filteredSongs.length) setIndex(nextI);
  }

  return (
    <section className="card stretch playlist-card">
      <h2 className="card-title">Playlists</h2>

      {/* No playlists yet -> create */}
      {playlists.length === 0 && (
        <form className="playlist-form" onSubmit={handleCreatePlaylist}>
          <p className="muted">Buat musik playlist dulu.</p>
          <label className="field">
            <span>Playlist Title</span>
            <input
              value={pTitle}
              onChange={(e) => setPTitle(e.target.value)}
              placeholder="e.g., Musik Dansa dengan Salma"
              required
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              rows="3"
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
              placeholder="Tentang apa playlistnya…"
            />
          </label>
          <div className="actions">
            <button className="btn">Create</button>
          </div>
        </form>
      )}

      {/* Choose a playlist */}
      {playlists.length > 0 && !currentPlaylist && (
        <div className="playlist-chooser">
          <p className="muted">Choose an existing playlist or create a new one.</p>
          <div className="chooser-list">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                className="row-btn"
                title={pl.description}
                onClick={() => setCurrentId(pl.id)}
              >
                <div className="row-title">{pl.title}</div>
                <div className="row-meta">
                  {new Date(pl.createdAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>

          <details className="create-inline">
            <summary>+ Create new playlist</summary>
            <form className="playlist-form" onSubmit={handleCreatePlaylist}>
              <label className="field">
                <span>Playlist Title</span>
                <input
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  placeholder="e.g., Ocin & Salma Dance Songs"
                  required
                />
              </label>
              <label className="field">
                <span>Description</span>
                <textarea
                  rows="3"
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  placeholder="Playlistnya tentang apa…"
                />
              </label>
              <div className="actions">
                <button className="btn soft">Create</button>
              </div>
            </form>
          </details>
        </div>
      )}

      {/* Current playlist view */}
      {currentPlaylist && (
        <>
          <div className="playlist-header">
            <div className="header-text">
              <h3 className="pl-title">{currentPlaylist.title}</h3>
              {currentPlaylist.description && (
                <p className="muted">{currentPlaylist.description}</p>
              )}
            </div>
            <button className="btn ghost" onClick={() => setCurrentId("")}>
              Change
            </button>
          </div>



<div className="playlist-main">
  {/* Left side — YouTube player + Now Playing info */}
  <div className="player">
    {now ? (
      <>
        <YTPlayer videoId={now.videoId} onEnded={nextTrack} />

        <div className="np-meta" role="status" aria-live="polite">
          <div className="np-title">{now.title?.trim() || now.videoId}</div>
          <div className="np-line small">
            “{now.message || "No message"}” · by{" "}
            <strong>{now.addedBy}</strong> ·{" "}
            <time dateTime={new Date(now.createdAt).toISOString()}>
              {new Date(now.createdAt).toLocaleString()}
            </time>
          </div>
        </div>

        <div className="np-actions">
          <button
            className="btn next"
            onClick={nextTrack}
            type="button"
            aria-label="Play next song"
          >
            Next ▶
          </button>
        </div>
      </>
    ) : (
      <p className="muted">No songs yet. Add one on the right.</p>
    )}
  </div>

  {/* Collapsible Add Song panel */}
  <details className="add-song-panel">
    <summary>＋ Add a Song</summary>

    <form className="add-song" onSubmit={handleAddSong}>
      <label className="field">
        <span>Title</span>
        <input
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          placeholder="e.g., Ocin - Love Salma"
          required
        />
      </label>

      <label className="field">
        <span>YouTube URL</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          required
        />
      </label>

      <label className="field">
        <span>Added By</span>
        <select value={by} onChange={(e) => setBy(e.target.value)}>
          <option>Ocin</option>
          <option>Salma</option>
        </select>
      </label>

      <label className="field">
        <span>Message</span>
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Why this song?"
        />
      </label>

      <div className="actions">
        <button className="btn" type="submit">
          Add
        </button>
      </div>
    </form>
  </details>
</div>

          {/* Search box */}
          <div className="song-search">
            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, message, or added by…"
            />
          </div>

<div className="song-list card-sub">
  <h4>Playlist Songs (Newest first)</h4>

  {filteredSongs.length === 0 ? (
    <p className="muted">No results.</p>
  ) : (
    <ul className="songs" role="list">
      {filteredSongs.map((s, i) => {
        const isActive = i === index;
        const title = (s.title && s.title.trim()) || s.videoId;

        return (
          <li
            key={s.id}
            className={`song ${isActive ? "active" : ""}`}
            aria-current={isActive ? "true" : undefined}
          >
            <button
              className="link song-title"
              title={title}
              onClick={() => setIndex(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIndex(i);
                }
              }}
            >
              {isActive ? "▶ " : ""}
              {title}
            </button>

            <span className="by">by {s.addedBy}</span>

            {s.message && (
              <span className="msg"> — “{s.message}”</span>
            )}

            <time className="time">
              {new Date(s.createdAt).toLocaleString()}
            </time>
          </li>
        );
      })}
    </ul>
  )}
</div>

        </>
      )}
    </section>
  );
}

/* -------------------------------
   RIGHT column: Message Board (unchanged)
--------------------------------*/
export default function Home() {
  const [author, setAuthor] = useState("Ocin");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("horbox_unlocked") !== "1") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let off;
    (async () => {
      await ensureAuth();
      const q = query(
        rRef(rtdb, "messages"),
        orderByChild("createdAt"),
        limitToLast(50)
      );
      off = onValue(q, (snap) => {
        const val = snap.val() || {};
        const rows = Object.entries(val).map(([id, v]) => ({
          id,
          text: v.text || "",
          author: v.author || "Unknown",
          createdAt: v.createdAt ? new Date(v.createdAt) : null,
        }));
        rows.sort(
          (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
        );
        setMessages(rows);
      });
    })();
    return () => off && off();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await ensureAuth();
      await push(rRef(rtdb, "messages"), {
        author,
        text: trimmed,
        createdAt: Date.now(),
      });
      setText("");
    } catch (err) {
      console.error(err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="home">
      <main className="page grid-2">
        <PlaylistPanel />

        <section className="card stretch">
          <h2 className="card-title">Message Board</h2>

          <form onSubmit={handleSubmit} className="composer-form">
            <label className="field">
              <span>Writer</span>
              <select
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              >
                <option>Ocin</option>
                <option>Salma</option>
              </select>
            </label>

            <label className="field">
              <span>Message</span>
              <textarea
                rows="4"
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write something sweet… or honest... :))"
              />
              <div className="hint">{text.length}/1000</div>
            </label>

            <div className="actions">
              <button
                type="submit"
                className="btn"
                disabled={sending || !text.trim()}
              >
                {sending ? "Sending…" : "Post"}
              </button>
            </div>
          </form>

          <ul className="feed">
            {messages.map((m) => (
              <li key={m.id} className={`msg ${m.author.toLowerCase()}`}>
                <header className="meta">
                  <span className="author">{m.author}</span>
                  <span className="dot">•</span>
                  <time className="time">
                    {m.createdAt ? m.createdAt.toLocaleString() : "just now"}
                  </time>
                </header>
                <p className="text">{m.text}</p>
              </li>
            ))}
            {messages.length === 0 && (
              <li className="empty card">No messages yet. Be the first!</li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
