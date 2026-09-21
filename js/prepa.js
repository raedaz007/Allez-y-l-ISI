// =====================================================
// PREPA.JS — Section Prépa Intégrée (basée sur le syllabus
// officiel fourni). Structure : Semestre > UE > ECUE > Chapitre
// =====================================================

const RESOURCE_TYPES = [
  { key: "youtube", icon: "📺", labelKey: "prepa_resources_youtube" },
  { key: "courses", icon: "📄", labelKey: "prepa_resources_courses" },
  { key: "exercises", icon: "✏️", labelKey: "prepa_resources_exercises" },
  { key: "corrections", icon: "✅", labelKey: "prepa_resources_corrections" },
  { key: "documents", icon: "📚", labelKey: "prepa_resources_documents" },
  { key: "td", icon: "📝", labelKey: "prepa_resources_td" },
  { key: "tp", icon: "🧪", labelKey: "prepa_resources_tp" },
];

function chapterStatusIcon(status) {
  if (status === "done") return "☑";
  if (status === "in-progress") return "🔵";
  return "○";
}

function computeEcueProgress(ecue, progress) {
  const total = ecue.chapters.length;
  if (!total) return 0;
  const done = ecue.chapters.filter(c => progress[c.id] === "done").length;
  return Math.round((done / total) * 100);
}

