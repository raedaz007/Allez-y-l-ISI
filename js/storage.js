// =====================================================
// STORAGE.JS — Wrapper localStorage (toutes les données
// utilisateur persistantes passent par ici)
// =====================================================

const STORAGE_PREFIX = "allezy_isi_";

const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Storage.get error", key, e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("Storage.set error", key, e);
      return false;
    }
  },
  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },
  // Helpers spécifiques ------------------------------------------------

  // Langue
  getLang() { return this.get("lang", "fr"); },
  setLang(v) { this.set("lang", v); },

  // Thème
  getTheme() { return this.get("theme", "light"); },
  setTheme(v) { this.set("theme", v); },

  // Rôle utilisateur (student | teacher)
  getRole() { return this.get("role", null); },
  setRole(v) { this.set("role", v); },

  // Session connectée
  getSession() { return this.get("session", null); },
  setSession(v) { this.set("session", v); },
  clearSession() { this.remove("session"); },

  // Premier lancement
  hasOnboarded() { return this.get("onboarded", false); },
  setOnboarded() { this.set("onboarded", true); },

  // Progression Prépa: { "uef111-ch1": "done" | "in-progress" | "not-started" }
  getProgress() { return this.get("progress", {}); },
  setChapterStatus(chapterId, status) {
    const p = this.getProgress();
    p[chapterId] = status;
    this.set("progress", p);
  },

  // Favoris (liste d'objets {id, type, label, meta})
  getFavorites() { return this.get("favorites", []); },
  toggleFavorite(item) {
    const favs = this.getFavorites();
    const idx = favs.findIndex(f => f.id === item.id);
    if (idx >= 0) { favs.splice(idx, 1); } else { favs.unshift(item); }
    this.set("favorites", favs);
    return idx < 0; // true si ajouté
  },
  isFavorite(id) { return this.getFavorites().some(f => f.id === id); },

  // Historique
  getHistory() { return this.get("history", []); },
  pushHistory(item) {
    let hist = this.getHistory().filter(h => h.id !== item.id);
    hist.unshift({ ...item, ts: Date.now() });
    hist = hist.slice(0, 30);
    this.set("history", hist);
  },

  // Notes personnelles
  getNotes() { return this.get("notes", ""); },
  setNotes(v) { this.set("notes", v); },

  // Tâches
  getTasks() { return this.get("tasks", []); },
  setTasks(v) { this.set("tasks", v); },

  // Chat history
  getChatHistory() { return this.get("chatHistory", []); },
  setChatHistory(v) { this.set("chatHistory", v.slice(-40)); },

  // Sidebar state (desktop collapsed not required, only mobile open state kept transient)
};
