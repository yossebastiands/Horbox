import { useState, useMemo } from "react";
import "../styles/ourassets.css";
import QuickMessageBox from "../components/QuickMessageBox.jsx";

// Hardcoded list of links
const ASSETS = [
  {
    id: 1,
    label: "Project Horithm",
    url: "https://docs.google.com/spreadsheets/d/1QHmx6Z4_5UPOdwxLhacGDr-r3-pGB6vPyJWC5-V__P8/edit?gid=0#gid=0",
    category: "Spreadsheet",
    note: "Projek menyanyi untuk Salma"
  },
  {
    id: 2,
    label: "Project Bloxfun",
    url: "https://docs.google.com/spreadsheets/d/1HA899DuTmuqZy_deNZ4iQZsNPcw1h24ZAbUyElbK-yg/edit?gid=0#gid=0",
    category: "Spreadsheet",
    note: "Wishlist main Roblox bareng Salma"
  },
  {
    id: 3,
    label: "Project Salmoon",
    url: "https://docs.google.com/spreadsheets/d/134DHaX2xLGppiLvFUtIKx_gEF-qD3KcOS3oMKgLLO_Q/edit?gid=0#gid=0",
    category: "Spreadsheet",
    note: "Collaborative drawing bareng Salma"
  },
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
    <>
      <QuickMessageBox />
      <div className="page assets-page">
        <section className="assets-container">
          {/* Header Section */}
          <header className="assets-header">
            <div className="header-content">
              <h1 className="page-title">Our Assets</h1>
              <p className="page-subtitle">A collection of our shared projects and treasured memories</p>
            </div>
          </header>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="search"
                className="search-input"
                placeholder="Search by name, category, or note..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query.trim() !== "" && (
                <button 
                  className="search-clear" 
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Result Count */}
            <div className="search-meta">
              <span className="result-count">
                {filteredAssets.length === ASSETS.length 
                  ? `${ASSETS.length} ${ASSETS.length === 1 ? 'item' : 'items'}` 
                  : `${filteredAssets.length} of ${ASSETS.length} items`}
              </span>
              {query && <span className="search-query">matching "{query}"</span>}
            </div>
          </div>

          {/* Assets Grid */}
          <div className="assets-grid">
            {filteredAssets.map((item) => (
              <article key={item.id} className="asset-card">
                <div className="card-content">
                  <div className="card-top">
                    <h2 className="asset-title">{item.label}</h2>
                    <span className="category-badge">{item.category}</span>
                  </div>

                  {item.note && (
                    <p className="asset-description">{item.note}</p>
                  )}
                </div>

                <a
                  href={item.url}
                  className="asset-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Visit</span>
                  <span className="link-arrow">→</span>
                </a>
              </article>
            ))}

            {filteredAssets.length === 0 && (
              <div className="empty-message">
                <span className="empty-icon">🌸</span>
                <p>No matching items found</p>
                <button className="btn-reset" onClick={() => setQuery("")}>Clear search</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
