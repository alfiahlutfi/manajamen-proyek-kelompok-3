/* js/gallery.js - Halaman Galeri (card 10.1.3)
   Urutan script: api.js -> layout.js -> gallery.js
   Data: GET /gallery            -> [{ id, foto }]
         GET /gallery?id={id}    -> { id, foto, judul, deskripsi }  (popup detail)
*/
"use strict";

const GAL_LOGO        = "assets/logo_acala.png";
const GAL_MIN_SKELETON = 300;                        // ms, supaya skeleton tidak berkedip
const GAL_BATAS_HERO   = 8000;                       // ms, batas tunggu gambar banner
const GAL_FOTO_AWAL    = 8;                          // foto yang langsung dimuat; sisanya menyusul saat mendekati layar

const elArea  = document.getElementById("galeri-area");
const elGrid  = document.getElementById("galeri-grid");
const elPopup = document.getElementById("galeri-popup");
const elHero  = document.querySelector(".galeri-hero");
const elHeroBg = document.querySelector(".galeri-hero__bg");
const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let daftarFoto = [];     // [{ id, foto }]
let indeksAktif = -1;    // foto yang sedang dibuka di popup
let pemicuPopup = null;  // elemen yang membuka popup (untuk mengembalikan fokus)
let nomorMuat = 0;       // mencegah hasil lama menimpa permintaan baru

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

