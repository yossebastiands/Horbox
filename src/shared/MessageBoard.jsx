import { useEffect, useState } from "react";
// import your firebase stuff
// import { db } from "../firebase";
// import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";

export default function MessageBoard({ collectionName }) {
  const [writer, setWriter] = useState("");
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);

  // TODO: replace with your real Firebase subscription
  useEffect(() => {
    // const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    // return onSnapshot(q, (snap) => {
    //   setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    // });
    setItems([]); // placeholder
  }, [collectionName]);

  async function post() {
    if (!text.trim() || !writer) return;
    // await addDoc(collection(db, collectionName), {
    //   writer,
    //   text: text.trim(),
    //   createdAt: serverTimestamp()
    // });
    setText("");
  }

  return (
    <div className="stack gap-m">
      <div className="form-grid">
        <label className="label">Writer</label>
        <select className="input" value={writer} onChange={e => setWriter(e.target.value)}>
          <option value="">— select —</option>
          <option value="Ocin">Ocin</option>
          <option value="Salma">Salma</option>
        </select>

        <label className="label">Message</label>
        <textarea
          className="input textarea"
          rows={4}
          maxLength={1000}
          placeholder="Write something kind…"
          value={text}
          onChange={e => setText(e.target.value)}
        />

        <div className="actions">
          <button className="btn pill" onClick={post}>Post</button>
        </div>
      </div>

      <ul className="feed">
        {items.map(m => (
          <li key={m.id} className="feed-item">
            <div className="feed-head">
              <strong>{m.writer}</strong>
              <span className="muted">• {m.createdAt?.toDate?.().toLocaleString?.() || ""}</span>
            </div>
            <p>{m.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
