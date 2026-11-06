// ======================================================
// MENU PAGE - ÁCALA CAFÉ & EATERY
// Membutuhkan: fetchData() dari js/api.js
// ======================================================

const PER_PAGE      = 6;                        // 6 produk per halaman
const FALLBACK_IMG  = "assets/cafe-latte.png";  // Gambar fallback

const ENDPOINT_MENU = "/menu";
const FOLDER_GAMBAR = "assets/";

const elKategori = document.getElementById("kategori-list");
const elGrid     = document.getElementById("menu-grid");
const elPager    = document.getElementById("menu-pager");

let semuaMenu     = [];     
let daftarKat     = [];     
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
  const total = semuaMenu.filter(m => m.kategori === kategoriAktif).length;
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

function tampilkanNotifikasiError(pesan) {
  let banner = document.getElementById('top-error-notification');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'top-error-notification';
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(-100%);
      width: 90%;
      max-width: 400px;
      background-color: #d9534f;
      color: white;
      text-align: center;
      padding: 12px 20px;
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 14px;
      z-index: 999999;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.25);
      transition: transform 0.3s ease-in-out;
    `;
    document.body.appendChild(banner);
  }
  
  banner.textContent = pesan;
  banner.style.transform = 'translateX(-50%) translateY(0)';

  // Notifikasi muncul sekilas, lalu bergeser ke atas setelah 4 detik
  setTimeout(() => {
    banner.style.transform = 'translateX(-50%) translateY(-150%)';
  }, 4000);
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
  
  if (skeletonState) skeletonState.setAttribute('style', 'display: block !important; width: 100%;');
  if (realContent) realContent.setAttribute('style', 'display: none !important; width: 100%;');
  if (errorMsg) errorMsg.style.display = 'none';

  try {
    // Ambil data dari API dan jalankan penundaan 700ms paralel agar skeleton selalu tampil
    const [data] = await Promise.all([
      fetchData(`/menu?id=${menuId}`), //cek
      new Promise(resolve => setTimeout(resolve, 700))
    ]);

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
      }, 4000);
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
  tampilkanSkeletonMenu();

  await new Promise(resolve => setTimeout(resolve, 800));

  tampilkan(true);
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
  // Tampilkan skeleton di awal untuk kategori dan menu
  tampilkanSkeletonKategori();
  tampilkanSkeletonMenu();

  try {
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

    const urlParams = new URLSearchParams(window.location.search);
    const kategoriDariUrl = urlParams.get('kategori');

    if (kategoriDariUrl && daftarKat.includes(kategoriDariUrl)) {
      kategoriAktif = kategoriDariUrl;
    } else if (!kategoriAktif || !daftarKat.includes(kategoriAktif)) {
      kategoriAktif = daftarKat[0] || ""; 
    }
    
    halamanAktif  = 0;
    tampilkan(false);

    // Pastikan kategori aktif terlihat di daftar kategori
    if (elKategori) elKategori.querySelector(".aktif")?.scrollIntoView({ block: "nearest" });

  } catch (err) {
    console.error("Gagal memuat data menu dan kategori:", err);

    // KONDISI GAGAL: Pertahankan skeleton di kategori dan grid menu, lalu tampilkan notifikasi sekilas di atas
    tampilkanSkeletonKategori();
    tampilkanSkeletonMenu();
    tampilkanNotifikasiError("Gagal Memuat Menu");
  }
}

// Jalankan pemuatan menu utama
muatMenu();