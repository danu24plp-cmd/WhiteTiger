/**
 * White Tiger Dashboard - Inisialisasi Firebase
 * Menginisialisasi Firebase App, Firestore, dan GitHub Auth
 */

// Pastikan firebase-config.js sudah dimuat sebelum file ini
const FirebaseApp = {
  app: null,
  db: null,
  auth: null,
  githubProvider: null,
  initialized: false,

  async init() {
    if (this.initialized) return;

    // Inisialisasi Firebase App
    this.app = firebase.initializeApp(firebaseConfig);

    // Inisialisasi Firestore
    this.db = firebase.firestore();

    // Aktifkan offline persistence
    try {
      await this.db.enablePersistence({ synchronizeTabs: true });
      console.log('Firestore offline persistence aktif');
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('Offline persistence gagal: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser tidak mendukung offline persistence');
      }
    }

    // Inisialisasi Auth
    this.auth = firebase.auth();

    // GitHub Provider
    this.githubProvider = new firebase.auth.GithubAuthProvider();
    this.githubProvider.addScope('read:user');
    this.githubProvider.addScope('user:email');

    this.initialized = true;
    console.log('Firebase berhasil diinisialisasi');
    return this;
  },

  getDb() {
    if (!this.db) throw new Error('Firestore belum diinisialisasi. Panggil FirebaseApp.init() terlebih dahulu.');
    return this.db;
  },

  getAuth() {
    if (!this.auth) throw new Error('Firebase Auth belum diinisialisasi.');
    return this.auth;
  },

  getGithubProvider() {
    return this.githubProvider;
  }
};
