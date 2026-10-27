// ======================================================
// MENU PAGE
// Membutuhkan: fetchData() dari js/api.js
// ======================================================

const PER_PAGE      = 6;                        // produk per halaman (2 kolom x 3 baris)
const FALLBACK_IMG  = "assets/cafe-latte.png";

// Endpoint menu (mengikuti aturan backend ?featured=1)
const ENDPOINT_MENU = "/menu";

const FOLDER_GAMBAR = "assets/";

const elKategori = document.getElementById("kategori-list");
const elGrid     = document.getElementById("menu-grid");
const elPager    = document.getElementById("menu-pager");

let semuaMenu     = [];     // seluruh produk (sudah dinormalisasi)
let daftarKat     = [];     // nama-nama kategori
let kategoriAktif = "";
let halamanAktif  = 0;

// ======================================================
// HELPER AMAN (Alternatif Minimalis)
// ======================================================
function esc(str) {
  return str ? String(str).replace(/[&<>"']/g, function(m) {
    return '&#' + m.charCodeAt(0) + ';';
  }) : "";
}

// ======================================================
// HELPER FORMATTING
// ======================================================
function formatHarga(h) {
  if (h === null || h === undefined || h === "") return "";
  if (typeof h === "string" && /k$/i.test(h.trim())) return h.trim();

  let n;
  if (typeof h === "number") {
    n = h;
  } else {
    const s = String(h).trim();
    n = /^\d+(\.\d+)?$/.test(s) ? Number(s) : Number(s.replace(/\D/g, ""));
  }

  if (!n) return "";

  return n >= 1000
    ? (Math.round(n / 100) / 10).toString().replace(".", ",") + "k"
    : String(n);
}

function ambilBadge(label) {
  const l = String(label || "").trim().toLowerCase();
  if (!l) return null;
  if (l.includes("best"))                        return "BEST SELLER";
  if (l.includes("new") || l.includes("baru")) return "NEW";
  return l.toUpperCase();
}

function urlGambar(g) {
  const s = String(g || "").trim();
  if (!s) return FALLBACK_IMG;
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("/") || s.startsWith("data:") || s.includes("/")) {
    return s;
  }
  return FOLDER_GAMBAR + s;
}

function normalisasi(m) {
  return {
    nama:     m.nama || "",
    harga:    formatHarga(m.harga),
    gambar:   urlGambar(m.gambar || m.foto), // Mendukung m.gambar maupun m.foto dari backend
    kategori: String(m.category_nama || "Lainnya"),
    badge:    ambilBadge(m.label)
  };
}

function jumlahHalaman() {
  const total = semuaMenu.filter(m => m.kategori === kategoriAktif).length;
  return Math.max(1, Math.ceil(total / PER_PAGE));
}


// ======================================================
// RENDER UI
// ======================================================

function renderKategori() {
  elKategori.innerHTML = daftarKat.map(k => `
    <li class="${k === kategoriAktif ? "aktif" : ""}"
        data-kat="${esc(k)}"
        role="button"
        tabindex="0">${esc(k)}</li>
  `).join("");
}

function renderProduk(animasi = false) {
  const items = semuaMenu.filter(m => m.kategori === kategoriAktif);
  const mulai = halamanAktif * PER_PAGE;
  const tampil = items.slice(mulai, mulai + PER_PAGE);

  if (!tampil.length) {
    elGrid.innerHTML = '<p class="menu-status">Menu belum tersedia untuk kategori ini.</p>';
    return;
  }

  elGrid.innerHTML = tampil.map(p => `
    <div class="menu-item">
      <article class="menu-card">
        ${p.badge
          ? `<div class="badge-burst ${p.badge === "NEW" ? "new" : ""}">${esc(p.badge).replace(" ", "<br>")}</div>`
          : ""}
        <img class="cup"
             src="${esc(p.gambar)}"
             alt="${esc(p.nama)}"
             loading="lazy"
             onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
        <div class="meta">
          <span class="nama">${esc(p.nama)}</span>
          ${p.harga ? `<span class="harga">${esc(p.harga)}</span>` : ""}
        </div>
      </article>
    </div>
  `).join("");

  if (animasi) {
    elGrid.classList.remove("swap");
    void elGrid.offsetWidth; // Trigger reflow untuk merestart animasi
    elGrid.classList.add("swap");
  }
}

