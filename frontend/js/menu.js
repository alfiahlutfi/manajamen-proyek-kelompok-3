// ======================================================
// MENU PAGE - ÁCALA CAFÉ & EATERY
// Membutuhkan: fetchData() dari js/api.js
// ======================================================

const PER_PAGE      = 6;                        // produk per halaman (2 kolom x 3 baris)
const FALLBACK_IMG  = "assets/cafe-latte.png";  // Gambar placeholder jika foto kosong/gagal

// Endpoint menu
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
// HELPER AMAN & FORMATTING
// ======================================================
function esc(str) {
  return str ? String(str).replace(/[&<>"']/g, function(m) {
    return '&#' + m.charCodeAt(0) + ';';
  }) : "";
}

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
    deskripsi: m.deskripsi || "",
    gambar:   urlGambar(m.gambar || m.foto),
    kategori: String(m.category_nama || "Lainnya"),
    badge:    ambilBadge(m.label)
  };
}

function jumlahHalaman() {
  const total = semuaMenu.filter(m => m.kategori === kategoriAktif).length;
  return Math.max(1, Math.ceil(total / PER_PAGE));
}


// ======================================================
// RENDER SKELETON & UI
// ======================================================

// Menampilkan skeleton grid menu saat loading atau ganti kategori
function tampilkanSkeletonMenu() {
  if (!elGrid) return;
  let skeletonHTML = "";
  for (let i = 0; i < 6; i++) {
    skeletonHTML += `
      <div class="menu-item" style="background-color: #C8C8C8; border-radius: 30px; position: relative;">
        <div class="menu-card" style="background-color: #2d5f2e; opacity: 0.8; position: absolute; top: 21px; left: 21px; width: 293.12px; height: 375.79px; border-top-right-radius: 70px; border-bottom-left-radius: 70px; padding: 20px 22px; display: flex; flex-direction: column; justify-content: space-between;">
          <div class="skel" style="width: 100%; height: 210px; border-radius: 12px; background: #457847; animation: pulse 0.9s ease-in-out infinite; margin-top: 15px;"></div>
          <div class="meta" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span class="skel-teks" style="width: 60%; height: 20px; background: #457847; border-radius: 4px; animation: pulse 0.9s ease-in-out infinite;"></span>
            <span class="skel-teks" style="width: 40px; height: 35px; background: #FFE77B; opacity: 0.7; animation: pulse 0.9s ease-in-out infinite;"></span>
          </div>
        </div>
      </div>
    `;
  }
  elGrid.innerHTML = skeletonHTML;
}

function renderKategori() {
  if (!elKategori) return;
  elKategori.innerHTML = daftarKat.map(k => `
    <li class="${k === kategoriAktif ? "aktif" : ""}"
        data-kat="${esc(k)}"
        role="button"
        tabindex="0">${esc(k)}</li>
  `).join("");
}

function renderProduk(animasi = false) {
  if (!elGrid) return;
  const items = semuaMenu.filter(m => m.kategori === kategoriAktif);
  const mulai = halamanAktif * PER_PAGE;
  const tampil = items.slice(mulai, mulai + PER_PAGE);

  if (!tampil.length) {
    elGrid.innerHTML = '<p class="menu-status" style="grid-column: 1/-1; text-align:center; padding:40px; color:#2d5f2e; font-weight:600;">Menu belum tersedia untuk kategori ini.</p>';
    return;
  }

  elGrid.innerHTML = tampil.map(p => `
    <div class="menu-item">
      <article class="menu-card">
        ${p.badge
          ? `<div class="label-ribbon ${p.badge === "NEW" ? "new" : "best"}"></div>`
          : ""}
        <div class="foto-menu">
          <img class="cup"
               src="${esc(p.gambar)}"
               alt="${esc(p.nama)}"
               loading="lazy"
               onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
        </div>
        <div class="meta">
          <span class="nama">${esc(p.nama)}</span>
          ${p.harga ? `<span class="harga">${esc(p.harga)}</span>` : ""}
        </div>
      </article>
    </div>
  `).join("");

  if (animasi) {
    elGrid.classList.remove("swap");
    void elGrid.offsetWidth;
    elGrid.classList.add("swap");
  }
}

