// =====================================================
// AUTH.JS — Choix du rôle + connexion locale/démonstrative
// AUCUNE authentification institutionnelle réelle.
// =====================================================

const Auth = {
  currentCaptcha: { a: 0, b: 0 },

  generateCaptcha() {
    this.currentCaptcha.a = Math.floor(Math.random() * 8) + 1;
    this.currentCaptcha.b = Math.floor(Math.random() * 8) + 1;
    return this.currentCaptcha;
  },

  isLoggedIn() {
    return !!Storage.getSession();
  },

  getSessionUser() {
    return Storage.getSession();
  },

  logout() {
    Storage.clearSession();
  },

  async findUserByEmail(email) {
    const users = await Data.users();
    const norm = (email || "").trim().toLowerCase();
    return users.find(u => u.email.toLowerCase() === norm) || null;
  },

  async login(email, captchaAnswer, remember) {
    const expected = this.currentCaptcha.a + this.currentCaptcha.b;
    if (parseInt(captchaAnswer, 10) !== expected) {
      return { ok: false, errorKey: "login_error_captcha" };
    }
    const user = await this.findUserByEmail(email);
    if (!user) {
      return { ok: false, errorKey: "login_error_email" };
    }
    const students = await Data.students();
    const profile = students.find(s => s.id === user.studentProfileId) || null;

    const session = {
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      role: user.role,
      profile,
      remember: !!remember,
      loginAt: Date.now()
    };
    Storage.setSession(session);
    return { ok: true, session };
  }
};
