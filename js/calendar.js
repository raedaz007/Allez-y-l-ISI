// =====================================================
// CALENDAR.JS — Calendrier (jour / semaine / mois)
// Affiche les séances de l'emploi du temps de démonstration
// =====================================================

let calendarViewMode = "week";
let calendarRefDate = new Date();

Pages.calendar = async function () {
  const sessions = await Data.timetable();
  const html = `
    <div class="page-header"><h1 data-i18n="calendar_title"></h1></div>
    <div class="tab-row" id="cal-mode-tabs">
      <button class="${calendarViewMode === "day" ? "active" : ""}" data-mode="day" data-i18n="calendar_day"></button>
      <button class="${calendarViewMode === "week" ? "active" : ""}" data-mode="week" data-i18n="calendar_week"></button>
      <button class="${calendarViewMode === "month" ? "active" : ""}" data-mode="month" data-i18n="calendar_month"></button>
    </div>
    <div id="calendar-body"></div>
  `;
  setTimeout(() => {
    document.querySelectorAll("#cal-mode-tabs button").forEach(btn => {
      btn.addEventListener("click", () => {
        calendarViewMode = btn.getAttribute("data-mode");
        renderCalendarBody(sessions);
        document.querySelectorAll("#cal-mode-tabs button").forEach(b => b.classList.toggle("active", b === btn));
      });
    });
    renderCalendarBody(sessions);
  }, 0);
  return html;
};

function renderCalendarBody(sessions) {
  const body = document.getElementById("calendar-body");
  if (!body) return;
  if (calendarViewMode === "day") {
    const daySessions = Timetable.sessionsForDay(sessions, Timetable.todayKey());
    body.innerHTML = `<div class="day-list">${daySessions.length ? daySessions.map(s => SessionBlockHTML(s, null)).join("") : `<div class="empty-state"><p data-i18n="timetable_no_session"></p></div>`}</div>`;
  } else if (calendarViewMode === "week") {
    const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const dayLabels = { monday: "day_monday", tuesday: "day_tuesday", wednesday: "day_wednesday", thursday: "day_thursday", friday: "day_friday" };
    body.innerHTML = `<div class="week-grid">
      ${weekDays.map(day => `
        <div class="day-column">
          <div class="day-column-header ${day === Timetable.todayKey() ? "is-today" : ""}">${t(dayLabels[day])}</div>
          ${Timetable.sessionsForDay(sessions, day).map(s => SessionBlockHTML(s, null)).join("") || `<div class="card-sub" style="text-align:center;padding:10px;font-size:12px;">—</div>`}
        </div>
      `).join("")}
    </div>`;
  } else {
    body.innerHTML = renderMonthGrid(sessions);
  }
  translateStaticDom(body);
  bindSessionClicks();
}

function renderMonthGrid(sessions) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdayLabels = ["day_monday", "day_tuesday", "day_wednesday", "day_thursday", "day_friday", "day_saturday", "day_sunday"];
  const dayKeyByIndex = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  let cells = "";
  for (let i = 0; i < startOffset; i++) cells += `<div class="calendar-cell" style="visibility:hidden;"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const weekdayIdx = (dateObj.getDay() + 6) % 7;
    const dayKey = dayKeyByIndex[weekdayIdx];
    const isToday = dateObj.toDateString() === now.toDateString();
    const daySessions = dayKey === "saturday" || dayKey === "sunday" ? [] : Timetable.sessionsForDay(sessions, dayKey).slice(0, 3);
    cells += `
      <div class="calendar-cell ${isToday ? "today" : ""}">
        <div class="cell-date">${d}</div>
        ${daySessions.map(s => `<div class="cell-event">${s.subject}</div>`).join("")}
      </div>
    `;
  }

  return `
    <div class="calendar-grid" style="margin-bottom:4px;">
      ${weekdayLabels.map(l => `<div class="calendar-weekday-label" data-i18n="${l}"></div>`).join("")}
    </div>
    <div class="calendar-grid">${cells}</div>
  `;
}
