// ======================================================
// MENU PAGE - ÁCALA CAFÉ & EATERY
// Membutuhkan: fetchData() dari js/api.js
// ======================================================

const PER_PAGE      = 6;                        // 6 produk per halaman
const FALLBACK_IMG  = "assets/cafe-latte.png";  // Gambar fallback

const FOLDER_GAMBAR = "assets/";

const elKategori = document.getElementById("kategori-list");
const elGrid     = document.getElementById("menu-grid");
const elPager    = document.getElementById("menu-pager");

let listKategori  = [];     // [{ id, nama }] dari /menu-category
let daftarKat     = [];     // nama kategori (urutan sidebar)
let menuPerKat    = {};     // cache: nama kategori -> daftar menu (dimuat saat kategori dibuka)
let kategoriAktif = "";
let nomorMuatGrid = 0;      // mencegah hasil lama menimpa permintaan baru
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
  if (l.includes("signature"))                 return "SIGNATURE";
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
    id:       m.id,
    nama:     m.nama || "",
    harga:    formatHarga(m.harga),
    deskripsi: m.deskripsi || "",
    gambar:   urlGambar(m.gambar || m.foto),
    kategori: String(m.category_nama || "Lainnya"),
    badge:    ambilBadge(m.label)
  };
}

function jumlahHalaman() {
  const total = (menuPerKat[kategoriAktif] || []).length;
  return Math.max(1, Math.ceil(total / PER_PAGE));
}

// ======================================================
// RENDER SKELETON & UI GRID MENU UTAMA
// ======================================================
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

// Pesan gagal di dalam kartu grid menu; skeleton kartu tetap tampil di bawahnya.
function tampilkanGagalGrid(teks, onUlang) {
  if (!elGrid) return;
  tampilkanSkeletonMenu();
  if (elPager) elPager.innerHTML = "";

  const pesan = document.createElement("div");
  pesan.className = "menu-gagal";
  pesan.setAttribute("role", "alert");
  pesan.style.cssText = "grid-column:1/-1; display:flex; align-items:center; justify-content:center; gap:14px; flex-wrap:wrap; padding:12px 16px; background:#FF3A3A; color:#fff; font-weight:600; border-radius:12px;";
  const span = document.createElement("span");
  span.textContent = teks;
  const tombol = document.createElement("button");
  tombol.type = "button";
  tombol.textContent = "Muat Ulang";
  tombol.style.cssText = "border:0; border-radius:6px; padding:6px 16px; background:#fff; color:#FF3A3A; font-weight:700; cursor:pointer;";
  tombol.addEventListener("click", () => { tombol.disabled = true; onUlang(); });
  pesan.append(span, tombol);
  elGrid.prepend(pesan);
}

