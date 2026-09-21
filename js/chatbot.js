// =====================================================
// CHATBOT.JS — Assistant Allez-y (entièrement frontend)
// Correspondance de questions + réponses dynamiques basées
// sur les données locales (emploi du temps, profil...)
// =====================================================

function normalizeText(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // enlève accents
    .replace(/[?!.,;:'"]/g, "")
    .trim();
}

const Chatbot = {
  async match(userText) {
    const data = await Data.chatbot();
    const norm = normalizeText(userText);
    let best = null;
    let bestScore = 0;
    data.entries.forEach(entry => {
      entry.questions.forEach(q => {
        const nq = normalizeText(q);
        let score = 0;
        if (norm === nq) score = 100;
        else if (norm.includes(nq) || nq.includes(norm)) score = 70;
        else {
          // score par mots communs
          const wordsA = new Set(norm.split(/\s+/));
          const wordsB = new Set(nq.split(/\s+/));
          let common = 0;
          wordsA.forEach(w => { if (wordsB.has(w) && w.length > 2) common++; });
          score = common * 15;
        }
        if (score > bestScore) { bestScore = score; best = entry; }
      });
    });
    if (bestScore < 15) return null;
    return best;
  },

  async answer(userText) {
    const entry = await this.match(userText);
    if (!entry) return t("assistant_fallback");
    if (entry.answerType === "static") {
      const lang = Storage.getLang();
      return entry[`answer_${lang}`] || entry.answer_fr;
    }
    return await this.dynamicAnswer(entry.dynamicKey, userText);
  },

  async dynamicAnswer(key, userText) {
    const session = App.session;
    const sessions = await Data.timetable();

    if (key === "greeting") {
      return t("assistant_greeting", { name: session.firstName || session.fullName });
    }

    if (key === "profile-info") {
      const p = session.profile;
      if (!p) return t("assistant_fallback");
      return `${session.firstName} — ${p.level}, ${p.cycle}, ${t("profile_group")} ${p.group}, ${t("profile_semester")} ${p.semester}.`;
    }

    if (key === "next-session" || key === "next-room") {
      const { current, next, nextDayOffset } = Timetable.getCurrentAndNext(sessions);
      if (!next) return t("dashboard_no_more_today");
      const when = nextDayOffset === 0 ? `${next.start}` : `${t(dayKeyLabel(next.day))}`;
      if (key === "next-room") return `🏫 ${next.room} (${next.subject}, ${when})`;
      return `📘 ${next.subject} — ${when} → ${next.end}, ${next.room}, ${next.teacher}`;
    }

    if (key === "today-sessions") {
      const list = Timetable.sessionsForDay(sessions, Timetable.todayKey());
      if (!list.length) return t("timetable_no_session");
      return list.map(s => `• <bdi dir="ltr">${s.start}-${s.end}</bdi> ${s.subject} (${s.room})`).join("\n");
    }

    if (key === "tomorrow-sessions") {
      const list = Timetable.sessionsForDay(sessions, Timetable.tomorrowKey());
      if (!list.length) return t("timetable_no_session");
      return list.map(s => `• <bdi dir="ltr">${s.start}-${s.end}</bdi> ${s.subject} (${s.room})`).join("\n");
    }

    if (key === "room-lookup") {
      const rooms = await Data.rooms();
      const found = rooms.find(r => normalizeText(userText).includes(r.id.toLowerCase()));
      if (!found) return t("rooms_not_found");
      return `${found.name} → ${t("rooms_block")} ${found.block}, ${t("rooms_floor")} ${found.floor}, ${t("rooms_room")} ${found.roomNumber}.`;
    }

    if (key === "teacher-lookup") {
      const teachers = await Data.teachers();
      const norm = normalizeText(userText);
      const found = teachers.find(tch => norm.includes(normalizeText(tch.name)) || tch.subjects.some(s => norm.includes(normalizeText(s))));
      if (!found) return t("teachers_no_data");
      return `👨‍🏫 ${found.name} — ${found.subjects.join(", ")}`;
    }

    if (key === "revision-today") {
      const list = Timetable.sessionsForDay(sessions, Timetable.todayKey());
      if (!list.length) return t("timetable_no_session");
      const subjects = [...new Set(list.map(s => s.subject))];
      return `📚 ${subjects.join(", ")}`;
    }

    return t("assistant_fallback");
  }
};

function dayKeyLabel(day) {
  const map = { monday: "day_monday", tuesday: "day_tuesday", wednesday: "day_wednesday", thursday: "day_thursday", friday: "day_friday", saturday: "day_saturday", sunday: "day_sunday" };
  return map[day] || "day_monday";
}

Pages.assistant = async function () {
  const chatData = await Data.chatbot();
  const history = Storage.getChatHistory();

  const html = `
    <div class="page-header"><h1 data-i18n="assistant_title"></h1></div>
    <div class="chat-shell">
      <div class="chat-messages" id="chat-messages">
        ${history.length ? history.map(m => chatBubbleHtml(m)).join("") : chatBubbleHtml({ role: "bot", text: t("assistant_greeting", { name: App.session.firstName || App.session.fullName }) })}
      </div>
      <div class="chat-suggestions" id="chat-suggestions">
        ${chatData.suggestions.map(s => `<button class="chat-suggestion-chip" data-suggestion="${(s[`text_${Storage.getLang()}`] || s.text_fr).replace(/"/g, "&quot;")}">${s.icon} ${s[`text_${Storage.getLang()}`] || s.text_fr}</button>`).join("")}
      </div>
      <div class="chat-input-row">
        <input type="text" id="chat-input" data-i18n-placeholder="assistant_placeholder" placeholder="${t("assistant_placeholder")}" />
        <button class="chat-send-btn" id="chat-send-btn">➤</button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("chat-send-btn");
    const send = async () => {
      const text = input.value.trim();
      if (!text) return;
      appendChatMessage("user", text);
      input.value = "";
      const answer = await Chatbot.answer(text);
      setTimeout(() => appendChatMessage("bot", answer), 250);
    };
    sendBtn.addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
    document.querySelectorAll("[data-suggestion]").forEach(chip => {
      chip.addEventListener("click", async () => {
        const text = chip.getAttribute("data-suggestion");
        appendChatMessage("user", text);
        const answer = await Chatbot.answer(text);
        setTimeout(() => appendChatMessage("bot", answer), 250);
      });
    });
    scrollChatToBottom();
  }, 0);

  return html;
};

function chatBubbleHtml(m) {
  return `<div class="chat-msg ${m.role === "user" ? "user" : "bot"}">${(m.text || "").replace(/\n/g, "<br>")}</div>`;
}

function appendChatMessage(role, text) {
  const history = Storage.getChatHistory();
  history.push({ role, text });
  Storage.setChatHistory(history);
  const container = document.getElementById("chat-messages");
  if (container) {
    const el = document.createElement("div");
    el.innerHTML = chatBubbleHtml({ role, text });
    container.appendChild(el.firstElementChild);
    scrollChatToBottom();
  }
}
function scrollChatToBottom() {
  const container = document.getElementById("chat-messages");
  if (container) container.scrollTop = container.scrollHeight;
}
