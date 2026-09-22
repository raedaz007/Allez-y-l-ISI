// =====================================================
// BUILDING.JS — Explorer l'ISI (niveaux, images fournies)
// =====================================================

const BUILDING_FLOORS = [
  { id: "ground", labelKey: "explore_ground_floor", emoji: "🚪" },
  { id: "1", labelKey: "explore_floor", num: 1, emoji: "1️⃣" },
  { id: "2", labelKey: "explore_floor", num: 2, emoji: "2️⃣" },
  { id: "3", labelKey: "explore_floor", num: 3, emoji: "3️⃣" },
  { id: "4", labelKey: "explore_floor", num: 4, emoji: "4️⃣" },
  { id: "roof", labelKey: "explore_roof", emoji: "🏳️" },
];

// Une seule image générale/éclatée disponible pour tous les niveaux (fournie par le créateur)
const BUILDING_IMAGES = {
  general: "./assets/building/building-facade.jpg",
  exploded: "./assets/building/building-exploded.jpg",
  cutaway: "./assets/building/building-cutaway.jpg",
  crosssection: "./assets/building/building-crosssection.jpg",
};

// Visite 3D interactive (site tiers indépendant, fourni par le créateur du projet)
const BUILDING_3D_URL = "https://ariana-building-explorer.lovable.app/";

Pages.explore = async function (params) {
  const rooms = await Data.rooms();
  const activeFloorId = (params && params[0]) || "general";

  const floorLabel = (f) => f.num ? `${t(f.labelKey)} ${f.num}` : t(f.labelKey);

  const isOverview = activeFloorId === "general";
  const floorRooms = isOverview ? [] : rooms.filter(r => String(r.floor) === activeFloorId || (activeFloorId === "ground" && r.floor === 0));

  const html = `
    <div class="page-header"><h1 data-i18n="explore_title"></h1></div>
    <div class="floor-tabs" id="floor-tabs">
      <button class="floor-tab ${isOverview ? "active" : ""}" data-floor="general">🏢 <span data-i18n="explore_view_general"></span></button>
      ${BUILDING_FLOORS.map(f => `<button class="floor-tab ${activeFloorId === f.id ? "active" : ""}" data-floor="${f.id}">${f.emoji} ${floorLabel(f)}</button>`).join("")}
    </div>

    <div class="building-image-frame" style="margin-bottom:16px;">
      <img src="${isOverview ? BUILDING_IMAGES.general : BUILDING_IMAGES.exploded}" alt="Bâtiment ISI" />
    </div>

    ${isOverview ? `
      <div class="card-grid">
        <div class="card"><div class="card-icon-tile">🏗️</div><div class="card-title" data-i18n="explore_view_exploded"></div><img src="${BUILDING_IMAGES.exploded}" style="border-radius:10px;margin-top:8px;" /></div>
        <div class="card"><div class="card-icon-tile">✂️</div><div class="card-title" data-i18n="explore_view_cutaway"></div><img src="${BUILDING_IMAGES.cutaway}" style="border-radius:10px;margin-top:8px;" /></div>
        <div class="card"><div class="card-icon-tile">📐</div><div class="card-title" data-i18n="explore_view_crosssection"></div><img src="${BUILDING_IMAGES.crosssection}" style="border-radius:10px;margin-top:8px;" /></div>
      </div>
      <p class="card-sub" style="margin-top:14px;" data-i18n="explore_select_floor"></p>

      <div class="page-header" style="margin-top:26px;"><h1 style="font-size:16px;" data-i18n="explore_3d_title"></h1></div>
      <div class="card" style="margin-bottom:8px;">
        <p class="card-sub" style="margin-bottom:12px;" data-i18n="explore_3d_desc"></p>
        <a class="btn btn-outline btn-sm" href="${BUILDING_3D_URL}" target="_blank" rel="noopener noreferrer" data-i18n="explore_3d_open"></a>
        <div class="building-image-frame" style="margin-top:14px;height:480px;">
          <iframe id="explore-3d-iframe" src="${BUILDING_3D_URL}" title="Visite 3D — ISI" loading="lazy"
            style="width:100%;height:100%;border:0;display:block;"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
            referrerpolicy="no-referrer"></iframe>
        </div>
        <p class="card-sub" id="explore-3d-fallback-note" style="margin-top:8px;" data-i18n="explore_3d_unavailable"></p>
      </div>
    ` : `
      <div class="card">
        <div class="eyebrow" data-i18n="explore_rooms_known"></div>
        <div class="room-block-grid" style="margin-top:10px;">
          ${floorRooms.length ? floorRooms.map(r => `<div class="room-tile" data-room-id="${r.id}">${r.name}</div>`).join("") : `<p class="card-sub">—</p>`}
        </div>
      </div>
    `}
  `;

  setTimeout(() => {
    document.querySelectorAll("[data-floor]").forEach(btn => {
      btn.addEventListener("click", () => App.navigate("explore/" + btn.getAttribute("data-floor")));
    });
    document.querySelectorAll("[data-room-id]").forEach(el => {
      el.addEventListener("click", () => App.navigate("rooms/" + el.getAttribute("data-room-id")));
    });
  }, 0);

  return html;
};
