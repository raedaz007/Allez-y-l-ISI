// =====================================================
// PAGES.JS — Registre des pages + pages générales
// (dashboard, publications, profil, paramètres, à propos,
//  favoris, notes, tâches, progression, pomodoro)
// =====================================================

const Pages = {};

// ---------------- Dashboard ----------------
Pages.dashboard = async function () {
  const session = App.session;
  const sessions = await Data.timetable();
  const { current, next, nextDayOffset } = Timetable.getCurrentAndNext(sessions);
  const todaySessions = Timetable.sessionsForDay(sessions, Timetable.todayKey());
  const pubs = (await Data.publications()).slice(0, 2);

  let nextBlockHtml = `<div class="empty-state"><div class="empty-emoji">📭</div><p data-i18n="dashboard_no_more_today"></p></div>`;
  if (next) {
    const cd = nextDayOffset === 0 ? Timetable.countdownLabel(next, 0) : null;
    let timerHtml = "";
    if (cd) {
      if (cd.phase === "before") {
        timerHtml = `<div class="next-session-timer" id="live-countdown" data-target-min="${Timetable.toMinutes(next.start)}" data-phase="before">${Timetable.minutesToHMS(cd.minutesLeft)}</div><div class="card-sub" data-i18n="dashboard_time_left"></div>`;
      } else if (cd.phase === "during") {
        timerHtml = `<div class="next-session-timer" id="live-countdown" data-target-min="${Timetable.toMinutes(next.end)}" data-phase="during">${Timetable.minutesToHMS(cd.minutesLeft)}</div><div class="card-sub" data-i18n="dashboard_session_ongoing"></div>`;
      }
    } else {
      timerHtml = `<div class="card-sub" data-i18n="dashboard_next_is"></div>`;
    }
    nextBlockHtml = `
      <div class="badge ${Timetable.typeBadgeClass(next.type)}">${next.type}</div>
      <div class="session-subject">${next.subject}</div>
      ${timerHtml}
      <div class="session-meta">
        <span>⏰ <bdi dir="ltr">${next.start} → ${next.end}</bdi></span>
        <span>🏫 ${next.room}</span>
        <span>👨‍🏫 ${next.teacher}</span>
      </div>
      <div style="margin-top:14px;">
        <button class="btn btn-outline btn-sm" data-action="open-session" data-id="${next.id}">${t("common_details")}</button>
      </div>
    `;
  }

  const html = `
    <div class="greeting-banner">
      <div>
        <h2>${t("welcome_back")} ${session.firstName || session.fullName} 👋</h2>
        <p>${session.profile ? `${session.profile.level} · ${session.profile.cycle} · ${session.profile.group}` : ""}</p>
      </div>
      <div style="font-size:34px;">🎓</div>
    </div>

    <div class="dashboard-grid">
      <div class="next-session-card">
        <div class="eyebrow" data-i18n="dashboard_next_session"></div>
        ${nextBlockHtml}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="stat-mini-grid">
          <div class="stat-mini">
            <div class="stat-value">${todaySessions.length}</div>
            <div class="stat-label" data-i18n="dashboard_sessions_count"></div>
          </div>
          <div class="stat-mini">
            <div class="stat-value">${next ? next.room : "—"}</div>
            <div class="stat-label" data-i18n="dashboard_next_room"></div>
          </div>
        </div>
        <div class="card">
          <div class="eyebrow" data-i18n="dashboard_latest_pubs"></div>
          ${pubs.map(p => `
            <div style="padding:8px 0;border-bottom:1px solid var(--border-color);">
              <div style="font-weight:700;font-size:13px;">${PublicationsHelper.title(p)}</div>
              <div style="font-size:11.5px;color:var(--text-muted);">${p.date}</div>
            </div>
          `).join("") || `<p class="card-sub" data-i18n="pubs_empty"></p>`}
          <button class="btn btn-ghost btn-sm" style="margin-top:8px;" data-action="nav" data-route="publications">→ <span data-i18n="nav_publications"></span></button>
        </div>
      </div>
    </div>

    <div class="page-header" style="margin-top:22px;">
      <h1 data-i18n="timetable_today"></h1>
    </div>
    <div class="day-list">
      ${todaySessions.length ? todaySessions.map(s => SessionBlockHTML(s, current)).join("") : `<div class="empty-state"><p data-i18n="timetable_no_session"></p></div>`}
    </div>
  `;

  setTimeout(() => {
    bindSessionClicks();
    bindNavActions();
    startDashboardCountdown();
  }, 0);

  return html;
};

