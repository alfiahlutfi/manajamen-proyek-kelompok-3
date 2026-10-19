// ======================================================
// MENU PAGE
// Membutuhkan: fetchData() dan esc() dari js/api.js
// Data dari backend/menu.php:
//   { success: true, data: [ { id, category_id, nama, slug, deskripsi,
//     harga, gambar, label, urutan, status, category_nama, category_slug } ] }
// ======================================================

const PER_PAGE      = 6;                      // produk per halaman (2 kolom x 3 baris)
const FALLBACK_IMG  = "assets/cafe-latte.png";

// Sesuaikan dengan endpoint backend kamu (menu.php)
const ENDPOINT_MENU = "/menu";

// Kalau kolom `gambar` di database hanya berisi nama file (mis. "latte.png"),
// file itu dicari di folder ini. Kalau sudah berisi path/URL, dipakai apa adanya.
const FOLDER_GAMBAR = "assets/";

const elKategori = document.getElementById("kategori-list");
const elGrid     = document.getElementById("menu-grid");
const elPager    = document.getElementById("menu-pager");

let semuaMenu     = [];     // seluruh produk (sudah dinormalisasi)
let daftarKat     = [];     // nama-nama kategori (urut sesuai menu_category.urutan)
let kategoriAktif = "";
let halamanAktif  = 0;


// ======================================================
// HELPER
// ======================================================

// "34000.00" -> "34k", 34000 -> "34k", 37500 -> "37,5k", "34k" -> "34k"
function formatHarga(h) {
  if (h === null || h === undefined || h === "") return "";
  if (typeof h === "string" && /k$/i.test(h.trim())) return h.trim();

  let n;
  if (typeof h === "number") {
    n = h;
  } else {
    const s = String(h).trim();
    // "34000.00" (desimal MySQL) dibaca apa adanya,
    // "34.000" / "Rp 34.000" (format Indonesia) dibuang titiknya
    n = /^\d+(\.\d+)?$/.test(s) ? Number(s) : Number(s.replace(/\D/g, ""));
  }

  if (!n) return "";

  return n >= 1000
    ? (Math.round(n / 100) / 10).toString().replace(".", ",") + "k"
    : String(n);
}


// Kolom `label` di tabel menu -> teks badge.
// "best seller" / "best_seller" / "bestseller" -> BEST SELLER
// "new" / "baru"                              -> NEW
function ambilBadge(label) {
  const l = String(label || "").trim().toLowerCase();
  if (!l) return null;
  if (l.includes("best"))                      return "BEST SELLER";
  if (l.includes("new") || l.includes("baru")) return "NEW";
  return l.toUpperCase();
}


function urlGambar(g) {
  const s = String(g || "").trim();
  if (!s) return FALLBACK_IMG;
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("/") || s.startsWith("data:") || s.includes("/")) return s;
  return FOLDER_GAMBAR + s;
}


// Samakan nama field dari database (sesuai output menu.php).
function normalisasi(m) {
  return {
    nama:     m.nama || "",
    harga:    formatHarga(m.harga),
    gambar:   urlGambar(m.foto),
    kategori: String(m.category_nama || "Lainnya"),
    badge:    ambilBadge(m.label)
  };
}


function jumlahHalaman() {
  const total = semuaMenu.filter(m => m.kategori === kategoriAktif).length;
  return Math.max(1, Math.ceil(total / PER_PAGE));
}


// ======================================================
// RENDER
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
    elGrid.innerHTML = `<p class="menu-status">Menu belum tersedia.</p>`;
    return;
  }

  elGrid.innerHTML = tampil.map(p => `
    <div class="menu-item">
      <article class="menu-card">
        ${p.badge
          ? `<span class="badge-burst${p.badge === "NEW" ? " new" : ""}">${esc(p.badge).replace(" ", "<br>")}</span>`
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
    void elGrid.offsetWidth;            // restart animasi
    elGrid.classList.add("swap");
  }
}


function renderPager() {
  const total = jumlahHalaman();

  elPager.innerHTML = total > 1
    ? Array.from({ length: total }, (_, i) => `
        <button class="${i === halamanAktif ? "aktif" : ""}"
                data-hal="${i}"
                aria-label="Halaman ${i + 1}"></button>
      `).join("")
    : "";
}


function tampilkan(animasi) {
  renderKategori();
  renderProduk(animasi);
  renderPager();
}


// ======================================================
// EVENT
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

elPager.addEventListener("click", e => {
  const btn = e.target.closest("button[data-hal]");
  if (!btn) return;
  halamanAktif = Number(btn.dataset.hal);
  renderProduk(true);
  renderPager();
});

// Swipe kiri/kanan untuk pindah halaman (mobile)
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
  renderProduk(true);
  renderPager();
});


// ======================================================
// DATA
// ======================================================

// Data contoh kalau API belum siap / gagal (bentuknya sama dengan output menu.php).
function dataContoh() {
  const kat = [
    "Milk Based Coffee", "Black Coffee", "Manual Brew", "Moctail",
    "Milk Based", "Mojito", "Tea", "Dessert", "Pastry", "Snack",
    "Main Course", "Light Meal"
  ];
  const menu = [];
  kat.forEach((k, ki) => {
    const jumlah = ki === 0 ? 36 : 12;
    for (let i = 0; i < jumlah; i++) {
      menu.push({
        nama: "Cafe Latte",
        harga: "34000.00",
        category_nama: k,
        label: ki === 0 && i === 0 ? "best_seller"
             : ki === 0 && i === 1 ? "new"
             : null
      });
    }
  });
  return menu;
}


// menu.php membalas { success, data: [...] }.
// fetchData() bisa mengembalikan seluruh objek itu atau langsung isi `data`,
// dua-duanya ditangani di sini.
function ambilDaftar(respon) {
  if (Array.isArray(respon)) return respon;
  if (respon && Array.isArray(respon.data)) return respon.data;
  return null;
}


async function muatMenu() {
  elGrid.innerHTML = `<p class="menu-status">Memuat menu...</p>`;

  let menu = null;

  try {
    menu = ambilDaftar(await fetchData(ENDPOINT_MENU));
  } catch (err) {
    console.error("Gagal memuat menu:", err);
  }

  // === JIKA GAGAL MEMUAT DATA DARI API ===
  if (!menu) {
    // Tampilkan placeholder di dalam grid
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

    // Munculkan notifikasi toast
    if (typeof tampilkanToast === "function") {
      tampilkanToast("Gagal mengambil data menu");
    }
    return;
  }

  // === JIKA DATA BERHASIL DITARIK TAPI KOSONG (DATABASE KOSONG) ===
  if (!menu.length) {
    elGrid.innerHTML = `<p class="menu-status">Menu belum tersedia.</p>`;
    return;
  }

  // === JIKA DATA ADA ===
  semuaMenu = menu.map(normalisasi);
  daftarKat = [...new Set(semuaMenu.map(m => m.kategori))];

  kategoriAktif = daftarKat[0] || "";
  halamanAktif  = 0;
  tampilkan(false);
}

muatMenu();