Pages.prepa = async function (params) {
  const semNum = params && params[0] ? parseInt(params[0], 10) : 1;
  const ecueCode = params && params[1];
  const chapterId = params && params[2];

  const sem = await Data.semester(semNum === 2 ? 2 : 1);
  const progress = Storage.getProgress();

  if (ecueCode) {
    return prepaEcueDetailHtml(sem, ecueCode, chapterId, progress);
  }

  const html = `
    <div class="page-header"><h1 data-i18n="prepa_title"></h1></div>
    <div class="semester-toggle">
      <button class="${sem.semester === 1 ? "active" : ""}" data-sem="1">${t("prepa_semester")} 1</button>
      <button class="${sem.semester === 2 ? "active" : ""}" data-sem="2">${t("prepa_semester")} 2</button>
    </div>
    <p class="card-sub" style="margin-bottom:14px;">${t("prepa_demo_notice")}</p>

    <div class="ue-accordion">
      ${sem.ues.map(ue => `
        <div class="ue-group">
          <div class="ue-group-header" data-toggle-ue="${ue.code}">
            <span>${ue.name}</span>
            <span class="ue-code">${ue.code}</span>
          </div>
          <div class="ecue-list hidden" id="ecue-list-${ue.code}">
            ${ue.ecues.map(ecue => {
              const pct = computeEcueProgress(ecue, progress);
              return `
                <div class="ecue-item" data-ecue-code="${ecue.code}">
                  <span class="ecue-name">${ecue.name}</span>
                  <div class="progress-row" style="max-width:140px;">
                    <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
                    <span class="ecue-progress">${pct}%</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll("[data-sem]").forEach(btn => {
      btn.addEventListener("click", () => App.navigate("prepa/" + btn.getAttribute("data-sem")));
    });
    document.querySelectorAll("[data-toggle-ue]").forEach(header => {
      header.addEventListener("click", () => {
        const code = header.getAttribute("data-toggle-ue");
        document.getElementById("ecue-list-" + code).classList.toggle("hidden");
      });
    });
    document.querySelectorAll("[data-ecue-code]").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        App.navigate(`prepa/${sem.semester}/${el.getAttribute("data-ecue-code")}`);
      });
    });
    // Ouvre la première UE par défaut
    const first = document.querySelector(".ecue-list");
    if (first) first.classList.remove("hidden");
  }, 0);

  return html;
};

function prepaEcueDetailHtml(sem, ecueCode, chapterId, progress) {
  let foundEcue = null, foundUe = null;
  sem.ues.forEach(ue => {
    const e = ue.ecues.find(x => x.code === ecueCode);
    if (e) { foundEcue = e; foundUe = ue; }
  });
  if (!foundEcue) {
    return `<div class="empty-state"><p>ECUE introuvable.</p></div>
      <button class="btn btn-outline" data-action="nav" data-route="prepa/${sem.semester}" data-i18n="common_back"></button>` + bindBackButtonSoon();
  }
  Storage.pushHistory({ id: `ecue-${foundEcue.code}`, type: "ecue", label: foundEcue.name });

  if (chapterId) {
    const chapter = foundEcue.chapters.find(c => c.id === chapterId);
    if (chapter) return chapterDetailHtml(sem, foundUe, foundEcue, chapter, progress);
  }

  const pct = computeEcueProgress(foundEcue, progress);

  const html = `
    <div class="page-header">
      <h1>${foundEcue.name}</h1>
      <p>${foundUe.name} · ${t("prepa_semester")} ${sem.semester} · ${foundEcue.code}</p>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="eyebrow" data-i18n="prepa_progress_subject"></div>
      <div class="progress-row" style="margin-top:8px;">
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
        <div class="progress-pct">${pct}%</div>
      </div>
    </div>
    <div>
      ${foundEcue.chapters.map(c => `
        <div class="chapter-row" data-chapter-id="${c.id}">
          <span class="chapter-status-icon">${chapterStatusIcon(progress[c.id] || "not-started")}</span>
          <span class="chapter-title">${t("prepa_chapter")} ${c.chapter} — ${c.title}</span>
          <span>›</span>
        </div>
      `).join("")}
    </div>
    ${foundEcue.bibliography && foundEcue.bibliography.length ? `
    <div class="card" style="margin-top:16px;">
      <div class="eyebrow" data-i18n="prepa_bibliography"></div>
      <ul style="margin:10px 0 0;padding-inline-start:18px;font-size:12.5px;color:var(--text-secondary);line-height:1.7;">
        ${foundEcue.bibliography.map(b => `<li>${b}</li>`).join("")}
      </ul>
    </div>` : ""}
    <button class="btn btn-outline" data-action="nav" data-route="prepa/${sem.semester}" style="margin-top:16px;" data-i18n="common_back"></button>
  `;

  setTimeout(() => {
    bindNavActions();
    document.querySelectorAll("[data-chapter-id]").forEach(el => {
      el.addEventListener("click", () => App.navigate(`prepa/${sem.semester}/${foundEcue.code}/${el.getAttribute("data-chapter-id")}`));
    });
  }, 0);

  return html;
}

function chapterDetailHtml(sem, ue, ecue, chapter, progress) {
  Storage.pushHistory({ id: `chapter-${chapter.id}`, type: "chapter", label: chapter.title });
  const status = progress[chapter.id] || "not-started";
  const isFav = Storage.isFavorite(`chapter-${chapter.id}`);

  const resourceButtons = RESOURCE_TYPES.map(rt => {
    const list = chapter.resources[rt.key] || [];
    return `<span class="resource-chip-btn ${list.length ? "filled" : ""}">${rt.icon} <span data-i18n="${rt.labelKey}"></span> ${list.length ? `<span class="count">${list.length}</span>` : ""}</span>`;
  }).join("");

  const hasAnyResource = RESOURCE_TYPES.some(rt => (chapter.resources[rt.key] || []).length > 0);

  const html = `
    <div class="page-header">
      <h1>${t("prepa_chapter")} ${chapter.chapter} — ${chapter.title}</h1>
      <p>${ecue.name} · ${ue.name} · ${t("prepa_semester")} ${sem.semester}</p>
    </div>

    ${chapter.description && chapter.description.length ? `
    <div class="card" style="margin-bottom:14px;">
      <ul style="margin:0;padding-inline-start:18px;font-size:13px;color:var(--text-secondary);line-height:1.7;">
        ${chapter.description.map(d => `<li>${d}</li>`).join("")}
      </ul>
    </div>` : ""}

    <div class="card" style="margin-bottom:14px;">
      <div class="eyebrow">${t("prepa_chapter")} — statut</div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <button class="btn btn-sm ${status === "in-progress" ? "btn-primary" : "btn-secondary"}" data-set-status="in-progress" data-i18n="prepa_mark_progress"></button>
        <button class="btn btn-sm ${status === "done" ? "btn-primary" : "btn-secondary"}" data-set-status="done" data-i18n="prepa_mark_done"></button>
        <button class="btn btn-sm btn-ghost" data-set-status="not-started" data-i18n="prepa_mark_reset"></button>
      </div>
    </div>

    <div class="card">
      <div class="eyebrow" data-i18n="prepa_resources_courses"></div>
      <div class="resource-btn-row">${resourceButtons}</div>
      ${!hasAnyResource ? `<p class="empty-resource-note" data-i18n="prepa_no_resources"></p>` : ""}
      <button class="btn btn-outline btn-sm" style="margin-top:14px;" id="fav-chapter-btn">${isFav ? "⭐ " + t("fav_remove") : "☆ " + t("fav_add")}</button>
    </div>

    <button class="btn btn-outline" data-action="nav" data-route="prepa/${sem.semester}/${ecue.code}" style="margin-top:16px;" data-i18n="common_back"></button>
  `;

  setTimeout(() => {
    bindNavActions();
    document.querySelectorAll("[data-set-status]").forEach(btn => {
      btn.addEventListener("click", () => {
        Storage.setChapterStatus(chapter.id, btn.getAttribute("data-set-status"));
        App.route();
      });
    });
    const favBtn = document.getElementById("fav-chapter-btn");
    if (favBtn) favBtn.addEventListener("click", () => {
      const added = Storage.toggleFavorite({ id: `chapter-${chapter.id}`, type: "chapter", label: `${ecue.name} — ${chapter.title}`, meta: `S${sem.semester} · ${ecue.code}` });
      App.showToast("⭐", added ? t("toast_added_favorite") : t("toast_removed_favorite"));
      App.route();
    });
  }, 0);

  return html;
}
