// =====================================================
// NOTIFICATIONS.JS — Notifications locales (navigateur)
// Pas de serveur : rien n'est envoyé si le navigateur est fermé.
// =====================================================

const Notifications = {
  _checkTimer: null,
  _notifiedIds: new Set(),

  isEnabled() {
    return Storage.get("notifEnabled", false);
  },

  toggle() {
    const next = !this.isEnabled();
    Storage.set("notifEnabled", next);
    if (next && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (next) this.scheduleChecks(); else this.stop();
  },

  scheduleChecks() {
    if (!this.isEnabled()) return;
    if (this._checkTimer) clearInterval(this._checkTimer);
    this._checkTimer = setInterval(() => this.checkUpcoming(), 60000);
    this.checkUpcoming();
  },
  stop() {
    if (this._checkTimer) clearInterval(this._checkTimer);
  },

  async checkUpcoming() {
    if (!this.isEnabled()) return;
    const sessions = await Data.timetable();
    const today = Timetable.sessionsForDay(sessions, Timetable.todayKey());
    const now = Timetable.nowMinutes();
    today.forEach(s => {
      const start = Timetable.toMinutes(s.start);
      const end = Timetable.toMinutes(s.end);
      const key15 = `15-${s.id}-${Timetable.todayKey()}`;
      const keyEnd = `end-${s.id}-${Timetable.todayKey()}`;
      if (start - now <= 15 && start - now > 13 && !this._notifiedIds.has(key15)) {
        this.fire("⏰", `${s.subject} — ${t("dashboard_time_left")} 15 min (${s.room})`);
        this._notifiedIds.add(key15);
      }
      if (end - now <= 1 && end - now >= 0 && !this._notifiedIds.has(keyEnd)) {
        this.fire("✅", `${s.subject} — ${t("dashboard_session_done")}`);
        this._notifiedIds.add(keyEnd);
      }
    });
  },

  fire(icon, message) {
    App.showToast(icon, message);
    if ("Notification" in window && Notification.permission === "granted") {
      try { new Notification("Allez-y à l'ISI", { body: message }); } catch (e) { /* silencieux */ }
    }
    const list = Storage.get("notifLog", []);
    list.unshift({ icon, message, ts: Date.now() });
    Storage.set("notifLog", list.slice(0, 30));
  }
};

Pages.notifications = async function () {
  const log = Storage.get("notifLog", []);
  const enabled = Notifications.isEnabled();
  const html = `
    <div class="page-header"><h1 data-i18n="notif_title"></h1></div>
    <div class="card" style="margin-bottom:16px;">
      <div class="settings-row" style="border:none;padding:0;">
        <div class="settings-row-label" data-i18n="notif_enable"></div>
        <button class="switch ${enabled ? "on" : ""}" id="notif-enable-switch"></button>
      </div>
    </div>
    ${log.length ? log.map(n => `
      <div class="list-row">
        <div><div class="list-row-title">${n.icon} ${n.message}</div><div class="list-row-sub">${new Date(n.ts).toLocaleString()}</div></div>
      </div>
    `).join("") : `<div class="empty-state"><div class="empty-emoji">🔔</div><p data-i18n="notif_empty"></p></div>`}
  `;
  setTimeout(() => {
    document.getElementById("notif-enable-switch").addEventListener("click", () => { Notifications.toggle(); App.route(); });
  }, 0);
  return html;
};
