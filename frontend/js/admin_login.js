/* ==========================================================
   admin-login.js — Logika halaman Login Admin (card 13.1.2)
   ========================================================== */
(function () {
  "use strict";

  const form = document.getElementById("loginForm");
  const inUser = document.getElementById("username");
  const inPass = document.getElementById("password");
  const btn = document.getElementById("loginBtn");
  const btnLabel = btn.querySelector(".btn__label");
  const spinner = btn.querySelector(".spinner");
  const toggle = document.getElementById("togglePassword");
  const alertBox = document.getElementById("loginAlert");
  const alertIcon = document.getElementById("loginAlertIcon");
  const alertTitle = document.getElementById("loginAlertTitle");
  const alertText = document.getElementById("loginAlertText");

  const PESAN = {
    usernameKosong: "Username wajib diisi",
    passwordKosong: "Password wajib diisi",
    salah: { varian: "error", judul: "Username atau password salah.", teks: "Silakan periksa kembali data login Anda." },
    nonaktif: { varian: "warning", judul: "Akun Anda tidak dapat digunakan.", teks: "Silakan hubungi pengelola website." },
    backend: { varian: "error", judul: "Login tidak dapat diproses saat ini.", teks: "Server tidak dapat dihubungi. Coba lagi." },
    logout: { varian: "success", judul: "Anda berhasil logout.", teks: "" },
  };

  let sedangProses = false; // cegah submit ganda

  /* ---------- Alert ---------- */
  function tampilAlert(p) {
    alertBox.className = "alert alert--" + p.varian;
    alertIcon.setAttribute("href", p.varian === "success" ? "#i-check" : "#i-alert");
    alertTitle.textContent = p.judul;
    alertText.textContent = p.teks;
    alertText.hidden = !p.teks;
    alertBox.hidden = false;
  }
  function sembunyiAlert() {
    alertBox.hidden = true;
  }

  /* ---------- Error per field ---------- */
  function setFieldError(input, pesan) {
    const err = document.getElementById(input.id + "Error");
    const ada = !!pesan;
    input.classList.toggle("is-invalid", ada);
    input.setAttribute("aria-invalid", ada ? "true" : "false");
    err.hidden = !ada;
    err.querySelector("span").textContent = pesan || "";
  }

  /* ---------- Loading ---------- */
  function setLoading(aktif) {
    sedangProses = aktif;
    btn.disabled = aktif;
    btn.setAttribute("aria-busy", aktif ? "true" : "false");
    btn.classList.toggle("is-loading", aktif);
    spinner.hidden = !aktif;
    btnLabel.textContent = aktif ? "Memproses..." : "Login";
    inUser.disabled = aktif;
    inPass.disabled = aktif;
    toggle.disabled = aktif;
  }

  /* ---------- Tampilkan / sembunyikan password ---------- */
  toggle.addEventListener("click", () => {
    const tampil = inPass.type === "password";
    inPass.type = tampil ? "text" : "password";
    toggle.setAttribute("aria-label", tampil ? "Sembunyikan password" : "Tampilkan password");
    toggle.setAttribute("aria-pressed", tampil ? "true" : "false");
    toggle.querySelector("use").setAttribute("href", tampil ? "#i-eye-off" : "#i-eye");
    inPass.focus();
  });

  /* ---------- Bersihkan error saat mengetik ---------- */
  [inUser, inPass].forEach((el) =>
    el.addEventListener("input", () => {
      setFieldError(el, "");
      sembunyiAlert();
    })
  );

  /* ---------- Submit ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sedangProses) return;

    sembunyiAlert();

    const username = inUser.value.trim();
    const password = inPass.value;

    // Validasi field kosong — TANPA memanggil API
    setFieldError(inUser, username ? "" : PESAN.usernameKosong);
    setFieldError(inPass, password ? "" : PESAN.passwordKosong);
    if (!username || !password) {
      (username ? inPass : inUser).focus();
      return;
    }

    setLoading(true);
    const r = await AcalaAuth.login(username, password);

    if (r.ok) {
      // Sesi sudah dibuat BE (cookie). Tombol dibiarkan loading sampai pindah halaman.
      location.replace(AcalaAuth.HALAMAN_DASHBOARD);
      return;
    }

    setLoading(false);

    if (r.status === 401 && r.kode === "ADM-4011") {
      tampilAlert(PESAN.salah);
      inPass.focus();
    } else if (r.status === 403 && r.kode === "ADM-4031") {
      tampilAlert(PESAN.nonaktif);
    } else if (r.status === 400 && r.kode === "ADM-4001") {
      // Cadangan: BE menolak karena field kosong
      setFieldError(inUser, username ? "" : PESAN.usernameKosong);
      setFieldError(inPass, password ? "" : PESAN.passwordKosong);
    } else {
      // Jaringan putus, timeout, 5xx, atau response tak dikenal
      tampilAlert(PESAN.backend);
    }
  });

  /* ---------- Saat halaman dibuka ---------- */
  if (AcalaAuth.ambilFlash() === "logout") tampilAlert(PESAN.logout);

  // Admin yang sudah punya sesi valid tidak perlu login lagi
  AcalaAuth.cekSesi().then((s) => {
    if (s.status === "valid") location.replace(AcalaAuth.HALAMAN_DASHBOARD);
  });

  // Tombol "Back" dari bfcache: pastikan form tidak tertinggal dalam keadaan loading
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) setLoading(false);
  });
})();
