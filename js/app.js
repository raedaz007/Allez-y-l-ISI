// =====================================================
// APP.JS — Coeur de l'application : routeur, shell,
// sidebar, topbar, toasts, modals
// =====================================================

const NAV_ITEMS = [
  { route: "dashboard", icon: "🏠", key: "nav_home" },
  { route: "timetable", icon: "📅", key: "nav_timetable" },
  { route: "rooms", icon: "🏫", key: "nav_rooms" },
  { route: "explore", icon: "🗺️", key: "nav_explore" },
  { route: "teachers", icon: "👨‍🏫", key: "nav_teachers" },
  { route: "subjects", icon: "📚", key: "nav_subjects" },
  { route: "search", icon: "🔎", key: "nav_search" },
  { route: "prepa", icon: "🎓", key: "nav_prepa" },
  { route: "resources", icon: "📖", key: "nav_resources" },
  { route: "assistant", icon: "🤖", key: "nav_assistant" },
  { route: "publications", icon: "📢", key: "nav_publications" },
  { route: "notifications", icon: "🔔", key: "nav_notifications" },
  { route: "calendar", icon: "📆", key: "nav_calendar" },
  { route: "favorites", icon: "⭐", key: "nav_favorites" },
  { route: "notes", icon: "📝", key: "nav_notes" },
  { route: "tasks", icon: "✅", key: "nav_tasks" },
  { route: "progress", icon: "📊", key: "nav_progress" },
  { route: "pomodoro", icon: "⏱️", key: "nav_pomodoro" },
  { route: "profile", icon: "👤", key: "nav_profile" },
  { route: "settings", icon: "⚙️", key: "nav_settings" },
  { route: "about", icon: "ℹ️", key: "nav_about" },
];

