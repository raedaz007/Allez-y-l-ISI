// =====================================================
// SEARCH.JS — Recherche globale
// =====================================================

Pages.search = async function (params) {
  const initialQuery = params && params[0] ? decodeURIComponent(params[0]) : "";
  const html = `
    <div class="page-header"><h1 data-i18n="search_title"></h1></div>
    <div class="topbar-search" style="max-width:520px;margin-bottom:18px;">
      <span class="search-icon">🔎</span>
      <input type="text" id="global-search-page-input" data-i18n-placeholder="search_placeholder" placeholder="${t("search_placeholder")}" value="${initialQuery.replace(/"/g, "&quot;")}" style="width:100%;" />
    </div>
    <div id="search-results-container"></div>
  `;

  setTimeout(async () => {
    const input = document.getElementById("global-search-page-input");
    const run = async () => await runGlobalSearch(input.value.trim());
    if (initialQuery) await run();
    input.addEventListener("input", debounceSearch(run, 200));
    input.focus();
  }, 0);

  return html;
};

function debounceSearch(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function runGlobalSearch(query) {
  const container = document.getElementById("search-results-container");
  if (!container) return;
  if (!query || query.length < 1) { container.innerHTML = ""; return; }
  const q = query.toLowerCase();

  const [rooms, teachers, subjects, sessions, ecues, pubs] = await Promise.all([
    Data.rooms(), Data.teachers(), Data.subjects(), Data.timetable(), Data.allEcues(), Data.publications()
  ]);

  const matchedRooms = rooms.filter(r => r.name.toLowerCase().includes(q));
  const matchedTeachers = teachers.filter(t2 => t2.name.toLowerCase().includes(q) || t2.subjects.some(s => s.toLowerCase().includes(q)));
  const matchedSubjects = subjects.filter(s => s.name.toLowerCase().includes(q));
  const matchedSessions = sessions.filter(s => s.subject.toLowerCase().includes(q) || s.type.toLowerCase() === q);
  const matchedChapters = [];
  ecues.forEach(e => {
    e.chapters.forEach(c => {
      if (c.title.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)) {
        matchedChapters.push({ ecue: e, chapter: c });
      }
    });
  });
  const matchedPubs = pubs.filter(p => PublicationsHelper.title(p).toLowerCase().includes(q) || PublicationsHelper.content(p).toLowerCase().includes(q));

  const sections = [];
  if (matchedRooms.length) sections.push(searchSectionHtml("search_rooms", matchedRooms.map(r => ({
    title: r.name, sub: `${t("rooms_block")} ${r.block} · ${t("rooms_floor")} ${r.floor}`, route: `rooms/${r.id}`
  }))));
  if (matchedTeachers.length) sections.push(searchSectionHtml("search_teachers", matchedTeachers.map(tch => ({
    title: tch.name, sub: tch.subjects.join(", "), route: `teachers/${tch.id}`
  }))));
  if (matchedSubjects.length) sections.push(searchSectionHtml("search_subjects", matchedSubjects.map(s => ({
    title: s.name, sub: s.code, route: null
  }))));
  if (matchedSessions.length) sections.push(searchSectionHtml("search_sessions", matchedSessions.slice(0, 8).map(s => ({
    title: `${s.subject} (${s.type})`, sub: `${t("day_" + s.day)} <bdi dir="ltr">${s.start}-${s.end}</bdi> · ${s.room}`, route: `rooms/${s.room}`
  }))));
  if (matchedChapters.length) sections.push(searchSectionHtml("search_chapters", matchedChapters.slice(0, 10).map(({ ecue, chapter }) => ({
    title: `${chapter.title}`, sub: `${ecue.name} — S${ecue.semester}`, route: `prepa/${ecue.semester}/${ecue.code}`
  }))));
  if (matchedPubs.length) sections.push(searchSectionHtml("search_publications", matchedPubs.map(p => ({
    title: PublicationsHelper.title(p), sub: p.date, route: "publications"
  }))));

  container.innerHTML = sections.length ? sections.join("") : `<div class="empty-state"><div class="empty-emoji">🔎</div><p>${t("search_no_results")}</p></div>`;
  translateStaticDom(container);
  container.querySelectorAll("[data-nav-route]").forEach(el => {
    el.addEventListener("click", () => {
      const route = el.getAttribute("data-nav-route");
      if (route) App.navigate(route);
    });
  });
}

function searchSectionHtml(labelKey, items) {
  return `
    <div class="search-result-section">
      <h3 data-i18n="${labelKey}"></h3>
      ${items.map(i => `
        <div class="list-row" ${i.route ? `data-nav-route="${i.route}" style="cursor:pointer;"` : ""}>
          <div>
            <div class="list-row-title">${i.title}</div>
            <div class="list-row-sub">${i.sub}</div>
          </div>
          ${i.route ? "<span>›</span>" : ""}
        </div>
      `).join("")}
    </div>
  `;
}