function esc(teks) {
  return String(teks ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* =======================================================
   PENATA LETAK (mengikuti desain Figma)
   Grid 278 kolom "satuan" (--u = lebar / 278). Setiap foto menempati
   [kolom awal, kolom akhir) dan baris tertentu, tinggi baris juga
   dalam satuan --u, jadi proporsinya selalu sama di semua lebar layar.
   Satu siklus = 11 foto = 4 baris; foto ke-6 memanjang 2 baris.
======================================================= */
const LEBAR_GRID = 278;

const SIKLUS = {
  tinggi: [72, 61, 73, 79],
  foto: [
    { c: [0, 90],    r: 0 }, { c: [90, 168],  r: 0 }, { c: [168, 278], r: 0 },
    { c: [0, 74],    r: 1 }, { c: [74, 192],  r: 1 }, { c: [192, 278], r: 1, tinggiBaris: 2 },
    { c: [0, 113],   r: 2 }, { c: [113, 192], r: 2 },
    { c: [0, 62],    r: 3 }, { c: [62, 201],  r: 3 }, { c: [201, 278], r: 3 }
  ]
};

// Titik potong (object-position) tiap foto di dalam slotnya, urut sesuai 11 slot,
// supaya bagian yang tampil sama dengan desain Figma (mis. judul "Lotus Nut" tidak terpotong).
const POSISI_FOTO = [
  "50% 55%", "50% 50%", "50% 60%",      // baris 1: es kopi, croissant, barista
  "50% 33%", "50% 50%", "50% 50%",      // baris 2: Lotus Nut, area bar, tangga
  "50% 53%", "50% 50%",                 // baris 3: interior, kopi dalam gelas
  "50% 50%", "50% 54%", "50% 45%"       // baris 4: Lotus Matcha, interior, roti Biscoff
];

// Tata letak selalu penuh: jumlah slot dibulatkan ke atas ke kelipatan 11.
// Slot yang belum punya foto dari database menampilkan gambar gagal memuat.
function susunTata(jumlah) {
  const foto = [];
  const tinggi = [];
  const siklus = Math.max(1, Math.ceil(jumlah / SIKLUS.foto.length));

  for (let i = 0; i < siklus; i++) {
    const dasar = tinggi.length;
    SIKLUS.foto.forEach((f) => foto.push({ c: f.c, r: dasar + f.r, tinggiBaris: f.tinggiBaris || 1 }));
    tinggi.push(...SIKLUS.tinggi);
  }
  return { foto, tinggi };
}

function terapkanTata(grid, tata) {
  grid.style.gridTemplateColumns = `repeat(${LEBAR_GRID}, 1fr)`;
  grid.style.gridTemplateRows = tata.tinggi.map((t) => `calc(${t} * var(--u))`).join(" ");
}

function terapkanPosisi(el, pos) {
  el.style.gridColumn = `${pos.c[0] + 1} / ${pos.c[1] + 1}`;
  el.style.gridRow = `${pos.r + 1} / span ${pos.tinggiBaris}`;
}

/* =======================================================
   FOTO: percobaan ekstensi lain bila file tidak ditemukan,
   lalu placeholder bila tetap gagal.
======================================================= */
function kandidatUrl(url) {
  const bersih = String(url || "").trim();
  if (!bersih) return [];
  const ada = bersih.match(/^(.*)\.(png|jpe?g|webp)$/i);
  const dasar = ada ? ada[1] : bersih;
  const lain = ["jpeg", "jpg", "png", "webp"].map((e) => `${dasar}.${e}`);
  return [...new Set([bersih, ...lain])];
}

// Memasang foto ke <img>. onSelesai(true/false) dipanggil sekali.
function pasangFoto(img, url, onSelesai) {
  const daftar = kandidatUrl(url);
  let i = 0;
  const coba = () => {
    if (i >= daftar.length) {
      img.onload = img.onerror = null;
      onSelesai && onSelesai(false);
      return;
    }
    img.src = daftar[i++];
  };
  img.onload = () => { img.onload = img.onerror = null; onSelesai && onSelesai(true); };
  img.onerror = coba;
  coba();
}

/* =======================================================
   SKELETON, PESAN GAGAL, KOSONG
======================================================= */
function tampilkanSkeleton() {
  hapusPesan();
  elHero.classList.remove("gagal");
  elHero.classList.add("memuat");               // banner putih (skeleton)
  elHero.classList.remove("siap");
  elHeroBg.style.backgroundImage = "";
  elGrid.classList.add("galeri-skel");
  const tata = susunTata(SIKLUS.foto.length);
  terapkanTata(elGrid, tata);
  elGrid.innerHTML = "";
  tata.foto.forEach((pos) => {
    const kotak = document.createElement("div");
    kotak.className = "galeri-item";
    terapkanPosisi(kotak, pos);
    elGrid.appendChild(kotak);
  });
  elArea.setAttribute("aria-busy", "true");
}

// Banner: foto PERTAMA dari database (urutan 1). Tidak ada gambar banner di folder frontend.
// Mengembalikan Promise yang selesai saat gambar siap atau gagal
// (bila gagal: versi placeholder biru + ikon).
function pasangBanner(foto) {
  return new Promise((selesai) => {
    const daftar = foto ? kandidatUrl(foto.foto) : [];
    let i = 0;
    const gagal = () => { elHero.classList.add("gagal"); selesai(); };
    const coba = () => {
      if (i >= daftar.length) return gagal();
      const url = daftar[i++];
      const uji = new Image();
      uji.onload = () => {
        elHeroBg.style.backgroundImage = `url("${url}")`;
        elHero.classList.remove("gagal");
        selesai();
      };
      uji.onerror = coba;
      uji.src = url;
    };
    coba();
  });
}

function hapusPesan() {
  document.getElementById("galeri-toast")?.remove();
}

// Toast kuning "Gagal memuat Gallery"; skeleton tetap tampil di belakangnya.
function buatToast(teks, id, onUlang) {
  const toast = document.createElement("div");
  toast.id = id;
  toast.className = "galeri-toast";
  toast.setAttribute("role", "alert");
  toast.innerHTML = `<span>${teks}</span><button type="button">Muat ulang</button>`;
  toast.querySelector("button").addEventListener("click", (e) => {
    e.currentTarget.disabled = true;
    onUlang();
  });
  return toast;
}

function tampilkanGagal() {
  hapusPesan();
  document.body.appendChild(buatToast("Gagal memuat Gallery", "galeri-toast", muatGaleri));
  elArea.setAttribute("aria-busy", "false");
}

/* =======================================================
   RENDER GRID
======================================================= */
const GAL_GAGAL_IMG = "assets/foto-gagal.svg";

// Isi kotak dengan gambar "Gagal Memuat Foto".
function tandaiGagal(el) {
  el.classList.remove("memuat");
  el.classList.add("gagal");
  el.innerHTML = `<div class="galeri-gagal"><img src="${GAL_GAGAL_IMG}" alt="Foto gagal dimuat"></div>`;
}

/* Efek tampil: sebuah kotak baru "muncul" bila fotonya sudah siap (sudah di-decode, jadi
   tidak ada patah-patah saat scroll) DAN kotaknya sudah masuk layar. Kotak yang muncul
   bersamaan diberi jeda bertingkat (stagger) supaya terlihat mengalir. */
let urutMuncul = 0;
let jedaMuncul = null;
const pengamat = ("IntersectionObserver" in window)
  ? new IntersectionObserver((entri) => {
      entri.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target._terlihat = true;
        pengamat.unobserve(e.target);
        munculkanKotak(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 })
  : null;

function munculkanKotak(el) {
  if (!el._siap || (pengamat && !el._terlihat) || el.classList.contains("muncul")) return;
  const jeda = kurangiGerak ? 0 : Math.min(urutMuncul++, 6) * 70;
  clearTimeout(jedaMuncul);
  jedaMuncul = setTimeout(() => { urutMuncul = 0; }, 160);
  el.style.setProperty("--d", `${jeda}ms`);
  el.classList.remove("memuat");
  el.classList.add("muncul");
}

// Parallax banner: foto bergeser lebih lambat dari scroll (murni transform, ringan).
let rafParallax = 0;
function geserBanner() {
  rafParallax = 0;
  const r = elHero.getBoundingClientRect();
  if (r.bottom < 0) return;
  const geser = Math.min(Math.max(-r.top, 0), r.height) * 0.25;
  elHeroBg.style.transform = `translate3d(0, ${geser.toFixed(1)}px, 0)`;
}
if (!kurangiGerak) {
  window.addEventListener("scroll", () => {
    if (!rafParallax) rafParallax = requestAnimationFrame(geserBanner);
  }, { passive: true });
}

// Tiap kotak tampil sendiri begitu fotonya siap (tidak menunggu foto lain).
function renderGrid() {
  elGrid.classList.remove("galeri-skel");
  if (pengamat) pengamat.disconnect();
  elGrid.innerHTML = "";
  const tata = susunTata(daftarFoto.length);
  terapkanTata(elGrid, tata);
  const frag = document.createDocumentFragment();

  tata.foto.forEach((pos, i) => {
    const foto = daftarFoto[i];

    // Belum ada foto untuk slot ini
    if (!foto) {
      const kosong = document.createElement("div");
      kosong.className = "galeri-item";
      terapkanPosisi(kosong, pos);
      tandaiGagal(kosong);
      frag.appendChild(kosong);
      return;
    }

    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.className = "galeri-item memuat";
    tombol.dataset.indeks = i;
    tombol.setAttribute("aria-label", `Buka foto galeri ${i + 1}`);
    terapkanPosisi(tombol, pos);

    const img = document.createElement("img");
    img.alt = `Foto galeri ${i + 1}`;
    img.decoding = "async";
    img.loading = i < GAL_FOTO_AWAL ? "eager" : "lazy";
    if (i < GAL_FOTO_AWAL) img.fetchPriority = "high";
    img.style.objectPosition = POSISI_FOTO[i % POSISI_FOTO.length];
    tombol.appendChild(img);

    pasangFoto(img, foto.foto, (berhasil) => {
      if (!berhasil) return tandaiGagal(tombol);
      // decode() menguraikan foto di luar thread utama -> scroll tetap mulus saat foto muncul
      const siap = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      siap.then(() => { tombol._siap = true; munculkanKotak(tombol); });
    });

    frag.appendChild(tombol);
  });

  elGrid.appendChild(frag);
  if (pengamat) elGrid.querySelectorAll("button.galeri-item").forEach((k) => pengamat.observe(k));
}

elGrid.addEventListener("click", (e) => {
  const tombol = e.target.closest(".galeri-item");
  if (!tombol || tombol.dataset.indeks === undefined) return;
  bukaPopup(Number(tombol.dataset.indeks), tombol);
});

/* =======================================================
   POPUP DETAIL
======================================================= */
function kerangkaPopup() {
  elPopup.innerHTML = `
    <div class="galeri-popup__kartu">
      <button type="button" class="galeri-popup__tutup" aria-label="Tutup">&times;</button>
      <button type="button" class="galeri-popup__nav prev" aria-label="Foto sebelumnya">&#8249;</button>
      <button type="button" class="galeri-popup__nav next" aria-label="Foto berikutnya">&#8250;</button>
      <div class="galeri-popup__foto"><div><div class="galeri-skel-foto"></div><img alt=""></div></div>
      <div class="galeri-popup__isi" id="galeri-popup-isi"></div>
    </div>`;
}

function isiPopupMemuat() {
  document.getElementById("galeri-popup-isi").innerHTML = `
    <div class="galeri-popup__skel-teks judul"></div>
    <div class="galeri-popup__skel-teks"></div>
    <div class="galeri-popup__skel-teks"></div>
    <div class="galeri-popup__skel-teks"></div>
    <div class="galeri-popup__skel-teks"></div>
    <div class="galeri-popup__skel-teks pendek"></div>
    <div class="galeri-popup__skel-logo"></div>`;
  document.getElementById("galeri-toast-detail")?.remove();
}

async function muatDetail(indeks) {
  const foto = daftarFoto[indeks];
  const isi  = document.getElementById("galeri-popup-isi");
  const bingkai = elPopup.querySelector(".galeri-popup__foto > div");
  const img  = bingkai.querySelector("img");

  // Foto langsung tampil dari data daftar, detail teks menyusul.
  bingkai.querySelector(".galeri-skel-foto").hidden = false;
  img.style.visibility = "hidden";
  bingkai.querySelector(".galeri-gagal")?.remove();
  pasangFoto(img, foto.foto, (berhasil) => {
    if (indeks !== indeksAktif) return;
    bingkai.querySelector(".galeri-skel-foto").hidden = true;
    if (berhasil) {
      img.style.visibility = "visible";
    } else {
      bingkai.insertAdjacentHTML("beforeend",
        `<div class="galeri-gagal"><img src="${GAL_GAGAL_IMG}" alt="Foto gagal dimuat"></div>`);
    }
  });
  isiPopupMemuat();

  const detail = await fetchData(`/gallery?id=${encodeURIComponent(foto.id)}`);
  if (indeks !== indeksAktif) return;   // pengguna sudah pindah foto

  if (!detail || typeof detail !== "object") {
    // Skeleton teks tetap tampil, toast kuning di bawah popup.
    elPopup.appendChild(buatToast("Gagal memuat detail foto", "galeri-toast-detail", () => muatDetail(indeks)));
    return;
  }

  const judul = String(detail.judul || "").trim() || "Galeri Ácala";
  const deskripsi = String(detail.deskripsi || "").trim();
  isi.innerHTML = `
    <h2>${esc(judul)}</h2>
    ${deskripsi ? `<p>${esc(deskripsi)}</p>` : ""}
    <img class="galeri-popup__logo" src="${GAL_LOGO}" alt="Café Ácala">`;
  img.alt = judul;
}

function bukaPopup(indeks, pemicu) {
  if (!daftarFoto[indeks]) return;
  if (pemicu) pemicuPopup = pemicu;
  indeksAktif = indeks;

  if (elPopup.hidden) {
    kerangkaPopup();
    elPopup.hidden = false;
    document.body.classList.add("popup-buka");
    elPopup.querySelector(".galeri-popup__tutup").focus();
  }

  const satu = daftarFoto.length < 2;
  elPopup.querySelectorAll(".galeri-popup__nav").forEach((b) => { b.hidden = satu; });
  muatDetail(indeks);
}

function tutupPopup() {
  if (elPopup.hidden) return;
  elPopup.hidden = true;
  elPopup.innerHTML = "";
  indeksAktif = -1;
  document.body.classList.remove("popup-buka");
  if (pemicuPopup && document.contains(pemicuPopup)) pemicuPopup.focus();
}

function pindahFoto(arah) {
  if (indeksAktif < 0 || daftarFoto.length < 2) return;
  const n = daftarFoto.length;
  bukaPopup((indeksAktif + arah + n) % n);
}

elPopup.addEventListener("click", (e) => {
  if (e.target === elPopup || e.target.closest(".galeri-popup__tutup")) return tutupPopup();
  if (e.target.closest(".galeri-popup__nav.prev")) return pindahFoto(-1);
  if (e.target.closest(".galeri-popup__nav.next")) return pindahFoto(1);
});

document.addEventListener("keydown", (e) => {
  if (elPopup.hidden) return;
  if (e.key === "Escape") tutupPopup();
  else if (e.key === "ArrowLeft") pindahFoto(-1);
  else if (e.key === "ArrowRight") pindahFoto(1);
});

/* =======================================================
   MUAT DATA
======================================================= */
async function muatGaleri() {
  const nomor = ++nomorMuat;
  tampilkanSkeleton();

  const mulai = Date.now();
  const data = await fetchData("/gallery");   // null bila gagal

  // Gagal: skeleton tetap tampil, pesan "Gagal memuat galeri" di atasnya.
  if (!Array.isArray(data)) {
    const sisa = GAL_MIN_SKELETON - (Date.now() - mulai);
    if (sisa > 0) await tunggu(sisa);
    if (nomor !== nomorMuat) return;
    tampilkanGagal();
    return;
  }

  // Foto pertama (urutan 1) = banner; foto berikutnya mengisi 11 slot grid.
  const semua = data.filter((d) => d && d.id != null);
  const fotoBanner = semua[0] || null;
  daftarFoto = semua.slice(1);

  // Banner dan foto dimuat bersamaan; tiap foto muncul begitu siap.
  hapusPesan();
  const heroSiap = pasangBanner(fotoBanner);
  renderGrid();

  await Promise.race([heroSiap, tunggu(GAL_BATAS_HERO)]);
  const sisa = GAL_MIN_SKELETON - (Date.now() - mulai);
  if (sisa > 0) await tunggu(sisa);
  if (nomor !== nomorMuat) return;

  elHero.classList.remove("memuat");
  elHero.classList.add("siap");                  // memicu animasi zoom banner + judul
  elArea.setAttribute("aria-busy", "false");
}

muatGaleri();