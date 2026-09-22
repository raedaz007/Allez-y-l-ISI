// =====================================================
// DATA.JS — Chargement et cache des fichiers JSON
// Chemins relatifs (compatible GitHub Pages)
// =====================================================

const Data = {
  _cache: {},

  async load(path) {
    if (this._cache[path]) return this._cache[path];
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      this._cache[path] = json;
      return json;
    } catch (e) {
      console.error("Data.load failed:", path, e);
      return null;
    }
  },

  async users() { return (await this.load("./data/users.json"))?.allowedEmails || []; },
  async students() { return (await this.load("./data/students.json"))?.students || []; },
  async teachers() { return (await this.load("./data/teachers.json"))?.teachers || []; },
  async subjects() { return (await this.load("./data/subjects.json"))?.subjects || []; },
  async rooms() { return (await this.load("./data/rooms.json"))?.rooms || []; },
  async groups() { return (await this.load("./data/groups.json"))?.cycles || []; },

  // L'emploi du temps affiché dépend du groupe choisi par l'utilisateur :
  // - s'il a importé son propre emploi du temps -> on l'utilise ;
  // - sinon, si son groupe correspond au groupe de démonstration (G2) -> emploi du temps fourni ;
  // - sinon -> aucune donnée (l'utilisateur est invité à importer son emploi du temps).
  async timetableInfo() {
    const custom = Storage.getCustomTimetable();
    if (custom && custom.length) return { sessions: custom, source: "custom" };
    const group = Storage.getGroup();
    const demo = (await this.load("./data/timetable.json"))?.sessions || [];
    if (!group || group === "G2") return { sessions: demo, source: "demo" };
    return { sessions: [], source: "none" };
  },
  async timetable() { return (await this.timetableInfo()).sessions; },
  async publications() { return (await this.load("./data/publications.json"))?.publications || []; },
  async chatbot() { return await this.load("./data/chatbot.json"); },
  async team() { return await this.load("./data/team.json"); },
  async semester(n) { return await this.load(`./data/prepa/semester${n}.json`); },

  async allSemesters() {
    const [s1, s2] = await Promise.all([this.semester(1), this.semester(2)]);
    return [s1, s2].filter(Boolean);
  },

  // Aplati toutes les ECUE de tous les semestres pour recherche/lookup rapide
  async allEcues() {
    const sems = await this.allSemesters();
    const list = [];
    sems.forEach(sem => {
      sem.ues.forEach(ue => {
        ue.ecues.forEach(ecue => {
          list.push({ ...ecue, semester: sem.semester, ueName: ue.name, ueCode: ue.code });
        });
      });
    });
    return list;
  },

  findEcueByCode(ecues, code) {
    return ecues.find(e => e.code === code);
  }
};
