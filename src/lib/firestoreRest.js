// Firestore REST fallback — plain HTTPS.
// Requires: Anonymous auth enabled. We attach the user's ID token.

export async function restCreateMessage({ projectId, apiKey, idToken, author, text }) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit?key=${apiKey}`;

  const randomId = crypto.randomUUID();
  const body = {
    writes: [
      {
        update: {
          name: `projects/${projectId}/databases/(default)/documents/messages/${randomId}`,
          fields: {
            author: { stringValue: author },
            text: { stringValue: text },
            createdAt: { timestampValue: new Date().toISOString() }
          }
        }
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text().catch(()=> "");
    throw new Error(`REST write failed (${res.status}) ${t}`);
  }
  return await res.json();
}

// Optional: fetch latest 50 via REST (no streaming)
export async function restFetchMessages({ projectId, apiKey }) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: "messages" }],
      orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
      limit: 50
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`REST read failed: ${res.status}`);
  const rows = await res.json();

  // Map Firestore REST docs into simple objects
  const msgs = [];
  for (const r of rows) {
    const d = r.document;
    if (!d) continue;
    const f = d.fields || {};
    msgs.push({
      id: d.name.split("/").pop(),
      author: f.author?.stringValue || "Unknown",
      text: f.text?.stringValue || "",
      createdAt: f.createdAt?.timestampValue ? new Date(f.createdAt.timestampValue) : null
    });
  }
  return msgs;
}
