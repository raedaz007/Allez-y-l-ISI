// =====================================================
// TEACHERS.JS — Enseignants
// =====================================================

Pages.teachers = async function (params) {
  const teachers = await Data.teachers();
  const sessions = await Data.timetable();
  const rooms = await Data.rooms();
  const teacherId = params && params[0];

  if (teacherId) return teacherDetailHtml(teacherId, teachers, sessions);

  const html = `
    <div class="page-header"><h1 data-i18n="nav_teachers"></h1></div>
    <div class="topbar-search" style="max-width:420px;margin-bottom:16px;">
      <span class="search-icon">🔎</span>
      <input type="text" id="teacher-search-input" data-i18n-placeholder="teachers_search_placeholder" placeholder="${t("teachers_search_placeholder")}" style="width:100%;" />
    </div>
    <div id="teacher-list">
      ${teachers.map(teacherRowHtml).join("")}
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll("[data-teacher-id]").forEach(el => {
      el.addEventListener("click", () => App.navigate("teachers/" + el.getAttribute("data-teacher-id")));
    });
    const input = document.getElementById("teacher-search-input");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      const filtered = teachers.filter(tch =>
        tch.name.toLowerCase().includes(q) ||
        tch.subjects.some(s => s.toLowerCase().includes(q)) ||
        sessions.some(s => s.teacher === tch.name && (s.room.toLowerCase().includes(q) || s.group.toLowerCase().includes(q)))
      );
      document.getElementById("teacher-list").innerHTML = filtered.map(teacherRowHtml).join("") || `<div class="empty-state"><p>${t("search_no_results")}</p></div>`;
      document.querySelectorAll("[data-teacher-id]").forEach(el => {
        el.addEventListener("click", () => App.navigate("teachers/" + el.getAttribute("data-teacher-id")));
      });
    });
  }, 0);

  return html;
};

function teacherRowHtml(tch) {
  return `
    <div class="list-row" data-teacher-id="${tch.id}" style="cursor:pointer;">
      <div>
        <div class="list-row-title">👨‍🏫 ${tch.name}</div>
        <div class="list-row-sub">${tch.subjects.join(", ")}</div>
      </div>
      <span>›</span>
    </div>
  `;
}

function teacherDetailHtml(teacherId, teachers, sessions) {
  const tch = teachers.find(x => x.id === teacherId);
  if (!tch) {
    return `<div class="empty-state"><p data-i18n="teachers_no_data"></p></div>
      <button class="btn btn-outline" data-action="nav" data-route="teachers" data-i18n="common_back"></button>` + bindBackButtonSoon();
  }
  Storage.pushHistory({ id: `teacher-${tch.id}`, type: "teacher", label: tch.name });

  const tchSessions = sessions.filter(s => s.teacher === tch.name);
  const { next } = Timetable.getCurrentAndNext(tchSessions);

  const html = `
    <div class="page-header"><h1>👨‍🏫 ${tch.name}</h1></div>
    <div class="card" style="max-width:460px;margin-bottom:16px;">
      <div class="detail-row"><span class="detail-label" data-i18n="teachers_subjects"></span><span class="detail-value">${tch.subjects.join(", ")}</span></div>
      ${next ? `<div class="detail-row"><span class="detail-label" data-i18n="teachers_next_session"></span><span class="detail-value">${next.subject} — ${next.room}</span></div>` : ""}
    </div>
    ${tchSessions.length ? `
    <div class="day-list">${tchSessions.map(s => SessionBlockHTML(s, null)).join("")}</div>
    ` : `<div class="empty-state"><p data-i18n="teachers_no_data"></p></div>`}
    <button class="btn btn-outline" data-action="nav" data-route="teachers" style="margin-top:14px;" data-i18n="common_back"></button>
  `;
  setTimeout(() => { bindSessionClicks(); bindNavActions(); }, 0);
  return html;
}