function renderPager() {
  const total = jumlahHalaman();

  if (total <= 1) {
    elPager.innerHTML = "";
    return;
  }

  // Tombol Previous (<)
  const prevDisabled = halamanAktif === 0 ? "disabled" : "";
  let html = `
    <button class="nav-arrow btn-prev" data-action="prev" ${prevDisabled} aria-label="Halaman Sebelumnya">
      <
    </button>
  `;

  // Dot Halaman
  for (let i = 0; i < total; i++) {
    html += `
      <button class="dot ${i === halamanAktif ? "aktif" : ""}"
              data-hal="${i}"
              aria-label="Halaman ${i + 1}"></button>
    `;
  }

  // Tombol Next (>)
  const nextDisabled = halamanAktif === total - 1 ? "disabled" : "";
  html += `
    <button class="nav-arrow btn-next" data-action="next" ${nextDisabled} aria-label="Halaman Selanjutnya">
      >
    </button>
  `;

  elPager.innerHTML = html;
}

function tampilkan(animasi = false) {
  renderKategori();
  renderProduk(animasi);
  renderPager();
}


// ======================================================
// EVENT LISTENERS (Kategori, Pager, & Swipe Mobile)
// ======================================================

function pilihKategori(nama) {
  kategoriAktif = nama;
  halamanAktif  = 0;
  tampilkan(true);
}

elKategori.addEventListener("click", e => {
  const li = e.target.closest("li[data-kat]");
  if (li) pilihKategori(li.dataset.kat);
});

elKategori.addEventListener("keydown", e => {
  const li = e.target.closest("li[data-kat]");
  if (li && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    pilihKategori(li.dataset.kat);
  }
});

// Event listener tunggal untuk Pager (Mendukung tombol Prev, Next, dan Dot)
elPager.addEventListener("click", e => {
  const target = e.target.closest("button");
  if (!target || target.disabled) return;

  const total = jumlahHalaman();

  if (target.dataset.action === "prev") {
    if (halamanAktif > 0) {
      halamanAktif--;
      tampilkan(true);
    }
  } else if (target.dataset.action === "next") {
    if (halamanAktif < total - 1) {
      halamanAktif++;
      tampilkan(true);
    }
  } else if (target.dataset.hal !== undefined) {
    halamanAktif = Number(target.dataset.hal);
    tampilkan(true);
  }
});

// Swipe kiri/kanan untuk pindah halaman (Mobile)
let sentuhX = null;
elGrid.addEventListener("touchstart", e => { sentuhX = e.touches[0].clientX; }, { passive: true });
elGrid.addEventListener("touchend", e => {
  if (sentuhX === null) return;
  const dx = e.changedTouches[0].clientX - sentuhX;
  sentuhX = null;
  if (Math.abs(dx) < 50) return;

  const baru = halamanAktif + (dx < 0 ? 1 : -1);
  if (baru < 0 || baru >= jumlahHalaman()) return;

  halamanAktif = baru;
  tampilkan(true);
});


// ======================================================
// PENGAMBILAN DATA (API)
// ======================================================

function ambilDaftar(respon) {
  if (Array.isArray(respon)) return respon;
  if (respon && Array.isArray(respon.data)) return respon.data;
  if (respon && respon.data && Array.isArray(respon.data.data)) return respon.data.data;
  return null;
}

async function muatMenu() {
  elGrid.innerHTML = '<p class="menu-status">Memuat menu...</p>';

  let menu = null;

  try {
    const rawRespon = await fetchData(ENDPOINT_MENU);
    menu = ambilDaftar(rawRespon);
  } catch (err) {
    console.error("Gagal memuat menu:", err);
  }

  if (!menu) {
    elGrid.innerHTML = `
      <div class="menu-placeholder-gagal">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p class="menu-status">Halaman Menu gagal dimuat</p>
      </div>
    `;

    if (typeof tampilkanToast === "function") {
      tampilkanToast("Gagal mengambil data menu");
    }
    return;
  }

  if (!menu.length) {
    elGrid.innerHTML = '<p class="menu-status">Menu belum tersedia.</p>';
    return;
  }

  semuaMenu = menu.map(normalisasi);
  daftarKat = [...new Set(semuaMenu.map(m => m.kategori))];

  kategoriAktif = daftarKat[0] || "";
  halamanAktif  = 0;
  tampilkan(false);
}

muatMenu();