function SessionBlockHTML(s, currentSession) {
  const isCurrent = currentSession && currentSession.id === s.id;
  return `
    <div class="session-block ${isCurrent ? "current" : ""}" data-action="open-session" data-id="${s.id}">
      <div class="s-time"><bdi dir="ltr">${s.start} — ${s.end}</bdi></div>
      <div class="s-subject">${s.subject}</div>
      <div class="s-meta">
        <span class="badge ${Timetable.typeBadgeClass(s.type)}">${s.type}</span>
        <span>🏫 ${s.room}</span>
        <span>👨‍🏫 ${s.teacher}</span>
        ${isCurrent ? `<span class="badge badge-neutral" data-i18n="timetable_current"></span>` : ""}
      </div>
    </div>
  `;
}

function bindSessionClicks() {
  document.querySelectorAll('[data-action="open-session"]').forEach(el => {
    el.addEventListener("click", async () => {
      const id = parseInt(el.getAttribute("data-id"), 10);
      const sessions = await Data.timetable();
      const s = sessions.find(x => x.id === id);
      if (s) openSessionDetailModal(s);
    });
  });
}

function bindNavActions() {
  document.querySelectorAll('[data-action="nav"]').forEach(el => {
    el.addEventListener("click", () => App.navigate(el.getAttribute("data-route")));
  });
}

function openSessionDetailModal(s) {
  Storage.pushHistory({ id: `session-${s.id}`, type: "session", label: s.subject });
  App.openModal(`
    <div class="modal-header">
      <h3>${s.subject}</h3>
      <button class="modal-close" data-close-modal>✕</button>
    </div>
    <div class="modal-body">
      <div class="badge ${Timetable.typeBadgeClass(s.type)}" style="margin-bottom:12px;">${s.type} — ${Timetable.typeLabel(s.type)}</div>
      <div class="detail-row"><span class="detail-label" data-i18n="timetable_detail_time"></span><span class="detail-value"><bdi dir="ltr">${s.start} → ${s.end}</bdi></span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="timetable_detail_teacher"></span><span class="detail-value">${s.teacher}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="timetable_detail_room"></span><span class="detail-value">${s.room}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="timetable_detail_block"></span><span class="detail-value">${s.block}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="timetable_detail_floor"></span><span class="detail-value">${s.floor}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="timetable_detail_group"></span><span class="detail-value">${s.group}</span></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" data-close-modal data-action="nav" data-route="rooms/${s.room}" id="modal-view-room">🏫 ${s.room}</button>
      <button class="btn btn-secondary" data-close-modal data-i18n="common_close"></button>
    </div>
  `);
  setTimeout(() => {
    const btn = document.getElementById("modal-view-room");
    if (btn) btn.addEventListener("click", () => App.navigate(`rooms/${s.room}`));
  }, 0);
}

let dashboardCountdownTimer = null;
function startDashboardCountdown() {
  if (dashboardCountdownTimer) clearInterval(dashboardCountdownTimer);
  dashboardCountdownTimer = setInterval(() => {
    const el = document.getElementById("live-countdown");
    if (!el) { clearInterval(dashboardCountdownTimer); return; }
    const target = parseInt(el.getAttribute("data-target-min"), 10);
    const now = Timetable.nowMinutes();
    const left = target - now;
    if (left <= 0) { App.route(); return; }
    el.textContent = Timetable.minutesToHMS(left);
  }, 30000);
}

