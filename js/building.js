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

Pages.explore = async function (params) {
  const rooms = await Data.rooms();
  const activeFloorId = (params && params[0]) || "general";

  const floorLabel = (f) => f.num ? `${t(f.labelKey)} ${f.num}` : t(f.labelKey);

  const isOverview = activeFloorId === "general";
  const floorRooms = isOverview ? [] : rooms.filter(r => String(r.floor) === activeFloorId || (activeFloorId === "ground" && r.floor === 0));

  const html = `
    <div class="page-header"><h1 data-i18n="explore_title"></h1></div>
    <div class="floor-tabs" id="floor-tabs">
      <button class="floor-tab ${isOverview ? "active" : ""}" data-floor="general">🏢 Vue générale</button>
      ${BUILDING_FLOORS.map(f => `<button class="floor-tab ${activeFloorId === f.id ? "active" : ""}" data-floor="${f.id}">${f.emoji} ${floorLabel(f)}</button>`).join("")}
    </div>

    <div class="building-image-frame" style="margin-bottom:16px;">
      <img src="${isOverview ? BUILDING_IMAGES.general : BUILDING_IMAGES.exploded}" alt="Bâtiment ISI" />
    </div>

    ${isOverview ? `
      <div class="card-grid">
        <div class="card"><div class="card-icon-tile">🏗️</div><div class="card-title">Vue éclatée</div><img src="${BUILDING_IMAGES.exploded}" style="border-radius:10px;margin-top:8px;" /></div>
        <div class="card"><div class="card-icon-tile">✂️</div><div class="card-title">Coupe</div><img src="${BUILDING_IMAGES.cutaway}" style="border-radius:10px;margin-top:8px;" /></div>
        <div class="card"><div class="card-icon-tile">📐</div><div class="card-title">Coupe transversale</div><img src="${BUILDING_IMAGES.crosssection}" style="border-radius:10px;margin-top:8px;" /></div>
      </div>
      <p class="card-sub" style="margin-top:14px;" data-i18n="explore_select_floor"></p>
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
