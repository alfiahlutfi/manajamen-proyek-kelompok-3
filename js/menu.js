// ======================================================
// MENU PAGE
// Membutuhkan: fetchData() dan esc() dari js/api.js
// ======================================================

const PER_PAGE      = 6;                      // produk per halaman
const FALLBACK_IMG  = "assets/cafe-latte.png";

// Sesuaikan dengan endpoint backend kamu
const ENDPOINT_MENU     = "/menu";
const ENDPOINT_KATEGORI = "/kategori";        // opsional: kalau tidak ada, kategori diambil dari data menu

const elKategori = document.getElementById("kategori-list");
const elGrid     = document.getElementById("menu-grid");
const elPager    = document.getElementById("menu-pager");

let semuaMenu    = [];     // seluruh produk (sudah dinormalisasi)
let daftarKat    = [];     // nama-nama kategori
let kategoriAktif = "";
let halamanAktif  = 0;


// ======================================================
// HELPER
// ======================================================

// 34000 -> "34k", 37500 -> "37,5k", "34k" -> "34k"
function formatHarga(h) {
  if (typeof h === "string" && /k$/i.test(h.trim())) return h.trim();

  const n = Number(String(h).replace(/\D/g, ""));
  if (!n) return "";

  return n >= 1000
    ? (n / 1000).toString().replace(".", ",") + "k"
    : String(n);
}


// Samakan nama field dari database.
// Sesuaikan bagian ini kalau nama kolom di tabel menu berbeda.
function normalisasi(m) {
  const kat =
    (m.kategori && m.kategori.nama) ||
    m.nama_kategori ||
    m.kategori ||
    "Lainnya";

  let badge = null;
  if (m.best_seller || m.is_best_seller) badge = "BEST SELLER";
  else if (m.baru || m.is_new)           badge = "NEW";

  return {
    nama:     m.nama || m.name || "",
    harga:    formatHarga(m.harga ?? m.price),
    gambar:   m.gambar || m.foto || m.image || FALLBACK_IMG,
    kategori: String(kat),
    badge
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
          ? `<span class="badge-burst">${esc(p.badge).replace(" ", "<br>")}</span>`
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

// Data contoh kalau API belum siap / gagal.
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
        harga: 34000,
        kategori: k,
        best_seller: ki === 0 && i === 0,
        baru: ki === 0 && i === 1
      });
    }
  });
  return { kat, menu };
}


async function muatMenu() {
  elGrid.innerHTML = `<p class="menu-status">Memuat menu...</p>`;

  let menu = null;
  let kat  = null;

  try {
    [menu, kat] = await Promise.all([
      fetchData(ENDPOINT_MENU),
      fetchData(ENDPOINT_KATEGORI).catch(() => null)
    ]);
  } catch (err) {
    console.error("Gagal memuat menu:", err);
  }

  if (!Array.isArray(menu) || !menu.length) {
    console.warn("Data menu kosong, memakai data contoh.");
    const contoh = dataContoh();
    menu = contoh.menu;
    kat  = contoh.kat;
  }

  semuaMenu = menu.map(normalisasi);

  // Urutan kategori: dari endpoint kategori kalau ada, kalau tidak dari data menu
  daftarKat = Array.isArray(kat) && kat.length
    ? kat.map(k => (typeof k === "string" ? k : k.nama))
    : [...new Set(semuaMenu.map(m => m.kategori))];

  // Buang kategori yang tidak punya produk
  daftarKat = daftarKat.filter(k => semuaMenu.some(m => m.kategori === k));

  kategoriAktif = daftarKat[0] || "";
  halamanAktif  = 0;
  tampilkan(false);
}

muatMenu();