// ---------------- Publications ----------------
const PublicationsHelper = {
  title(p) {
    const lang = Storage.getLang();
    return p[`title_${lang}`] || p.title_fr || p.title || "";
  },
  content(p) {
    const lang = Storage.getLang();
    return p[`content_${lang}`] || p.content_fr || p.content || "";
  }
};

Pages.publications = async function () {
  const pubs = (await Data.publications()).slice().sort((a, b) => b.date.localeCompare(a.date));
  const cats = ["all", "information", "evenement", "examen", "cours", "administration", "important"];

  const html = `
    <div class="page-header"><h1 data-i18n="pubs_title"></h1></div>
    <div class="tab-row" id="pub-filter-tabs">
      ${cats.map((c, i) => `<button class="${i === 0 ? "active" : ""}" data-cat="${c}">${c === "all" ? t("pubs_all") : t("cat_" + c)}</button>`).join("")}
    </div>
    <div id="pub-list">
      ${pubs.length ? pubs.map(p => publicationCardHtml(p)).join("") : `<div class="empty-state"><p data-i18n="pubs_empty"></p></div>`}
    </div>
  `;
  setTimeout(() => {
    document.querySelectorAll("#pub-filter-tabs button").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#pub-filter-tabs button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const cat = btn.getAttribute("data-cat");
        const filtered = cat === "all" ? pubs : pubs.filter(p => p.category === cat);
        document.getElementById("pub-list").innerHTML = filtered.length ? filtered.map(publicationCardHtml).join("") : `<div class="empty-state"><p>${t("pubs_empty")}</p></div>`;
      });
    });
  }, 0);
  return html;
};

function publicationCardHtml(p) {
  return `
    <div class="card" style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div class="card-title">${PublicationsHelper.title(p)}</div>
        <span class="badge badge-category-${p.category}">${t("cat_" + p.category)}</span>
      </div>
      <div class="card-sub" style="margin-top:6px;">${PublicationsHelper.content(p)}</div>
      <div style="font-size:11.5px;color:var(--text-muted);margin-top:8px;">${p.date}</div>
    </div>
  `;
}

// ---------------- Favoris ----------------
Pages.favorites = async function () {
  const favs = Storage.getFavorites();
  const html = `
    <div class="page-header"><h1 data-i18n="fav_title"></h1></div>
    ${favs.length ? favs.map(f => `
      <div class="list-row">
        <div>
          <div class="list-row-title">${f.label}</div>
          <div class="list-row-sub">${f.meta || f.type}</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-remove-fav="${f.id}">⭐</button>
      </div>
    `).join("") : `<div class="empty-state"><div class="empty-emoji">⭐</div><p data-i18n="fav_empty"></p></div>`}
  `;
  setTimeout(() => {
    document.querySelectorAll("[data-remove-fav]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-remove-fav");
        const favs2 = Storage.getFavorites();
        Storage.set("favorites", favs2.filter(f => f.id !== id));
        App.showToast("⭐", t("toast_removed_favorite"));
        App.route();
      });
    });
  }, 0);
  return html;
};

// ---------------- Notes ----------------
Pages.notes = async function () {
  const notes = Storage.getNotes();
  const html = `
    <div class="page-header"><h1 data-i18n="notes_title"></h1></div>
    <textarea class="notes-textarea" id="notes-textarea" data-i18n-placeholder="notes_placeholder" placeholder="${t("notes_placeholder")}">${notes}</textarea>
    <div style="margin-top:10px;display:flex;justify-content:flex-end;">
      <button class="btn btn-primary" id="save-notes-btn" data-i18n="common_save"></button>
    </div>
  `;
  setTimeout(() => {
    document.getElementById("save-notes-btn").addEventListener("click", () => {
      Storage.setNotes(document.getElementById("notes-textarea").value);
      App.showToast("📝", t("notes_saved"));
    });
  }, 0);
  return html;
};