function renderPager() {
  if (!elPager) return;
  const total = jumlahHalaman();

  if (total <= 1) {
    elPager.innerHTML = "";
    return;
  }

  const prevDisabled = halamanAktif === 0 ? "disabled" : "";
  let html = `
    <button class="nav-arrow btn-prev" data-action="prev" ${prevDisabled} aria-label="Halaman Sebelumnya">
      <svg class="icon-panah" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
  `;

  for (let i = 0; i < total; i++) {
    html += `
      <button class="dot ${i === halamanAktif ? "aktif" : ""}"
              data-hal="${i}"
              aria-label="Halaman ${i + 1}"></button>
    `;
  }

  const nextDisabled = halamanAktif === total - 1 ? "disabled" : "";
  html += `
    <button class="nav-arrow btn-next" data-action="next" ${nextDisabled} aria-label="Halaman Selanjutnya">
      <svg class="icon-panah" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
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
// EVENT LISTENERS & INTERAKSI GANTI KATEGORI
// ======================================================

async function pilihKategori(nama) {
  kategoriAktif = nama;
  halamanAktif  = 0;

  // 1. Perbarui tampilan kategori aktif di sidebar (sidebar tetap stabil)
  renderKategori();

  // 2. Tampilkan skeleton grid menu terlebih dahulu
  tampilkanSkeletonMenu();

  // 3. Tahan selama 1.5 detik agar animasi skeleton terlihat jelas dan eye-catching
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 4. Render produk asli setelah jeda selesai
  renderProduk(true);
  renderPager();
}

if (elKategori) {
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
}

if (elPager) {
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
}

// Swipe support (Mobile)
if (elGrid) {
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
}


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
  // Tampilkan skeleton ketika data halaman menu sedang dimuat
  tampilkanSkeletonMenu();

  try {
    // Beri jeda singkat natural saat inisialisasi awal
    await new Promise(resolve => setTimeout(resolve, 800));

    const rawKategori = await fetchData("/menu-category");
    const listKategori = ambilDaftar(rawKategori);

    if (!listKategori || !listKategori.length) {
      elGrid.innerHTML = '<p class="menu-status" style="grid-column:1/-1; text-align:center; padding:40px;">Kategori menu belum tersedia.</p>';
      return;
    }

    daftarKat = listKategori.map(kat => kat.nama);

    let semuaMenuGabungan = [];

    await Promise.all(
      listKategori.map(async (kat) => {
        const rawMenuPerKat = await fetchData(`/menu?category_id=${kat.id}`);
        const menuPerKat = ambilDaftar(rawMenuPerKat);

        if (Array.isArray(menuPerKat) && menuPerKat.length > 0) {
          const normalized = menuPerKat.map(m => {
            const itemNorm = normalisasi(m);
            itemNorm.kategori = kat.nama;
            return itemNorm;
          });
          semuaMenuGabungan = semuaMenuGabungan.concat(normalized);
        }
      })
    );

    semuaMenu = semuaMenuGabungan;

    if (!daftarKat.length) {
      elGrid.innerHTML = '<p class="menu-status" style="grid-column:1/-1; text-align:center; padding:40px;">Menu belum tersedia.</p>';
      return;
    }

    kategoriAktif = daftarKat[0] || "";
    halamanAktif  = 0;
    tampilkan(false);

  } catch (err) {
    console.error("Gagal memuat data menu dan kategori:", err);

    // Skeleton tetap tampil ketika data gagal dimuat, lalu munculkan notifikasi error
    tampilkanSkeletonMenu();

    setTimeout(() => {
      if (elGrid) {
        elGrid.innerHTML = `
          <div class="block-failed" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: rgba(217, 83, 79, 0.12); border-radius: 20px; margin: 20px auto; max-width: 500px;">
            <h3 class="failed-title" style="color: #2d5f2e; margin-bottom: 8px; font-weight: 700; font-size: 20px;">Gagal memuat menu</h3>
            <p class="failed-description" style="color: #4a4a4a; font-size: 14px; margin-bottom: 20px;">Periksa kembali koneksi internet Anda atau coba muat ulang halaman.</p>
            <button class="btn-retry" onclick="location.reload()" style="padding: 10px 26px; background: var(--acala-hijau-tua, #2d5f2e); color: #FFE77B; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">Coba Lagi</button>
          </div>
        `;
      }
    }, 400);
  }
}

// Jalankan pemuatan menu saat script dieksekusi
muatMenu();