import { useState, useMemo } from "react";
import "../styles/ourassets.css"; // make sure the CSS file exists

// Hardcoded list of links
const ASSETS = [
  {
    id: 1,
    label: "Project Horithm",
    url: "https://your-horbox.netlify.app",
    category: "Spreadsheet",
    note: "Projek menyanyi untuk Salma"
  }

  // Add more as you want
];

export default function OurAssets() {
  const [query, setQuery] = useState("");

  const filteredAssets = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return ASSETS;

    return ASSETS.filter((item) =>
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q) ||
      (item.note && item.note.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="page assets-page">
      <section className="assets-card">
        <h1>Our Assets</h1>
        <p className="subtitle">Our little directory of shared projects and memories.</p>

        {/* ---------- Search Bar ---------- */}
        <div className="assets-search">
          <input
            type="search"
            className="input"
            placeholder="Search by name, category, note, or URL..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.trim() !== "" && (
            <button className="btn ghost sm" onClick={() => setQuery("")}>
              Clear
            </button>
          )}
        </div>

        {/* ---------- Result Count ---------- */}
        <div className="assets-meta">
          Showing {filteredAssets.length} of {ASSETS.length}
          {query && ` results for "${query}"`}
        </div>

        {/* ---------- Assets List ---------- */}
        <div className="assets-list">
          {filteredAssets.map((item) => (
            <article key={item.id} className="asset-item">
              <div className="asset-header">
                <h2>{item.label}</h2>
                <span className="asset-tag">{item.category}</span>
              </div>

              {item.note && <p className="asset-note">{item.note}</p>}

              <a
                href={item.url}
                className="btn pill"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Link
              </a>
            </article>
          ))}

          {filteredAssets.length === 0 && (
            <p className="empty-state">No matching assets. Try a different keyword.</p>
          )}
        </div>
      </section>
    </div>
  );
}
