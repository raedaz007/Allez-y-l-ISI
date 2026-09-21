// =====================================================
// ROOMS.JS — Gestion des salles
// =====================================================

const RoomsHelper = {
  parseRoomQuery(query) {
    // Interprète "A206" -> Bloc A, Étage 2, Salle 06
    const m = query.trim().toUpperCase().match(/^([A-Z])(\d)(\d{2})$/);
    if (!m) return null;
    return { block: m[1], floor: parseInt(m[2], 10), roomNumber: m[3] };
  },

  currentSessionInRoom(sessions, roomId) {
    const { current } = Timetable.getCurrentAndNext(sessions.filter(s => s.room === roomId));
    return current;
  }
};

Pages.rooms = async function (params) {
  const rooms = await Data.rooms();
  const sessions = await Data.timetable();
  const roomId = params && params[0];

  if (roomId) {
    return roomDetailHtml(roomId, rooms, sessions);
  }

  const html = `
    <div class="page-header"><h1 data-i18n="nav_rooms"></h1></div>
    <div class="topbar-search" style="max-width:420px;margin-bottom:16px;">
      <span class="search-icon">🔎</span>
      <input type="text" id="room-search-input" data-i18n-placeholder="rooms_search_placeholder" placeholder="${t("rooms_search_placeholder")}" style="width:100%;" />
    </div>
    <div class="room-block-grid" id="room-grid">
      ${rooms.map(r => `<div class="room-tile" data-room-id="${r.id}">${r.name}</div>`).join("")}
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll("[data-room-id]").forEach(el => {
      el.addEventListener("click", () => App.navigate("rooms/" + el.getAttribute("data-room-id")));
    });
    const input = document.getElementById("room-search-input");
    input.addEventListener("input", () => {
      const q = input.value.trim().toUpperCase();
      document.querySelectorAll("#room-grid .room-tile").forEach(tile => {
        tile.style.display = tile.getAttribute("data-room-id").toUpperCase().includes(q) ? "" : "none";
      });
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const parsed = RoomsHelper.parseRoomQuery(input.value);
        const match = rooms.find(r => r.id.toUpperCase() === input.value.trim().toUpperCase());
        if (match) App.navigate("rooms/" + match.id);
      }
    });
  }, 0);

  return html;
};

function roomDetailHtml(roomId, rooms, sessions) {
  const room = rooms.find(r => r.id.toUpperCase() === roomId.toUpperCase());
  if (!room) {
    return `
      <div class="page-header"><h1>${roomId}</h1></div>
      <div class="empty-state"><div class="empty-emoji">❓</div><p data-i18n="rooms_not_found"></p></div>
      <button class="btn btn-outline" data-action="nav" data-route="rooms" style="margin-top:10px;" data-i18n="common_back"></button>
    ` + bindBackButtonSoon();
  }
  Storage.pushHistory({ id: `room-${room.id}`, type: "room", label: room.name });

  const roomSessions = sessions.filter(s => s.room === room.id);
  const current = RoomsHelper.currentSessionInRoom(sessions, room.id);
  const isFav = Storage.isFavorite(`room-${room.id}`);

  const html = `
    <div class="page-header">
      <h1>${room.name}</h1>
    </div>
    <div class="card" style="max-width:440px;">
      <div class="detail-row"><span class="detail-label" data-i18n="rooms_block"></span><span class="detail-value">${room.block}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="rooms_floor"></span><span class="detail-value">${room.floor}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="rooms_room"></span><span class="detail-value">${room.roomNumber}</span></div>
      ${current ? `
      <div class="detail-row"><span class="detail-label" data-i18n="rooms_current_course"></span><span class="detail-value">${current.subject}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="rooms_teacher"></span><span class="detail-value">${current.teacher}</span></div>
      <div class="detail-row"><span class="detail-label" data-i18n="rooms_group"></span><span class="detail-value">${current.group}</span></div>
      ` : `<p class="card-sub" style="margin-top:10px;" data-i18n="rooms_no_current"></p>`}
      <button class="btn btn-outline btn-sm btn-block" style="margin-top:14px;" id="fav-room-btn">${isFav ? "⭐ " + t("fav_remove") : "☆ " + t("fav_add")}</button>
    </div>

    ${roomSessions.length ? `
    <div class="page-header" style="margin-top:20px;"><h1 style="font-size:16px;" data-i18n="nav_timetable"></h1></div>
    <div class="day-list">
      ${roomSessions.map(s => SessionBlockHTML(s, current)).join("")}
    </div>` : ""}

    <button class="btn btn-outline" data-action="nav" data-route="rooms" style="margin-top:16px;" data-i18n="common_back"></button>
  `;

  setTimeout(() => {
    bindSessionClicks();
    bindNavActions();
    const favBtn = document.getElementById("fav-room-btn");
    if (favBtn) favBtn.addEventListener("click", () => {
      const added = Storage.toggleFavorite({ id: `room-${room.id}`, type: "room", label: room.name, meta: `${t("rooms_block")} ${room.block} · ${t("rooms_floor")} ${room.floor}` });
      App.showToast("⭐", added ? t("toast_added_favorite") : t("toast_removed_favorite"));
      App.route();
    });
  }, 0);

  return html;
}

function bindBackButtonSoon() {
  setTimeout(bindNavActions, 0);
  return "";
}
