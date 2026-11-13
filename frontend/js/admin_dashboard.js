/* ==========================================================
   admin-dashboard.js — Pembatasan akses dashboard + logout
   Tanpa sesi valid -> redirect ke login.html
   ========================================================== */
(function () {
  "use strict";

  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);

  /* ---------- Guard sesi ---------- */
  async function periksaSesi() {
    root.classList.add("auth-pending");
    root.classList.remove("auth-error");

    const s = await AcalaAuth.cekSesi();

    if (s.status === "tidak-valid") {
      location.replace(AcalaAuth.HALAMAN_LOGIN);
      return;
    }
    if (s.status === "gagal") {
      // Tidak bisa memastikan sesi: jangan tampilkan dashboard
      root.classList.remove("auth-pending");
      root.classList.add("auth-error");
      return;
    }

    const nama = String(s.admin.username || "admin");
    const tampil = nama.charAt(0).toUpperCase() + nama.slice(1);
    $("adminNama").textContent = tampil;
    $("adminAvatar").textContent = tampil.charAt(0);
    root.classList.remove("auth-pending");
  }

  $("guardRetry").addEventListener("click", periksaSesi);

  // Tombol Back (bfcache) setelah logout: cek ulang, jangan tampilkan halaman lama
  window.addEventListener("pageshow", (e) => { if (e.persisted) periksaSesi(); });

  periksaSesi();

  /* ---------- Modal logout ---------- */
  const modal = $("logoutModal");
  const btnBuka = $("btnLogout");
  const btnBatal = $("logoutBatal");
  const btnYa = $("logoutYa");
  const yaLabel = btnYa.querySelector(".btn__label");
  const yaSpin = btnYa.querySelector(".spinner");
  const boxAlert = $("logoutAlert");
  let sedangLogout = false;
  let pemicu = null;

  function bukaModal() {
    pemicu = document.activeElement;
    boxAlert.hidden = true;
    yaLabel.textContent = "Ya, Logout";
    modal.hidden = false;
    btnBatal.focus();
  }
  function tutupModal() {
    if (sedangLogout) return;
    modal.hidden = true;
    if (pemicu) pemicu.focus();
  }
  function setLoading(aktif) {
    sedangLogout = aktif;
    btnYa.disabled = aktif;
    btnBatal.disabled = aktif;
    btnYa.setAttribute("aria-busy", aktif ? "true" : "false");
    yaSpin.hidden = !aktif;
    if (aktif) yaLabel.textContent = "Memproses...";
  }

  async function jalankanLogout() {
    if (sedangLogout) return;
    boxAlert.hidden = true;
    setLoading(true);

    const r = await AcalaAuth.logout();
    const sudahBerakhir = r.status === 401 && r.kode === "ADM-4012"; // sesi memang sudah habis

    if (r.ok || sudahBerakhir) {
      AcalaAuth.setFlash("logout");
      location.replace(AcalaAuth.HALAMAN_LOGIN);
      return;
    }

    setLoading(false);
    yaLabel.textContent = "Coba Lagi";
    boxAlert.hidden = false;
  }

  btnBuka.addEventListener("click", bukaModal);
  btnBatal.addEventListener("click", tutupModal);
  btnYa.addEventListener("click", jalankanLogout);
  modal.querySelector(".modal__backdrop").addEventListener("click", tutupModal);

  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") tutupModal();
    if (e.key === "Tab") {
      // Jaga fokus tetap di dalam dialog
      const f = [btnBatal, btnYa].filter((b) => !b.disabled);
      if (!f.length) { e.preventDefault(); return; }
      const awal = f[0], akhir = f[f.length - 1];
      if (e.shiftKey && document.activeElement === awal) { e.preventDefault(); akhir.focus(); }
      else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); awal.focus(); }
      else if (!f.includes(document.activeElement)) { e.preventDefault(); awal.focus(); }
    }
  });
})();