function tampilkanSkeletonKategori() {
  if (!elKategori) return;
  let skelKatHTML = "";
  for (let i = 0; i < 5; i++) {
    skelKatHTML += `
      <li style="background: rgba(45, 95, 46, 0.15) !important; animation: pulse 0.9s ease-in-out infinite; height: 38px; border-radius: 50px; margin-bottom: 8px;"></li>
    `;
  }
  elKategori.innerHTML = skelKatHTML;
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
  const items = menuPerKat[kategoriAktif] || [];
  const mulai = halamanAktif * PER_PAGE;
  const tampil = items.slice(mulai, mulai + PER_PAGE);

  if (!tampil.length) {
    elGrid.innerHTML = '<p class="menu-status" style="grid-column: 1/-1; text-align:center; padding:40px; color:#2d5f2e; font-weight:600;">Menu belum tersedia untuk kategori ini.</p>';
    return;
  }

  elGrid.innerHTML = tampil.map(p => `
    <div class="menu-item" onclick="bukaDetailMenu(${p.id})" style="cursor: pointer;">
      <article class="menu-card">
        ${p.badge
          ? `<div class="label-badge"><span><small>${esc(p.badge)}</small></span></div>`
          : ""}
        <div class="foto-menu">
          <img class="cup"
               src="${esc(p.gambar)}"
               alt="${esc(p.nama)}"
               loading="lazy"
               onerror="this.onerror=null; this.src='assets/Placeholder Menu.svg';">
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

// ======================================================
// RENDER PAGER (TOMBOL PANAH NEXT / PREVIOUS)
// ======================================================
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

async function bukaDetailMenu(menuId) {
  if (!menuId) {
    console.error("ID Menu tidak valid.");
    return;
  }

  const modal = document.getElementById('menuDetailModal');
  const modalContainer = modal.querySelector('.menu-modal-container');
  
  const skeletonState = document.getElementById('modalSkeletonState');
  const realContent = document.getElementById('modalRealContent');
  const errorMsg = document.getElementById('modalErrorMessage');

  const imgElement = document.getElementById('modalMenuImg');
  const placeholder = document.getElementById('modalImgPlaceholder');
  const nameElement = document.getElementById('modalMenuName');
  const priceElement = document.getElementById('modalMenuPrice');
  const descElement = document.getElementById('modalMenuDesc');
  
  // ==============================================================
  // BERSIHKAN SEMUA ELEMEN BADGE / SKELETON LAMA DARI KLIK SEBELUMNYA
  // ==============================================================
  const existingSkelBadge = document.getElementById('modalDynamicSkeletonBadge');
  if (existingSkelBadge) existingSkelBadge.remove();

  const existingRealBadge = document.getElementById('modalDynamicRealBadge');
  if (existingRealBadge) existingRealBadge.remove();

  // Buka modal & tampilkan skeleton utama
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  
  // Skeleton modal hanya muncul bila data lambat (> 500 ms)
  if (skeletonState) skeletonState.setAttribute('style', 'display: none !important;');
  if (realContent) realContent.setAttribute('style', 'display: none !important; width: 100%;');
  if (errorMsg) errorMsg.style.display = 'none';
  const timerSkelModal = setTimeout(() => {
    if (skeletonState) skeletonState.setAttribute('style', 'display: block !important; width: 100%;');
  }, 500);

  try {
    const data = await fetchData(`/menu?id=${menuId}`);
    clearTimeout(timerSkelModal);

    if (!data) throw new Error("Gagal memuat detail menu");

    // ==============================================================
    // CEK APAKAH MENU INI PUNYA LABEL
    // ==============================================================
    const badgeText = ambilBadge(data.label);

    if (badgeText) {
      // 1. TAMPILKAN SKELETON BADGE SELAMA LOADING (Kapsul Hijau) khusus untuk yang berlabel[cite: 6]
      const skelBadge = document.createElement('div');
      skelBadge.id = 'modalDynamicSkeletonBadge';
      skelBadge.style.cssText = 'position: absolute; top: -14px; left: -15px; width: 255px; height: 36px; background: #2d5f2e; border-radius: 20px; animation: pulse 0.9s ease-in-out infinite; z-index: 25;';
      modalContainer.appendChild(skelBadge);

      // Setelah data siap, hapus skeleton badge
      skelBadge.remove();

      // 2. BUAT & TAMPILKAN BADGE ASLI SECARA DINAMIS
      const realBadge = document.createElement('div');
      realBadge.id = 'modalDynamicRealBadge';
      realBadge.className = 'label-badge-popup';
      realBadge.innerHTML = `<span><small>${esc(badgeText)}</small></span>`;
      modalContainer.appendChild(realBadge);
    } 
    // JIKA TIDAK ADA LABEL: Kodenya melewati blok di atas, sehingga tidak ada elemen badge yang dibuat sama sekali[cite: 6].

    // Masukkan data teks, harga, dan deskripsi ke konten asli
    if (nameElement) nameElement.textContent = data.nama || "";
    if (priceElement) priceElement.textContent = formatHarga(data.harga);
    if (descElement) descElement.textContent = data.deskripsi || "Deskripsi belum tersedia untuk menu ini.";

    // Penanganan Foto / Placeholder
    if (data.foto || data.gambar) {
      const sourceFoto = urlGambar(data.foto || data.gambar);
      if (imgElement && placeholder) {
        imgElement.style.display = 'block';
        placeholder.style.display = 'none';
        imgElement.src = sourceFoto;
        
        imgElement.onerror = () => {
          imgElement.style.display = 'none';
          placeholder.style.display = 'flex';
        };
      }
    } else {
      if (imgElement) imgElement.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    }

    // 3. KONTEN SIAP: Sembunyikan skeleton, tampilkan konten asli
    if (skeletonState) skeletonState.setAttribute('style', 'display: none !important;');
    if (realContent) realContent.setAttribute('style', 'display: block !important; width: 100%;');

  } catch (err) {
    console.error("Gagal memuat detail menu:", err);
    clearTimeout(timerSkelModal);

    const errSkelBadge = document.getElementById('modalDynamicSkeletonBadge');
    if (errSkelBadge) errSkelBadge.remove();

    if (skeletonState) skeletonState.setAttribute('style', 'display: block !important; width: 100%; opacity: 0.3;');
    
    if (errorMsg) {
      errorMsg.style.display = 'block';
      errorMsg.style.opacity = '1';
      errorMsg.style.transition = 'opacity 0.3s ease';

      setTimeout(() => {
        errorMsg.style.opacity = '0';
        setTimeout(() => {
          errorMsg.style.display = 'none';
          errorMsg.style.opacity = '1';
        }, 300);
      }, 1000);
    }
  }
}

// ======================================================
// TUTUP POP-UP KETIKA KLIK DI BAYANGAN HITAM LUAR KOTAK
// ======================================================
function tutupModalOverlay(event) {
  const modal = document.getElementById('menuDetailModal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    
    const errorMsg = document.getElementById('modalErrorMessage');
    if (errorMsg) errorMsg.style.display = 'none';
  }
}

const modalOverlay = document.getElementById('menuDetailModal');
if (modalOverlay) {
  modalOverlay.addEventListener('click', function(event) {
    const container = event.target.closest('.menu-modal-container');
    if (!container) {
      tutupModalOverlay(event);
    }
  });
}

// ======================================================
// EVENT LISTENERS INTERAKSI KATEGORI & PAGER
// ======================================================
async function pilihKategori(nama) {
  kategoriAktif = nama;
  halamanAktif  = 0;

  renderKategori();
  await muatGridKategori(true);
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

// Grid menu = kartu sendiri: dimuat per kategori. Skeleton grid hanya tampil selama menu kategori
// yang dibuka belum tiba; sidebar kategori tidak ikut berubah.
async function muatGridKategori(animasi = false) {
  const nama = kategoriAktif;
  const kat  = listKategori.find(k => k.nama === nama);
  const saya = ++nomorMuatGrid;
  if (!kat) return;

  // Sudah pernah dimuat: langsung tampil
  if (menuPerKat[nama]) {
    tampilkan(animasi);
    return;
  }

  tampilkanSkeletonMenu();
  if (elPager) elPager.innerHTML = "";
  elGrid.setAttribute("aria-busy", "true");

  const rawMenu = await fetchData(`/menu?category_id=${kat.id}`);
  if (saya !== nomorMuatGrid) return;   // pengguna sudah pindah kategori
  elGrid.setAttribute("aria-busy", "false");

  // fetchData mengembalikan null bila request gagal -> itu GAGAL, bukan "kategori kosong"
  const daftar = rawMenu === null ? null : ambilDaftar(rawMenu);
  if (!Array.isArray(daftar)) {
    tampilkanGagalGrid("Gagal memuat menu", () => muatGridKategori(true));
    return;
  }

  menuPerKat[nama] = daftar.map(m => {
    const itemNorm = normalisasi(m);
    itemNorm.kategori = nama;
    return itemNorm;
  });
  tampilkan(animasi);
}

// Sidebar kategori = kartu sendiri. Gagal: skeleton sidebar + skeleton grid tetap tampil,
// pesan + "Muat Ulang" di grid (grid tidak tahu kategori mana yang harus dimuat).
async function muatMenu() {
  tampilkanSkeletonKategori();
  tampilkanSkeletonMenu();
  if (elPager) elPager.innerHTML = "";
  menuPerKat = {};

  const rawKategori = await fetchData("/menu-category");
  const listKat = rawKategori === null ? null : ambilDaftar(rawKategori);

  if (!Array.isArray(listKat)) {
    console.error("Gagal memuat kategori menu");
    tampilkanGagalGrid("Gagal memuat menu", muatMenu);
    return;
  }

  if (!listKat.length) {
    elKategori.innerHTML = "";
    elGrid.innerHTML = '<p class="menu-status" style="grid-column:1/-1; text-align:center; padding:40px;">Kategori menu belum tersedia.</p>';
    return;
  }

  listKategori = listKat.map(k => ({ id: k.id, nama: k.nama }));
  daftarKat = listKategori.map(k => k.nama);

  // Parameter ?kategori= boleh berisi ID kategori (dari kartu Signature di beranda)
  // atau nama kategori. ID dicocokkan lebih dulu, lalu nama.
  const kategoriDariUrl = new URLSearchParams(window.location.search).get("kategori");
  let kategoriTujuan = "";
  if (kategoriDariUrl) {
    const cocok =
      listKat.find(k => String(k.id) === kategoriDariUrl) ||
      listKat.find(k => k.nama === kategoriDariUrl);
    if (cocok) kategoriTujuan = cocok.nama;
  }
  kategoriAktif = kategoriTujuan && daftarKat.includes(kategoriTujuan) ? kategoriTujuan : daftarKat[0];
  halamanAktif = 0;

  // Sidebar langsung tampil; grid menyusul begitu menunya tiba
  renderKategori();
  elKategori.querySelector(".aktif")?.scrollIntoView({ block: "nearest" });
  await muatGridKategori(false);
}

// Jalankan pemuatan menu utama
muatMenu();