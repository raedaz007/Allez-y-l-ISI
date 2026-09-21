
// =====================================================
// Pages liées à l'emploi du temps et aux matières
// =====================================================

Pages.timetable = async function (params) {
  const sessions = await Data.timetable();
  const mode = (params && params[0]) || "week";
  const { current } = Timetable.getCurrentAndNext(sessions);
  const dayLabels = { monday: "day_monday", tuesday: "day_tuesday", wednesday: "day_wednesday", thursday: "day_thursday", friday: "day_friday" };
  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];

  let bodyHtml = "";
  if (mode === "today") {
    const todaySessions = Timetable.sessionsForDay(sessions, Timetable.todayKey());
    bodyHtml = `<div class="day-list">${todaySessions.length ? todaySessions.map(s => SessionBlockHTML(s, current)).join("") : `<div class="empty-state"><p data-i18n="timetable_no_session"></p></div>`}</div>`;
  } else {
    bodyHtml = `<div class="week-grid">
      ${weekDays.map(day => {
        const daySessions = Timetable.sessionsForDay(sessions, day);
        const isToday = day === Timetable.todayKey();
        return `
          <div class="day-column">
            <div class="day-column-header ${isToday ? "is-today" : ""}">${t(dayLabels[day])}</div>
            ${daySessions.length ? daySessions.map(s => SessionBlockHTML(s, current)).join("") : `<div class="card-sub" style="text-align:center;padding:10px;font-size:12px;">—</div>`}
          </div>
        `;
      }).join("")}
    </div>`;
  }

  const html = `
    <div class="page-header"><h1 data-i18n="nav_timetable"></h1></div>
    <div class="timetable-toolbar">
      <div class="timetable-tabs" id="tt-mode-tabs">
        <button class="${mode === "today" ? "active" : ""}" data-mode="today" data-i18n="timetable_today"></button>
        <button class="${mode !== "today" ? "active" : ""}" data-mode="week" data-i18n="timetable_week"></button>
      </div>
    </div>
    ${bodyHtml}
  `;

  setTimeout(() => {
    bindSessionClicks();
    document.querySelectorAll("#tt-mode-tabs button").forEach(btn => {
      btn.addEventListener("click", () => App.navigate("timetable/" + btn.getAttribute("data-mode")));
    });
  }, 0);

  return html;
};

Pages.subjects = async function () {
  const subjects = await Data.subjects();
  const sessions = await Data.timetable();
  const html = `
    <div class="page-header"><h1 data-i18n="nav_subjects"></h1></div>
    <div class="card-grid">
      ${subjects.map(s => {
        const count = sessions.filter(x => x.subject === s.name).length;
        return `
        <div class="card hoverable" data-action="subject-card" data-name="${s.name}">
          <div class="card-icon-tile">${s.icon || "📘"}</div>
          <div class="card-title">${s.name}</div>
          <div class="card-sub">${s.code} · ${count} ${t("dashboard_sessions_count")}</div>
        </div>`;
      }).join("")}
    </div>
  `;
  setTimeout(() => {
    document.querySelectorAll('[data-action="subject-card"]').forEach(el => {
      el.addEventListener("click", () => App.navigate("search/" + encodeURIComponent(el.getAttribute("data-name"))));
    });
  }, 0);
  return html;
};
