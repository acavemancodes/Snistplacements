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

async function loadConfig() {
  const res = await fetch('/api/config/firebase');
  return res.json();
}

async function initFirebase() {
  const cfg = await loadConfig();
  if (!cfg.apiKey) {
    console.warn('Firebase config missing; set FIREBASE_* in .env');
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