// ---------------- Tâches ----------------
Pages.tasks = async function () {
  const tasks = Storage.getTasks();
  const html = `
    <div class="page-header"><h1 data-i18n="tasks_title"></h1></div>
    <div class="todo-input-row">
      <input type="text" id="new-task-input" data-i18n-placeholder="tasks_placeholder" placeholder="${t("tasks_placeholder")}" style="flex:1;padding:11px 13px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);" />
      <button class="btn btn-primary" id="add-task-btn" data-i18n="tasks_add"></button>
    </div>
    <div id="task-list">
      ${tasks.length ? tasks.map(taskRowHtml).join("") : `<div class="empty-state"><p data-i18n="tasks_empty"></p></div>`}
    </div>
  `;
  setTimeout(() => {
    document.getElementById("add-task-btn").addEventListener("click", addTaskHandler);
    document.getElementById("new-task-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addTaskHandler(); });
    bindTaskEvents();
  }, 0);
  return html;
};
function taskRowHtml(task) {
  return `
    <div class="todo-item ${task.done ? "done" : ""}" data-task-id="${task.id}">
      <div class="todo-checkbox" data-toggle-task="${task.id}">${task.done ? "✓" : ""}</div>
      <div class="todo-text">${task.text}</div>
      <button class="todo-delete" data-delete-task="${task.id}">✕</button>
    </div>
  `;
}
function addTaskHandler() {
  const input = document.getElementById("new-task-input");
  const text = input.value.trim();
  if (!text) return;
  const tasks = Storage.getTasks();
  tasks.unshift({ id: Date.now().toString(), text, done: false });
  Storage.setTasks(tasks);
  input.value = "";
  App.showToast("✅", t("toast_task_added"));
  App.route();
}
function bindTaskEvents() {
  document.querySelectorAll("[data-toggle-task]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-toggle-task");
      const tasks = Storage.getTasks();
      const task = tasks.find(x => x.id === id);
      if (task) task.done = !task.done;
      Storage.setTasks(tasks);
      App.route();
    });
  });
  document.querySelectorAll("[data-delete-task]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-delete-task");
      Storage.setTasks(Storage.getTasks().filter(x => x.id !== id));
      App.route();
    });
  });
}

// ---------------- Progression ----------------
Pages.progress = async function () {
  const progress = Storage.getProgress();
  const doneCount = Object.values(progress).filter(v => v === "done").length;
  const ecues = await Data.allEcues();
  const subjectsStudied = new Set(Object.keys(progress).filter(k => progress[k] !== "not-started").map(k => k.split("-ch")[0])).size;
  const favs = Storage.getFavorites().length;
  const tasks = Storage.getTasks();
  const tasksDone = tasks.filter(t2 => t2.done).length;

  const totalChapters = ecues.reduce((sum, e) => sum + e.chapters.length, 0);
  const pct = totalChapters ? Math.round((doneCount / totalChapters) * 100) : 0;

  return `
    <div class="page-header"><h1 data-i18n="progress_title"></h1></div>
    <div class="card" style="margin-bottom:16px;">
      <div class="eyebrow" data-i18n="prepa_progress_overall"></div>
      <div class="progress-row" style="margin-top:8px;">
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
        <div class="progress-pct">${pct}%</div>
      </div>
    </div>
    <div class="stat-mini-grid" style="grid-template-columns:repeat(2,1fr);">
      <div class="stat-mini"><div class="stat-value">${doneCount}</div><div class="stat-label" data-i18n="progress_chapters_done"></div></div>
      <div class="stat-mini"><div class="stat-value">${subjectsStudied}</div><div class="stat-label" data-i18n="progress_subjects_studied"></div></div>
      <div class="stat-mini"><div class="stat-value">${favs}</div><div class="stat-label" data-i18n="progress_favorites"></div></div>
      <div class="stat-mini"><div class="stat-value">${tasksDone}/${tasks.length}</div><div class="stat-label" data-i18n="progress_tasks_done"></div></div>
    </div>
  `;
};

