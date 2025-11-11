// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref as rRef, onValue, push, query, orderByChild, limitToLast, serverTimestamp as rNow } from "firebase/database";
// (keep your existing env-config here)

const app = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
});

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export { rRef, onValue, push, query, orderByChild, limitToLast, rNow };

export function ensureAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) { unsub(); resolve(u); }
      else {
        signInAnonymously(auth).then(({ user }) => { unsub(); resolve(user); })
          .catch(reject);
      }
    });
  });
}
