// =====================================================
// RESOURCES.JS — Vue filtrable des ressources pédagogiques
// (semestre, matière, type, langue) + historique récent
// =====================================================

Pages.resources = async function () {
  const semesters = await Data.allSemesters();
  const history = Storage.getHistory();

  // Construit la liste plate des ressources avec contexte
  const flat = [];
  semesters.forEach(sem => {
    sem.ues.forEach(ue => {
      ue.ecues.forEach(ecue => {
        ecue.chapters.forEach(ch => {
          RESOURCE_TYPES.forEach(rt => {
            (ch.resources[rt.key] || []).forEach(res => {
              flat.push({ ...res, type: rt.key, typeIcon: rt.icon, typeLabelKey: rt.labelKey, semester: sem.semester, subject: ecue.name, chapter: ch.title, ecueCode: ecue.code, chapterId: ch.id });
            });
          });
        });
      });
    });
  });

  const subjectsSet = [...new Set(flat.map(f => f.subject))];

  const html = `
    <div class="page-header"><h1 data-i18n="nav_resources"></h1></div>

    <div class="card" style="margin-bottom:18px;">
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <select id="filter-semester" class="field-select" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);">
          <option value="">${t("prepa_semester")}</option>
          <option value="1">${t("prepa_semester")} 1</option>
          <option value="2">${t("prepa_semester")} 2</option>
        </select>
        <select id="filter-type" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);">
          <option value="">Type</option>
          ${RESOURCE_TYPES.map(rt => `<option value="${rt.key}">${rt.icon} ${t(rt.labelKey)}</option>`).join("")}
        </select>
        <select id="filter-lang" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);">
          <option value="">🌐 ${t("settings_language")}</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="en">🇬🇧 English</option>
          <option value="ar">🇹🇳 العربية</option>
        </select>
      </div>
    </div>

    <div id="resource-results">
      ${flat.length ? flat.map(resourceRowHtml).join("") : `<div class="empty-state"><div class="empty-emoji">📚</div><p data-i18n="prepa_no_resources"></p></div>`}
    </div>

    <div class="page-header" style="margin-top:26px;"><h1 style="font-size:16px;" data-i18n="history_title"></h1></div>
    ${history.length ? history.slice(0, 10).map(h => `
      <div class="list-row"><div><div class="list-row-title">${h.label}</div><div class="list-row-sub">${h.type}</div></div></div>
    `).join("") : `<div class="empty-state"><p data-i18n="history_empty"></p></div>`}
  `;

  setTimeout(() => {
    const applyFilters = () => {
      const sem = document.getElementById("filter-semester").value;
      const type = document.getElementById("filter-type").value;
      const lang = document.getElementById("filter-lang").value;
      const filtered = flat.filter(r =>
        (!sem || String(r.semester) === sem) &&
        (!type || r.type === type) &&
        (!lang || r.language === lang)
      );
      document.getElementById("resource-results").innerHTML = filtered.length ? filtered.map(resourceRowHtml).join("") : `<div class="empty-state"><p>${t("search_no_results")}</p></div>`;
      bindResourceNav();
    };
    ["filter-semester", "filter-type", "filter-lang"].forEach(id => document.getElementById(id).addEventListener("change", applyFilters));
    bindResourceNav();
  }, 0);

  return html;
};

function resourceRowHtml(r) {
  const verifiedBadge = r.verified ? `<span class="badge badge-td">${t("common_verified")}</span>` : `<span class="badge badge-neutral">${t("common_unverified")}</span>`;
  return `
    <div class="list-row" data-nav-ecue="${r.semester}|${r.ecueCode}|${r.chapterId}" style="cursor:pointer;">
      <div>
        <div class="list-row-title">${r.typeIcon} ${r.title || r.chapter}</div>
        <div class="list-row-sub">${r.subject} — ${r.chapter} ${r.language ? "· " + r.language.toUpperCase() : ""}</div>
      </div>
      ${verifiedBadge}
    </div>
  `;
}
function bindResourceNav() {
  document.querySelectorAll("[data-nav-ecue]").forEach(el => {
    el.addEventListener("click", () => {
      const [sem, code, chId] = el.getAttribute("data-nav-ecue").split("|");
      App.navigate(`prepa/${sem}/${code}/${chId}`);
    });
  });
}
