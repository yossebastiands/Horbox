import { useEffect, useState, memo } from "react";
import { ensureAuth, rtdb, rRef, onValue, push, query, orderByChild, limitToLast } from "../firebase";

function QuickMessageBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [author, setAuthor] = useState("Ocin");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [displayCount, setDisplayCount] = useState(5);

  useEffect(() => {
    let off;
    (async () => {
      await ensureAuth();
      const q = query(
        rRef(rtdb, "messages"),
        orderByChild("createdAt"),
        limitToLast(50) // Load last 50 messages but only display 5 initially
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
  
  const formatDateTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };
  
  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 10, messages.length));
  };

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
    } finally {
      setSending(false);
    }
  }

  const visibleMessages = messages.slice(0, displayCount);
  const hasMore = displayCount < messages.length;

  return (
    <div className="quick-message-box">
      <button
        className="qmb-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close messages" : "Open messages"}
      >
        💬 {isOpen ? "Hide Messages" : "Open Messages"}
      </button>

      {isOpen && (
        <div className="qmb-content">
          <div className="qmb-header">
            <h4>Messages ({messages.length})</h4>
            <button
              className="qmb-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="qmb-form">
            <select
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="qmb-select"
            >
              <option>Ocin</option>
              <option>Salma</option>
            </select>

            <textarea
              rows="2"
              maxLength={500}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a quick message..."
              className="qmb-textarea"
            />

            <button
              type="submit"
              className="qmb-submit"
              disabled={sending || !text.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>

          <div className="qmb-messages">
            {visibleMessages.map((m) => (
              <div key={m.id} className={`qmb-msg ${m.author.toLowerCase()}`}>
                <div className="qmb-msg-header">
                  <strong>{m.author}</strong>
                  <span className="qmb-msg-time">
                    {formatDateTime(m.createdAt)}
                  </span>
                </div>
                <p className="qmb-msg-text">{m.text}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="qmb-empty">No messages yet</p>
            )}
            {hasMore && (
              <button
                className="qmb-load-more"
                onClick={loadMore}
                type="button"
              >
                Load {Math.min(10, messages.length - displayCount)} more messages
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(QuickMessageBox);
