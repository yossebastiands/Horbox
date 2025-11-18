// src/pages/OurGallery.jsx
import { useEffect, useMemo, useState } from "react";
import "../styles/ourgallery.css";

const IMAGES = [
  {
    id: 1,
    kind: "image",
    thumb: "/gallery/thumb/001.png",
    full: "/gallery/full/001.png",
    title: "Yosin holding small Hori",
    note: "Kamu kasih aku bonekamu",
    date: "2025-11-18",
  },
  {
    id: 2,
    kind: "image",
    thumb: "/gallery/thumb/002.png",
    full: "/gallery/full/002.png",
    title: "Yosin gambar buat Hori",
    note: "Gambaran romantis tentang Yosin dan Salma ditandatangani oleh Salma",
    date: "2025-11-02",
  },
  {
    id: 3,
    kind: "image",
    thumb: "/gallery/thumb/003.png",
    full: "/gallery/full/003.png",
    title: "Yosin gambar buat Hori (Full Result)",
    note: "Gambaran romantis tentang Yosin dan Salma di Spray Paint Map",
    date: "2025-11-02",
  },
  {
    id: 4,
    kind: "image",
    thumb: "/gallery/thumb/004.png",
    full: "/gallery/full/004.png",
    title: "Kata Salma, Yosin Lucu :3",
    note: "Gambaran romantis tentang Yosin dan Salma di Spray Paint Map",
    date: "2025-11-02",
  },
  {
    id: 5,
    kind: "image",
    thumb: "/gallery/thumb/005.png",
    full: "/gallery/full/005.png",
    title: "Yosin sama Hori di Gunung Yasahbar",
    note: "Foto di summit",
    date: "2025-11-16",
  },
  {
    id: 6,
    kind: "image",
    thumb: "/gallery/thumb/006.png",
    full: "/gallery/full/006.png",
    title: "Yosin dan Salma (Part 1)",
    note: "Hari di mana hubungan kita tambah kuat",
    date: "2025-11-17",
  },
  {
    id: 7,
    kind: "image",
    thumb: "/gallery/thumb/007.png",
    full: "/gallery/full/007.png",
    title: "Yosin dan Salma (Part 2)",
    note: "Hari di mana hubungan kita tambah kuat",
    date: "2025-11-16",
  },
  {
    id: 8,
    kind: "image",
    thumb: "/gallery/thumb/008.png",
    full: "/gallery/full/008.png",
    title: "Yosin dan Salma (Part 3)",
    note: "Hari di mana hubungan kita tambah kuat",
    date: "2025-11-16",
  },
  {
    id: 9,
    kind: "image",
    thumb: "/gallery/thumb/009.jpg",
    full: "/gallery/full/009.jpg",
    title: "Selfie Yosin",
    note: "Buat Salma",
    date: "2025-11-16",
  },
  {
    id: 10,
    kind: "image",
    thumb: "/gallery/thumb/010.png",
    full: "/gallery/full/010.png",
    title: "Yosin dan Salma foto di taman bunga matahari",
    note: "Buat Salma",
    date: "2025-11-16",
  },
  {
    id: 11,
    kind: "video",
    thumb: "/gallery/thumb/010.jpg",
    full: "/gallery/video/010.mp4",
    title: "Clip Test",
    note: "Desc.",
    date: "2025-11-15",
  },
];

const PAGE_SIZE = 18;

export default function OurGallery() {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("latest"); // latest, oldest, title-az, title-za

  // Filter + sort
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    let list = IMAGES;
    if (q) {
      list = IMAGES.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(q);
        const inNote = item.note?.toLowerCase().includes(q);
        const inDate = item.date?.toLowerCase().includes(q);
        return inTitle || inNote || inDate;
      });
    }

    const sorted = [...list].sort((a, b) => {
      switch (sortKey) {
        case "latest":
          return new Date(b.date) - new Date(a.date);
        case "oldest":
          return new Date(a.date) - new Date(b.date);
        case "title-az":
          return a.title.localeCompare(b.title);
        case "title-za":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [query, sortKey]);

  // Reset visible when query/sort changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, sortKey]);

  const visibleImages = filtered.slice(0, visible);
  const canLoadMore = visible < filtered.length;

  // ESC closes modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="gallery-page">
      <section className="card gallery-card">
        <header className="gallery-header">
          <div>
            <h1>Our Gallery</h1>
            <p className="muted">
              Screenshots, photos, videos — little pieces of us.
            </p>
          </div>

          <div className="gallery-tools">
            <div className="gallery-meta">
              <span>{filtered.length} memories</span>
            </div>

            <div className="gallery-controls">
              <input
                type="text"
                className="input gallery-search"
                placeholder="Search by title, note, or date..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="input gallery-sort"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="latest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title-az">Title A–Z</option>
                <option value="title-za">Title Z–A</option>
              </select>
            </div>
          </div>
        </header>

        <div className="gallery-grid">
          {visibleImages.map((item) => (
            <figure
              key={item.id}
              className="gallery-item"
              onClick={() => setActive(item)}
            >
              <div className="gallery-thumb-wrap">
                <img
                  src={item.thumb}
                  alt={item.title}
                  loading="lazy"
                  className="gallery-thumb"
                />
                {item.kind === "video" && (
                  <div className="gallery-badge-play">▶</div>
                )}
              </div>
              <figcaption>
                <div className="gallery-title">{item.title}</div>
                {item.note && <div className="gallery-note">{item.note}</div>}
                {item.date && (
                  <div className="gallery-date">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                )}
              </figcaption>
            </figure>
          ))}
        </div>

        {canLoadMore && (
          <div className="gallery-loadmore-wrap">
            <button
              className="btn soft"
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
            >
              Load more memories
            </button>
          </div>
        )}
      </section>

      {/* Modal */}
      {active && (
        <div className="gallery-modal" onClick={() => setActive(null)}>
          <div
            className="gallery-modal-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="gallery-close"
              onClick={() => setActive(null)}
            >
              ×
            </button>

            {active.kind === "video" ? (
              <video
                className="gallery-full"
                src={active.full}
                autoPlay
                loop
                muted
                playsInline
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={active.full}
                alt={active.title}
                className="gallery-full"
              />
            )}

            <div className="gallery-modal-info">
              <h2>{active.title}</h2>
              {active.note && <p>{active.note}</p>}
              {active.date && (
                <div className="gallery-date">
                  {new Date(active.date).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