// ---------------- Pomodoro ----------------
let pomodoroState = { seconds: 25 * 60, running: false, mode: "focus", timer: null };
Pages.pomodoro = async function () {
  const html = `
    <div class="page-header"><h1 data-i18n="pomodoro_title"></h1></div>
    <div class="card pomodoro-card">
      <div class="pomodoro-mode-row">
        <button class="btn btn-sm ${pomodoroState.mode === "focus" ? "btn-primary" : "btn-secondary"}" data-pomo-mode="focus" data-i18n="pomodoro_focus"></button>
        <button class="btn btn-sm ${pomodoroState.mode === "break" ? "btn-primary" : "btn-secondary"}" data-pomo-mode="break" data-i18n="pomodoro_break"></button>
      </div>
      <div class="pomodoro-time" id="pomo-display">${formatPomodoro(pomodoroState.seconds)}</div>
      <div class="pomodoro-controls">
        <button class="btn btn-primary" id="pomo-toggle">${pomodoroState.running ? t("pomodoro_pause") : t("pomodoro_start")}</button>
        <button class="btn btn-secondary" id="pomo-reset" data-i18n="pomodoro_reset"></button>
      </div>
    </div>
  `;
  setTimeout(() => {
    document.querySelectorAll("[data-pomo-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        pomodoroState.mode = btn.getAttribute("data-pomo-mode");
        pomodoroState.seconds = pomodoroState.mode === "focus" ? 25 * 60 : 5 * 60;
        pomodoroState.running = false;
        clearInterval(pomodoroState.timer);
        App.route();
      });
    });
    document.getElementById("pomo-toggle").addEventListener("click", togglePomodoro);
    document.getElementById("pomo-reset").addEventListener("click", () => {
      clearInterval(pomodoroState.timer);
      pomodoroState.running = false;
      pomodoroState.seconds = pomodoroState.mode === "focus" ? 25 * 60 : 5 * 60;
      App.route();
    });
  }, 0);
  return html;
};
function formatPomodoro(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function togglePomodoro() {
  pomodoroState.running = !pomodoroState.running;
  document.getElementById("pomo-toggle").textContent = pomodoroState.running ? t("pomodoro_pause") : t("pomodoro_start");
  if (pomodoroState.running) {
    pomodoroState.timer = setInterval(() => {
      pomodoroState.seconds--;
      const display = document.getElementById("pomo-display");
      if (display) display.textContent = formatPomodoro(pomodoroState.seconds);
      if (pomodoroState.seconds <= 0) {
        clearInterval(pomodoroState.timer);
        pomodoroState.running = false;
        App.showToast("⏱️", "Pomodoro terminé !");
        App.route();
      }
    }, 1000);
  } else {
    clearInterval(pomodoroState.timer);
  }
}

// ---------------- Profil ----------------
Pages.profile = async function () {
  const s = App.session;
  const p = s.profile;
  const html = `
    <div class="page-header"><h1 data-i18n="profile_title"></h1></div>
    <div class="card" style="max-width:460px;">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
        <div class="user-avatar" style="width:52px;height:52px;font-size:18px;">${(s.firstName || "?")[0]}</div>
        <div>
          <div style="font-weight:800;font-size:16px;">${s.fullName}</div>
          <div class="card-sub">${t(s.role === "teacher" ? "role_teacher" : "role_student")}</div>
        </div>
      </div>
      <div class="detail-row"><span class="detail-label" data-i18n="profile_email"></span><span class="detail-value">${s.email}</span></div>
      ${p ? `
      <div class="detail-row"><span class="detail-label" data-i18n="profile_level"></span><span class="detail-value">${p.level}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="profile_group"></span><span class="detail-value">${p.group}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="profile_semester"></span><span class="detail-value">${p.semester}</span></div>
      ` : ""}
      <button class="btn btn-secondary btn-block" style="margin-top:16px;" id="btn-logout" data-i18n="profile_logout"></button>
    </div>
  `;
  setTimeout(() => {
    const btn = document.getElementById("btn-logout");
    if (btn) btn.addEventListener("click", () => App.logout());
  }, 0);
  return html;
};

// ---------------- Paramètres ----------------
Pages.settings = async function () {
  const theme = Storage.getTheme();
  const lang = Storage.getLang();
  const html = `
    <div class="page-header"><h1 data-i18n="settings_title"></h1></div>
    <div class="card" style="max-width:520px;margin-bottom:14px;">
      <div class="eyebrow" data-i18n="settings_language"></div>
      <div class="lang-option-row" style="margin-top:10px;">
        <button class="lang-option-btn ${lang === "fr" ? "active" : ""}" data-set-lang="fr">🇫🇷 Français</button>
        <button class="lang-option-btn ${lang === "en" ? "active" : ""}" data-set-lang="en">🇬🇧 English</button>
        <button class="lang-option-btn ${lang === "ar" ? "active" : ""}" data-set-lang="ar">🇹🇳 العربية</button>
      </div>
    </div>
    <div class="card" style="max-width:520px;">
      <div class="settings-row">
        <div><div class="settings-row-label" data-i18n="settings_dark_mode"></div><div class="settings-row-desc" data-i18n="settings_dark_mode_desc"></div></div>
        <button class="switch ${theme === "dark" ? "on" : ""}" id="settings-theme-switch"></button>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label" data-i18n="settings_notifications"></div><div class="settings-row-desc" data-i18n="settings_notifications_desc"></div></div>
        <button class="switch ${Notifications.isEnabled() ? "on" : ""}" id="settings-notif-switch"></button>
      </div>
      <div class="settings-row">
        <div><div class="settings-row-label" data-i18n="settings_reset_data"></div><div class="settings-row-desc" data-i18n="settings_reset_desc"></div></div>
        <button class="btn btn-outline btn-sm" id="settings-reset-btn" data-i18n="settings_reset_data"></button>
      </div>
    </div>
  `;
  setTimeout(() => {
    document.querySelectorAll("[data-set-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        applyLanguage(btn.getAttribute("data-set-lang"));
        App.showToast("🌐", t("toast_lang_changed"));
        App.renderShell();
        App.navigate("settings");
        App.route();
      });
    });
    document.getElementById("settings-theme-switch").addEventListener("click", () => { App.toggleTheme(); App.route(); });
    document.getElementById("settings-notif-switch").addEventListener("click", () => { Notifications.toggle(); App.route(); });
    document.getElementById("settings-reset-btn").addEventListener("click", () => {
      App.openModal(`
        <div class="modal-header"><h3 data-i18n="settings_reset_confirm"></h3><button class="modal-close" data-close-modal>✕</button></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-close-modal data-i18n="common_cancel"></button>
          <button class="btn btn-primary" id="confirm-reset-btn" data-i18n="common_confirm"></button>
        </div>
      `);
      setTimeout(() => {
        document.getElementById("confirm-reset-btn").addEventListener("click", () => {
          ["favorites", "history", "notes", "tasks", "progress", "chatHistory"].forEach(k => Storage.remove(k));
          App.closeModal();
          App.showToast("🧹", t("settings_reset_done"));
          App.route();
        });
      }, 0);
    });
  }, 0);
  return html;
};

// ---------------- À propos ----------------
Pages.about = async function () {
  const team = await Data.team();
  return `
    <div class="page-header"><h1 data-i18n="about_title"></h1></div>
    <div class="warning-box" style="margin-bottom:18px;">${team.disclaimer_fr}</div>
    <div class="card" style="margin-bottom:16px;">
      <p>${t("about_project_desc")}</p>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="eyebrow" data-i18n="about_limitations_title"></div>
      <p style="margin-top:8px;">${t("about_limitations")}</p>
    </div>
    <div class="page-header"><h1 data-i18n="about_team_title" style="font-size:17px;"></h1></div>
    <div class="team-grid">
      ${team.team.map(m => `
        <div class="card team-member-card">
          <div class="team-avatar">${m.name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div>
          <div style="font-weight:700;font-size:13.5px;">${m.name}</div>
          <div class="card-sub" style="font-size:11px;word-break:break-all;">${m.email || "—"}</div>
        </div>
      `).join("")}
    </div>
  `;
};
