// =====================================================
// TIMETABLE.JS — Logique de l'emploi du temps
// =====================================================

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const JS_DAY_TO_KEY = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const Timetable = {
  todayKey() {
    return JS_DAY_TO_KEY[new Date().getDay()];
  },

  tomorrowKey() {
    const idx = new Date().getDay();
    return JS_DAY_TO_KEY[(idx + 1) % 7];
  },

  nowMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  },

  toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  },

  minutesToHMS(totalMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${String(m).padStart(2, "0")}min`;
  },

  sessionsForDay(sessions, dayKey) {
    return sessions.filter(s => s.day === dayKey).sort((a, b) => this.toMinutes(a.start) - this.toMinutes(b.start));
  },

  // Détermine la séance en cours et la prochaine séance (aujourd'hui, sinon jours suivants)
  getCurrentAndNext(sessions) {
    const now = this.nowMinutes();
    const todayIdx = new Date().getDay();
    let current = null;
    let next = null;

    const todaySessions = this.sessionsForDay(sessions, this.todayKey());
    for (const s of todaySessions) {
      const start = this.toMinutes(s.start);
      const end = this.toMinutes(s.end);
      if (now >= start && now < end) current = s;
      if (!next && start > now) next = s;
    }
    if (next) return { current, next, nextDayOffset: 0 };

    // chercher dans les jours suivants (jusqu'à 7 jours)
    for (let offset = 1; offset <= 7; offset++) {
      const dayKey = JS_DAY_TO_KEY[(todayIdx + offset) % 7];
      const daySessions = this.sessionsForDay(sessions, dayKey);
      if (daySessions.length > 0) {
        return { current, next: daySessions[0], nextDayOffset: offset };
      }
    }
    return { current, next: null, nextDayOffset: null };
  },

  countdownLabel(session, dayOffset) {
    if (dayOffset > 0) return null; // pas de compte à rebours précis multi-jours
    const now = this.nowMinutes();
    const start = this.toMinutes(session.start);
    const end = this.toMinutes(session.end);
    if (now < start) {
      return { phase: "before", minutesLeft: start - now };
    } else if (now >= start && now < end) {
      return { phase: "during", minutesLeft: end - now };
    }
    return { phase: "after", minutesLeft: 0 };
  },

  typeBadgeClass(type) {
    const map = { CI: "badge-ci", C: "badge-c", TD: "badge-td", TP: "badge-tp", CC: "badge-cc" };
    return map[type] || "badge-neutral";
  },

  typeLabel(type) {
    const map = {
      CI: { fr: "Cours intégré", en: "Integrated course", ar: "درس مدمج" },
      C: { fr: "Cours", en: "Course", ar: "درس" },
      TD: { fr: "Travaux dirigés", en: "Tutorial", ar: "أعمال موجهة" },
      TP: { fr: "Travaux pratiques", en: "Practical work", ar: "أعمال تطبيقية" },
      CC: { fr: "Contrôle continu", en: "Continuous assessment", ar: "مراقبة مستمرة" },
    };
    const lang = Storage.getLang();
    return (map[type] && (map[type][lang] || map[type].fr)) || type;
  }
};