const App = {
  session: null,

  async init() {
    // Thème
    document.documentElement.setAttribute("data-theme", Storage.getTheme());
    // Langue
    applyLanguage(Storage.getLang());

    this.session = Auth.getSessionUser();

    window.addEventListener("hashchange", () => this.route());

    if (!Storage.hasOnboarded()) {
      this.renderOnboardingRole();
      return;
    }
    if (!this.session) {
      const role = Storage.getRole();
      if (role) this.renderLogin();
      else this.renderOnboardingRole();
      return;
    }

    this.renderShell();
    this.route();
    Notifications.scheduleChecks();
  },

  // ---------------- Routing ----------------
  currentRoute() {
    const hash = location.hash.replace(/^#\/?/, "");
    return hash || "dashboard";
  },

  navigate(route) {
    location.hash = "#/" + route;
  },

  route() {
    if (!this.session) return;
    const full = this.currentRoute();
    const [route, ...rest] = full.split("/");
    const params = rest;
    this.setActiveNav(route);
    this.closeSidebarMobile();

    const renderers = {
      dashboard: () => Pages.dashboard(),
      timetable: () => Pages.timetable(params),
      rooms: () => Pages.rooms(params),
      explore: () => Pages.explore(params),
      teachers: () => Pages.teachers(params),
      subjects: () => Pages.subjects(),
      search: () => Pages.search(params),
      prepa: () => Pages.prepa(params),
      resources: () => Pages.resources(params),
      assistant: () => Pages.assistant(),
      publications: () => Pages.publications(),
      notifications: () => Pages.notifications(),
      calendar: () => Pages.calendar(),
      favorites: () => Pages.favorites(),
      notes: () => Pages.notes(),
      tasks: () => Pages.tasks(),
      progress: () => Pages.progress(),
      pomodoro: () => Pages.pomodoro(),
      profile: () => Pages.profile(),
      settings: () => Pages.settings(),
      about: () => Pages.about(),
    };

    const fn = renderers[route] || renderers.dashboard;
    const content = document.getElementById("content-area");
    content.innerHTML = `<div class="empty-state">${t("common_loading")}</div>`;
    Promise.resolve(fn()).then(html => {
      if (typeof html === "string") content.innerHTML = html;
      translateStaticDom(content);
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    });
  },

  // ---------------- Shell (sidebar + topbar) ----------------
  renderShell() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="app-shell">
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-brand">
            <span class="logo-emoji">🎓</span>
            <span class="brand-text">Allez-y à l'ISI<small data-i18n="tagline_short"></small></span>
          </div>
          <nav class="sidebar-nav" id="sidebar-nav"></nav>
          <div class="sidebar-footer">
            <div class="sidebar-mini-controls">
              <button class="mini-btn" id="btn-theme-toggle">🌙/🌞</button>
              <button class="mini-btn" id="btn-lang-cycle">🌐 ${Storage.getLang().toUpperCase()}</button>
            </div>
          </div>
        </aside>
        <div class="main-area">
          <header class="topbar">
            <button class="hamburger-btn" id="btn-hamburger" aria-label="Menu">☰</button>
            <div class="topbar-search">
              <span class="search-icon">🔎</span>
              <input type="text" id="global-search-input" data-i18n-placeholder="search_placeholder" placeholder="${t("search_placeholder")}" />
            </div>
            <div class="topbar-spacer"></div>
            <div class="topbar-actions">
              <button class="icon-btn" id="btn-notif-top" data-tooltip="${t("nav_notifications")}">🔔</button>
              <div class="user-chip" id="user-chip-btn">
                <span class="user-avatar" id="user-avatar-init">?</span>
                <span class="user-name" id="user-chip-name"></span>
              </div>
            </div>
          </header>
          <main class="content-area" id="content-area"></main>
          <footer class="app-footer">
            <div class="footer-inner">
              <div>🎓 Allez-y à l'ISI — <span data-i18n="footer_independent"></span></div>
              <div class="footer-links">
                <a href="#/about" data-i18n="nav_about"></a>
                <a href="#/settings" data-i18n="nav_settings"></a>
              </div>
              <div>© 2026 Allez-y à l'ISI — <span data-i18n="footer_rights"></span></div>
            </div>
          </footer>
        </div>
      </div>
      <div id="modal-root"></div>
      <div id="toast-container"></div>
    `;

    this.renderSidebarNav();
    translateStaticDom(app);

    document.getElementById("btn-hamburger").addEventListener("click", () => this.toggleSidebarMobile());
    document.getElementById("sidebar-overlay").addEventListener("click", () => this.closeSidebarMobile());
    document.getElementById("btn-theme-toggle").addEventListener("click", () => this.toggleTheme());
    document.getElementById("btn-lang-cycle").addEventListener("click", () => this.cycleLanguage());
    document.getElementById("user-chip-btn").addEventListener("click", () => this.navigate("profile"));
    document.getElementById("btn-notif-top").addEventListener("click", () => this.navigate("notifications"));

    const searchInput = document.getElementById("global-search-input");
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && searchInput.value.trim()) {
        this.navigate("search/" + encodeURIComponent(searchInput.value.trim()));
      }
    });

    this.updateUserChip();
  },

  renderSidebarNav() {
    const nav = document.getElementById("sidebar-nav");
    nav.innerHTML = NAV_ITEMS.map(item => `
      <div class="nav-item" data-route="${item.route}">
        <span class="nav-icon">${item.icon}</span>
        <span data-i18n="${item.key}"></span>
      </div>
    `).join("");
    nav.querySelectorAll(".nav-item").forEach(el => {
      el.addEventListener("click", () => this.navigate(el.getAttribute("data-route")));
    });
  },

  setActiveNav(route) {
    document.querySelectorAll(".nav-item").forEach(el => {
      el.classList.toggle("active", el.getAttribute("data-route") === route);
    });
  },

  updateUserChip() {
    if (!this.session) return;
    const initials = (this.session.firstName || this.session.fullName || "?").slice(0, 1).toUpperCase();
    const avatarEl = document.getElementById("user-avatar-init");
    const nameEl = document.getElementById("user-chip-name");
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = this.session.firstName || this.session.fullName;
  },

  toggleSidebarMobile() {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("sidebar-overlay").classList.toggle("show");
  },
  closeSidebarMobile() {
    const sb = document.getElementById("sidebar");
    const ov = document.getElementById("sidebar-overlay");
    if (sb) sb.classList.remove("open");
    if (ov) ov.classList.remove("show");
  },

  toggleTheme() {
    const cur = Storage.getTheme();
    const next = cur === "dark" ? "light" : "dark";
    Storage.setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  },

  cycleLanguage() {
    const order = ["fr", "en", "ar"];
    const cur = Storage.getLang();
    const next = order[(order.indexOf(cur) + 1) % order.length];
    applyLanguage(next);
    this.showToast("🌐", t("toast_lang_changed"));
    this.renderShell();
    this.route();
  },

  // ---------------- Toasts ----------------
  showToast(icon, message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, 3200);
  },

  // ---------------- Modals ----------------
  openModal(innerHtml) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `<div class="modal-backdrop" id="active-modal"><div class="modal-box">${innerHtml}</div></div>`;
    translateStaticDom(root);
    requestAnimationFrame(() => document.getElementById("active-modal").classList.add("show"));
    document.getElementById("active-modal").addEventListener("click", (e) => {
      if (e.target.id === "active-modal") App.closeModal();
    });
    root.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", () => App.closeModal()));
  },
  closeModal() {
    const modal = document.getElementById("active-modal");
    if (!modal) return;
    modal.classList.remove("show");
    setTimeout(() => { document.getElementById("modal-root").innerHTML = ""; }, 200);
  },

  // ---------------- Landing page + choix du rôle ----------------
  renderOnboardingRole() {
    const app = document.getElementById("app");
    const lang = Storage.getLang();
    app.innerHTML = `
      <div class="landing">
        <div class="landing-topbar">
          <div class="brand">🎓 <span>Allez-y à l'ISI</span></div>
          <div class="landing-topbar-actions">
            <button class="mini-btn" id="landing-lang-btn">🌐 ${lang.toUpperCase()}</button>
            <button class="mini-btn" id="landing-theme-btn">🌙/🌞</button>
          </div>
        </div>

        <div class="landing-hero">
          <div class="hero-emoji">🎓</div>
          <h1>Allez-y à l'ISI</h1>
          <p class="tagline" data-i18n="tagline"></p>
          <div class="landing-banner" data-i18n="disclaimer_banner"></div>
          <div class="landing-role-buttons">
            <button class="btn btn-primary btn-lg" data-role="student">👨‍🎓 <span data-i18n="landing_student_btn"></span></button>
            <button class="btn btn-secondary btn-lg" data-role="teacher">👨‍🏫 <span data-i18n="landing_teacher_btn"></span></button>
          </div>
        </div>

        <div class="landing-cards">
          <div class="card"><div class="card-icon-tile">📅</div><div class="card-title" data-i18n="landing_feature_timetable"></div></div>
          <div class="card"><div class="card-icon-tile">🏫</div><div class="card-title" data-i18n="landing_feature_rooms"></div></div>
          <div class="card"><div class="card-icon-tile">🎓</div><div class="card-title" data-i18n="landing_feature_prepa"></div></div>
          <div class="card"><div class="card-icon-tile">📖</div><div class="card-title" data-i18n="landing_feature_resources"></div></div>
          <div class="card"><div class="card-icon-tile">🤖</div><div class="card-title" data-i18n="landing_feature_assistant"></div></div>
          <div class="card"><div class="card-icon-tile">📢</div><div class="card-title" data-i18n="landing_feature_info"></div></div>
        </div>

        <div class="landing-footer">
          <div>🎓 Allez-y à l'ISI — <span data-i18n="footer_independent"></span></div>
          <div class="footer-team">Raed Azouzi · Adem Hmila · Assyl Khamila · Yassmin Fouratii · Islem Ayari · Yakin Mkadem</div>
          <div class="footer-links">
            <button class="btn-ghost" style="border:none;background:none;color:var(--accent);font-size:12.5px;" data-set-lang="fr">Français</button>
            <button class="btn-ghost" style="border:none;background:none;color:var(--accent);font-size:12.5px;" data-set-lang="en">English</button>
            <button class="btn-ghost" style="border:none;background:none;color:var(--accent);font-size:12.5px;" data-set-lang="ar">العربية</button>
          </div>
          <div>© 2026 Allez-y à l'ISI — <span data-i18n="footer_rights"></span></div>
        </div>
      </div>
    `;
    translateStaticDom(app);
    app.querySelectorAll("[data-role]").forEach(btn => {
      btn.addEventListener("click", () => {
        Storage.setRole(btn.getAttribute("data-role"));
        Storage.setOnboarded();
        this.renderLogin();
      });
    });
    document.getElementById("landing-theme-btn").addEventListener("click", () => this.toggleTheme());
    document.getElementById("landing-lang-btn").addEventListener("click", () => {
      const order = ["fr", "en", "ar"];
      const next = order[(order.indexOf(Storage.getLang()) + 1) % order.length];
      applyLanguage(next);
      this.renderOnboardingRole();
    });
    app.querySelectorAll("[data-set-lang]").forEach(btn => {
      btn.addEventListener("click", () => { applyLanguage(btn.getAttribute("data-set-lang")); this.renderOnboardingRole(); });
    });
  },

  // ---------------- Écran de connexion ----------------
  renderLogin() {
    const app = document.getElementById("app");
    const cap = Auth.generateCaptcha();
    app.innerHTML = `
      <div class="centered-screen">
        <div class="card login-card">
          <div style="font-size:32px;text-align:center;">🎓</div>
          <h1 style="font-size:19px;font-weight:800;text-align:center;margin-top:4px;" data-i18n="login_title"></h1>
          <form id="login-form" style="margin-top:18px;">
            <div class="field">
              <label data-i18n="login_email"></label>
              <input type="email" id="login-email" placeholder="prenom.nom@etudiant-isi.utm.tn" autocomplete="email" />
            </div>
            <div class="field">
              <label data-i18n="login_captcha_label"></label>
              <div class="captcha-row">
                <span class="captcha-question">${cap.a} + ${cap.b} = ?</span>
                <input type="number" id="login-captcha" style="width:80px;" />
              </div>
            </div>
            <div class="field field-check">
              <input type="checkbox" id="login-remember" />
              <label for="login-remember" style="margin:0;" data-i18n="login_remember"></label>
            </div>
            <div class="field-error hidden" id="login-error"></div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" data-i18n="login_submit"></button>
          </form>
          <div class="demo-hint" data-i18n="login_demo_hint"></div>
          <div class="demo-hint">Démo : mohamedraed.azouzi@etudiant-isi.utm.tn</div>
          <div style="text-align:center;margin-top:14px;">
            <button class="btn btn-ghost btn-sm" id="btn-back-role" data-i18n="common_back"></button>
          </div>
        </div>
      </div>
    `;
    translateStaticDom(app);
    document.getElementById("btn-back-role").addEventListener("click", () => this.renderOnboardingRole());
    document.getElementById("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const captcha = document.getElementById("login-captcha").value;
      const remember = document.getElementById("login-remember").checked;
      const errorEl = document.getElementById("login-error");
      errorEl.classList.add("hidden");

      if (!email || !captcha) {
        errorEl.textContent = t("login_error_generic");
        errorEl.classList.remove("hidden");
        return;
      }
      const result = await Auth.login(email, captcha, remember);
      if (!result.ok) {
        errorEl.textContent = t(result.errorKey);
        errorEl.classList.remove("hidden");
        Auth.generateCaptcha();
        return;
      }
      this.session = result.session;
      this.renderShell();
      this.navigate("dashboard");
      this.route();
      Notifications.scheduleChecks();
    });
  },

  logout() {
    Auth.logout();
    this.session = null;
    this.showToast("👋", t("toast_logged_out"));
    this.renderLogin();
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
