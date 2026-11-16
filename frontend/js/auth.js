/* ==========================================================
   auth.js — Autentikasi admin Café Acala (dipakai login & dashboard)
   Mekanisme disepakati dengan BE (card 13.1.1):
   - Sesi PHP berbasis cookie HttpOnly. FE TIDAK menyimpan token/password.
   - Semua request memakai credentials: "include".
   - Status autentikasi selalu dicek ke GET session.php (sumber kebenaran = server).
   Format response BE: { success, message, error_code, data }
   ========================================================== */
(function () {
  "use strict";

  // Relatif terhadap frontend/admin/*.html
  const API_ADMIN = "../../backend/api/admin/";
  const HALAMAN_LOGIN = "login.html";
  const HALAMAN_DASHBOARD = "dashboard.html";
  const FLASH_KEY = "acala_flash";
  const TIMEOUT_MS = 15000;

  /**
   * Kirim request ke API admin. TIDAK pernah melempar error.
   * terhubung=false  -> jaringan putus / timeout / server mati
   * ok=true          -> HTTP 2xx dan success === true
   */
  async function adminRequest(path, opsi) {
    const { method = "GET", body = null, simulasi = false, timeout = TIMEOUT_MS } = opsi || {};

    let url = API_ADMIN + path;
    // Untuk SQA: buka halaman dengan ?simulate_error=1 -> BE (APP_DEBUG) mengembalikan 500.
    if (simulasi && new URLSearchParams(location.search).get("simulate_error") === "1") {
      url += (url.includes("?") ? "&" : "?") + "simulate_error=1";
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        cache: "no-store",
        headers: body
          ? { "Content-Type": "application/json", Accept: "application/json" }
          : { Accept: "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });

      let json = null;
      try { json = await res.json(); } catch (_) { /* bukan JSON (mis. HTML error PHP) */ }

      return {
        terhubung: true,
        status: res.status,
        ok: res.ok && !!json && json.success === true,
        kode: (json && json.error_code) || null,
        pesan: (json && json.message) || "",
        data: json ? json.data : null,
      };
    } catch (_) {
      return { terhubung: false, status: 0, ok: false, kode: null, pesan: "", data: null };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Untuk API admin LAIN (menu, kategori, dst. pada card berikutnya).
   * Satu tempat menangani 401 ADM-4012 (sesi berakhir) -> arahkan ke login.
   * Jangan dipakai untuk login / session / logout (ketiganya menangani 401 sendiri).
   */
  async function adminApi(path, opsi) {
    const r = await adminRequest(path, opsi);
    if (r.status === 401 && r.kode === "ADM-4012") {
      location.replace(HALAMAN_LOGIN);
    }
    return r;
  }

  /** Cek sesi ke server. status: "valid" | "tidak-valid" | "gagal" (server tidak terjangkau/error). */
  async function cekSesi() {
    const r = await adminRequest("session");
    if (r.ok && r.data && r.data.authenticated) {
      return { status: "valid", admin: r.data.admin || {} };
    }
    if (r.status === 401) return { status: "tidak-valid" };
    return { status: "gagal" };
  }

  function login(username, password) {
    return adminRequest("login", { method: "POST", body: { username, password }, simulasi: true });
  }

  /**
   * Hapus status autentikasi di sisi FE.
   * Cookie sesi bersifat HttpOnly sehingga dihapus oleh BE (card 13.2.1), dan FE tidak
   * menyimpan token/password. Fungsi ini membersihkan sisa status apa pun yang mungkin
   * tersimpan di browser (kunci "acala_auth*", "acala_admin*", "acala_token*", "acala_session*").
   * Kunci pesan flash (acala_flash) sengaja tidak dihapus.
   */
  function hapusStatusAuth() {
    const POLA = /^acala[_-]?(auth|admin|token|session)/i;
    [window.localStorage, window.sessionStorage].forEach((st) => {
      try {
        Object.keys(st).filter((k) => POLA.test(k)).forEach((k) => st.removeItem(k));
      } catch (_) { /* penyimpanan tidak tersedia */ }
    });
  }

  /**
   * Kirim logout ke BE. Status autentikasi FE dihapus hanya jika logout berhasil
   * (atau sesi memang sudah berakhir: 401 ADM-4012). Bila gagal, status tetap.
   */
  async function logout() {
    const r = await adminRequest("logout", { method: "POST", simulasi: true });
    if (r.ok || (r.status === 401 && r.kode === "ADM-4012")) hapusStatusAuth();
    return r;
  }

  // Pesan sekali tampil lintas halaman (mis. "Anda berhasil logout.")
  function setFlash(nilai) {
    try { sessionStorage.setItem(FLASH_KEY, nilai); } catch (_) {}
  }
  function ambilFlash() {
    try {
      const v = sessionStorage.getItem(FLASH_KEY);
      sessionStorage.removeItem(FLASH_KEY);
      return v;
    } catch (_) { return null; }
  }

  window.AcalaAuth = {
    HALAMAN_LOGIN, HALAMAN_DASHBOARD,
    adminRequest, adminApi, cekSesi, login, logout, hapusStatusAuth, setFlash, ambilFlash,
  };
})();