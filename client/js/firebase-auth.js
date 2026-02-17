import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

function hasFirebaseConfig(cfg) {
  return Boolean(
    cfg
    && cfg.apiKey
    && cfg.authDomain
    && cfg.projectId
    && cfg.appId
  );
}

async function loadConfig() {
  const browserConfig = typeof window !== 'undefined' ? window.__SNIST_FIREBASE_CONFIG : null;
  if (hasFirebaseConfig(browserConfig)) return browserConfig;

  try {
    const res = await fetch('/api/config/firebase');
    if (!res.ok) return null;
    const apiConfig = await res.json();
    if (hasFirebaseConfig(apiConfig)) return apiConfig;
  } catch (err) {
    console.warn('Could not load Firebase config from backend:', err);
  }

  return null;
}

async function initFirebase() {
  const cfg = await loadConfig();
  if (!cfg) {
    console.warn('Firebase config missing. Set /js/firebase-web-config.js or backend FIREBASE_* vars.');
    return null;
  }
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const api = {
    signInWithGoogle: () => signInWithPopup(auth, provider).then((res) => res.user),
    signOut: () => signOut(auth),
    signUpEmail: async (name, email, password) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      return cred.user;
    },
    signInEmail: (email, password) => signInWithEmailAndPassword(auth, email, password).then(r => r.user),
    onAuthStateChanged: (cb) => onAuthStateChanged(auth, cb)
  };

  window.firebaseAuthApi = api;
  window.dispatchEvent(new Event('firebase-auth-ready'));
  return api;
}

initFirebase();
