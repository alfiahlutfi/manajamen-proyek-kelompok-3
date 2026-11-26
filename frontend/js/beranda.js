/* =======================================================
   PENGATURAN
======================================================= */
const PLACEHOLDER_FOTO = "assets/placeholder.png"; // Placeholder gambar
const BATAS_WAKTU      = 5000;  // Batas tunggu per data / peta (ms). Foto tidak dibatasi waktu: lambat tidak sama dengan gagal

/* =======================================================
   ESCAPE HTML (Mencegah XSS)
======================================================= */
function esc(string) {
  return String(string || "")
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =======================================================
   UTILITAS
======================================================= */
function tunggu(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ambil data API. Hasil null = gagal.
async function ambil(path) {
  try {
    return await Promise.race([
      fetchData(path),
      tunggu(BATAS_WAKTU).then(() => null)
    ]);
  } catch (err) {
    console.warn("Gagal mengambil " + path, err);
    return null;
  }
}

const POLA_GAMBAR = /\.(jpe?g|png|webp|gif|svg|avif)(\?.*)?$/i;
function cariGambar(item, ...utama) {
  if (!item || typeof item !== "object") return "";

  const kolom = [...utama, "gambar", "foto", "image", "img", "thumbnail",
                 "poster", "banner", "gambar_event", "gambar_url", "path_gambar"];
  for (const k of kolom) {
    const v = item[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  for (const v of Object.values(item)) {
    if (typeof v === "string" && POLA_GAMBAR.test(v.trim())) return v.trim();
  }
  return "";
}

// Isi teks. Kalau kosong, elemen ditandai .skel-teks (tampil sebagai skeleton teks).
// jumlahBaris = banyak baris abu-abu skeleton untuk paragraf (0 = satu balok polos).
function isiTeks(el, nilai, jumlahBaris = 4) {
  if (!el) return true;
  const teks = String(nilai || "").trim();
  el.textContent = teks;
  el.classList.toggle("skel-teks", !teks);
  // Paragraf kosong: skeleton berupa 4 baris abu-abu (sesuai desain)
  if (!teks && el.tagName === "P") {
    for (let i = 0; i < jumlahBaris; i++) {
      const baris = document.createElement("span");
      baris.className = "skel-baris";
      el.appendChild(baris);
    }
  }
  return Boolean(teks);
}

// Tombol di bawah deskripsi jadi kotak abu-abu selama deskripsi gagal dimuat
function skeletonTombol(el, aktif) {
  const tombol = el && el.parentElement && el.parentElement.querySelector(".btn-garis");
  if (!tombol) return;
  tombol.classList.toggle("skel-btn", aktif);
  if (aktif) { tombol.setAttribute("aria-disabled", "true"); tombol.tabIndex = -1; }
  else { tombol.removeAttribute("aria-disabled"); tombol.removeAttribute("tabindex"); }
}

// Banner merah penuh lebar di bawah navbar. Tampil saat satu kartu gagal dimuat; hilang sendiri atau saat diklik.
function tampilkanBanner(teks) {
  let wadah = document.getElementById("banner-gagal-wadah");
  if (!wadah) {
    wadah = document.createElement("div");
    wadah.id = "banner-gagal-wadah";
    document.body.appendChild(wadah);
  }
  if ([...wadah.children].some(el => el.textContent === teks)) return;

  const nav = document.querySelector(".nav-acala");
  const tinggi = nav ? Math.round(nav.getBoundingClientRect().height) : 70;
  wadah.style.top = tinggi + "px";
  wadah.style.setProperty("--tinggi-banner", tinggi + "px");

  const banner = document.createElement("div");
  banner.className = "banner-gagal";
  banner.setAttribute("role", "alert");
  banner.textContent = teks;

  const tutup = () => {
    banner.classList.remove("tampil");
    setTimeout(() => banner.remove(), 300);
  };
  banner.addEventListener("click", tutup);
  wadah.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add("tampil"));
  setTimeout(tutup, 800);
}

/* =======================================================
   FOTO: tampilkan foto, kalau gagal pakai placeholder
======================================================= */
function pasangFoto(figure, src, alt) {
  return new Promise(resolve => {
    const img = figure && figure.querySelector("img");
    if (!img) {
      resolve(false);
      return;
    }

    img.alt = alt;
    img.loading = "eager";
    figure.classList.remove("gagal-foto");

    // Foto yang lambat dimuat TIDAK dianggap gagal: skeleton (kilau abu-abu) tetap tampil
    // sampai foto selesai diunduh. Gagal hanya bila benar-benar error (file tidak ada, offline, rusak).
    let selesai = false;

    const akhir = (berhasil) => {
      if (selesai) return;
      selesai = true;
      img.onload = null;
      img.onerror = null;
      figure.classList.remove("memuat");   // skeleton foto selesai (berhasil maupun gagal)

      if (!berhasil) {
        figure.classList.add("gagal-foto");
        img.src = PLACEHOLDER_FOTO;
      }
      resolve(berhasil);
    };

    img.onload  = () => akhir(true);
    img.onerror = () => akhir(false);

    if (!src) {
      akhir(false);
      return;
    }
    img.src = src;
  });
}

// Global error handler untuk gambar
document.addEventListener("error", (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (img.dataset.placeholder || !img.closest(".slide, .best-card, .foto-wrap")) return;

  img.dataset.placeholder = "1";
  img.src = PLACEHOLDER_FOTO;
}, true);

/* =======================================================
   FORMAT RUPIAH & JAM
======================================================= */
function rupiahSingkat(n) {
  return Math.round(Number(n || 0) / 1000) + "K";
}

function formatJam(teksJam) {
  if (!teksJam) return "";
  const bagianJam = String(teksJam).split(":");
  let angkaJam = parseInt(bagianJam[0], 10);
  if (isNaN(angkaJam)) return teksJam;

  const penanda = angkaJam >= 12 ? "PM" : "AM";
  angkaJam = angkaJam % 12 || 12;
  const menit = bagianJam[1];
  const teksMenit = menit && menit !== "00" ? ":" + menit : "";
  return String(angkaJam).padStart(2, "0") + teksMenit + " " + penanda;
}

const NAMA_HARI = [
  ["Monday", "senin"], ["Tuesday", "selasa"], ["Wednesday", "rabu"],
  ["Thursday", "kamis"], ["Friday", "jumat"], ["Saturday", "sabtu"], ["Sunday", "minggu"]
];

function indexHari(namaHari) {
  const namaBersih = String(namaHari || "").toLowerCase().replace(/[^a-z]/g, "");
  return NAMA_HARI.findIndex(([en, id]) => namaBersih === en.toLowerCase() || namaBersih === id);
}

function kelompokJam(daftarJam) {
  const daftarDenganUrutan = daftarJam.map(baris => ({ ...baris, urutanHari: indexHari(baris.hari) }));
  if (daftarDenganUrutan.some(b => b.urutanHari < 0)) {
    return daftarJam.map(baris => ({ label: baris.hari || "", buka: baris.jam_buka, tutup: baris.jam_tutup }));
  }
  daftarDenganUrutan.sort((a, b) => a.urutanHari - b.urutanHari);

  const daftarKelompok = [];
  daftarDenganUrutan.forEach(baris => {
    const terakhir = daftarKelompok[daftarKelompok.length - 1];
    if (terakhir && terakhir.buka === baris.jam_buka && terakhir.tutup === baris.jam_tutup && baris.urutanHari === terakhir.urutanAkhir + 1) {
      terakhir.urutanAkhir = baris.urutanHari;
    } else {
      daftarKelompok.push({ urutanAwal: baris.urutanHari, urutanAkhir: baris.urutanHari, buka: baris.jam_buka, tutup: baris.jam_tutup });
    }
  });

  return daftarKelompok.map(k => ({
    label: k.urutanAwal === k.urutanAkhir ? NAMA_HARI[k.urutanAwal][0] : NAMA_HARI[k.urutanAwal][0] + " - " + NAMA_HARI[k.urutanAkhir][0],
    buka: k.buka,
    tutup: k.tutup
  }));
}

/* =======================================================
   GOOGLE MAPS
======================================================= */
function ambilUrlEmbed(raw) {
  const teks = String(raw || "").trim();
  const m = teks.match(/src=["']([^"']+)["']/i);
  return (m ? m[1] : teks).trim();
}

function urlGoogleMaps(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && /(^|\.)(google\.[a-z.]+|goo\.gl|g\.page)$/i.test(u.hostname);
  } catch (err) {
    return false;
  }
}

// Kotak status peta: memuat / gagal (data lokasi gagal, ada tombol Muat Ulang) /
// akses (Google Maps tidak dapat diakses) / ok (peta tampil).
function setPeta(jenis, onUlang) {
  const wadah = document.getElementById("peta-wadah");
  const state = document.getElementById("peta-state");
  if (!wadah || !state) return;

  wadah.classList.toggle("peta-ok", jenis === "ok");
  state.className = "peta-state peta-state--" + jenis;
  state.removeAttribute("aria-label");

  if (jenis === "memuat") {
    state.setAttribute("role", "status");
    state.innerHTML = `
      <span class="peta-loader" aria-hidden="true"><i></i><i></i></span>
      <p class="peta-state__judul">Memuat Peta</p>
      <p class="peta-state__sub">Harap Tunggu Sebentar</p>`;
  } else if (jenis === "gagal") {
    state.setAttribute("role", "alert");
    state.innerHTML = `
      <p class="peta-state__judul">Gagal Memuat Peta</p>
      <button type="button" class="btn-peta-ulang">Muat Ulang</button>`;
    const tombol = state.querySelector(".btn-peta-ulang");
    tombol.addEventListener("click", () => {
      tombol.disabled = true;
      if (typeof onUlang === "function") onUlang();
    });
  } else {
    state.setAttribute("role", "img");
    state.setAttribute("aria-label", "Peta tidak tersedia");
    state.innerHTML = "";
  }
}

// Pasang iframe peta. Hasil true hanya bila Google Maps terjangkau DAN iframe selesai dimuat
// sebelum batas waktu. Iframe tetap memicu "load" walau Google tidak terjangkau (yang tampil
// halaman error browser), jadi jangkauannya dicek terpisah dengan permintaan ringan.
function pasangPeta(iframe, url) {
  return new Promise(resolve => {
    if (!iframe) {
      resolve(false);
      return;
    }

    let selesai = false;
    let batas = null;
    let terjangkau = null;   // null = belum diketahui
    let termuat = false;

    const akhir = (berhasil) => {
      if (selesai) return;
      selesai = true;
      clearTimeout(batas);
      iframe.onload = null;
      if (!berhasil) iframe.removeAttribute("src");
      resolve(berhasil);
    };
    const periksa = () => {
      if (terjangkau === false) akhir(false);
      else if (terjangkau === true && termuat) akhir(true);
    };

    batas = setTimeout(() => akhir(false), BATAS_WAKTU);
    if (!urlGoogleMaps(url) || navigator.onLine === false) {
      akhir(false);
      return;
    }

    fetch(url, { mode: "no-cors", cache: "no-store" })
      .then(() => { terjangkau = true; periksa(); })
      .catch(() => { terjangkau = false; periksa(); });

    iframe.loading = "eager";
    iframe.onload = () => { termuat = true; periksa(); };
    iframe.src = url;
  });
}

/* =======================================================
   SKELETON PER KARTU
   Tiap kartu beranda (carousel, deskripsi About, deskripsi Reservasi, jam operasional,
   menu pilihan, lokasi) dimuat sendiri dan menampilkan skeleton / hasil / gagal sendiri.
   Tidak ada skeleton halaman penuh dan tidak ada kartu yang menunggu kartu lain.
======================================================= */
function mulaiSkeletonAwal() {
  // Teks deskripsi & alamat: balok abu-abu sampai datanya tiba
  const judulAbout = document.getElementById("judul-about");
  const deskripsi  = document.getElementById("deskripsi");
  const judulRes   = document.getElementById("judul-reservasi");
  const deskripsiR = document.getElementById("deskripsi-reservasi");
  isiTeks(judulAbout, "");
  isiTeks(deskripsi, "");
  isiTeks(judulRes, "");
  isiTeks(deskripsiR, "");
  skeletonTombol(deskripsi, true);
  skeletonTombol(deskripsiR, true);
  // Simpan teks awal alamat (dari HTML) supaya bisa dikembalikan bila data lokasi gagal dimuat
  const alamatEl = document.getElementById("alamat");
  if (alamatEl) {
    alamatEl.dataset.teksAwal = alamatEl.textContent;
    isiTeks(alamatEl, "", 0);
  }

  // Foto About & Reservasi: kilau abu-abu sampai foto siap
  document.querySelectorAll(".foto-wrap").forEach(f => f.classList.add("memuat"));

  // Jam operasional: gambar skeleton sampai datanya tiba
  skeletonJam(true);
}

/* =======================================================
   ABOUT (profil cafe): kartu sendiri, data dari /cafe
======================================================= */
async function tampilkanAbout() {
  const cafeData = await ambil("/cafe");
  const cafe = (Array.isArray(cafeData) ? cafeData[0] : cafeData) || null;
  const c = cafe || {};
  const nama = c.nama || "Café Ácala";

  isiTeks(document.getElementById("judul-about"), c.judul_deskripsi || c.judul_about || c.judul);
  const deskripsiOk = isiTeks(document.getElementById("deskripsi"), c.deskripsi_about || c.deskripsi);

  // Gagal memuat data: yang tampil hanya skeleton (judul, baris teks, tombol) + banner
  const gagal = !cafe || !deskripsiOk;
  skeletonTombol(document.getElementById("deskripsi"), gagal);
  if (gagal) tampilkanBanner("Gagal Memuat Data Deskripsi");

  // Foto dipasang setelah teks; tidak menahan kartu lain
  const src = c.gambar_about || c.foto || "";
  const fotoOk = await pasangFoto(document.querySelector(".foto-wrap.kiri"), src, "Tampak depan " + nama);
  // Kalau datanya sendiri yang gagal (tidak ada alamat foto), cukup banner data deskripsi
  if (src && !fotoOk) tampilkanBanner("Gagal Memuat Foto");
}

/* =======================================================
   RESERVASI (deskripsi layanan): kartu sendiri, data dari /reservasi
======================================================= */
async function tampilkanReservasi() {
  const data = await ambil("/reservasi");
  const reservasi = (Array.isArray(data) ? data[0] : data) || null;
  const r = reservasi || {};

  isiTeks(document.getElementById("judul-reservasi"), r.judul);
  const deskripsiOk = isiTeks(document.getElementById("deskripsi-reservasi"), r.deskripsi);

  const gagal = !reservasi || !deskripsiOk;
  skeletonTombol(document.getElementById("deskripsi-reservasi"), gagal);
  if (gagal) tampilkanBanner("Gagal Memuat Data Deskripsi");

  const src = r.foto || "";
  const fotoOk = await pasangFoto(document.querySelector(".foto-wrap.kanan"), src, "Area indoor Café Ácala");
  if (src && !fotoOk) tampilkanBanner("Gagal Memuat Foto");
}

/* =======================================================
   JAM OPERASIONAL: kartu sendiri, data dari /operating-hours
   Gagal memuat: hanya bagian "Open Hours" yang tampil sebagai skeleton
   (assets/skeleton_jam.png) + banner merah "Gagal Memuat Jam Operasional".
======================================================= */
function skeletonJam(aktif) {
  const kotak = document.querySelector(".jam-wrap .retak");
  if (!kotak) return;
  kotak.classList.toggle("skel-jam", aktif);
  if (aktif) kotak.setAttribute("aria-busy", "true");
  else kotak.removeAttribute("aria-busy");
}

async function tampilkanJam() {
  const openHours = document.getElementById("open-hours");
  if (!openHours) return;

  // ?error=jam -> simulasi jam operasional gagal dimuat (untuk pengujian SQA)
  const simulasiGagal = new URLSearchParams(location.search).get("error") === "jam";
  const hours = simulasiGagal ? null : await ambil("/operating-hours");

  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    openHours.innerHTML = "";
    skeletonJam(true);
    tampilkanBanner("Gagal Memuat Jam Operasional");
    return;
  }

  // API sudah hanya mengirim jam milik cafe utama, jadi tidak perlu data /cafe di sini
  skeletonJam(false);
  openHours.innerHTML = kelompokJam(hours).map(kelompok => `
    <div>
      <h3>${esc(kelompok.label)}</h3>
      <p>${formatJam(kelompok.buka)} - ${formatJam(kelompok.tutup)}</p>
    </div>
  `).join("");
}

/* =======================================================
   LOKASI (location.php): kartu sendiri
   Peta punya tiga kondisi sesuai desain:
   - memuat                      -> kotak abu-abu "Memuat Peta"
   - data lokasi gagal dimuat    -> "Gagal Memuat Peta" + tombol Muat Ulang
   - Google Maps tidak bisa dibuka (link/embed salah, offline, terlalu lama)
                                 -> kotak biru muda + banner "Google Maps Tidak Dapat Diakses"
======================================================= */
async function isiLokasi() {
  setPeta("memuat");

  const lokasiData = await ambil("/lokasi");
  const lokasi = (Array.isArray(lokasiData) ? lokasiData[0] : lokasiData) || null;
  const l = lokasi || {};

  // Alamat: isi dari database. Bila kosong / gagal dimuat, kembali ke teks awal (tanpa skeleton).
  const alamatEl = document.getElementById("alamat");
  if (alamatEl) {
    if (String(l.alamat || "").trim()) {
      isiTeks(alamatEl, l.alamat, 0);
    } else {
      alamatEl.classList.remove("skel-teks");
      alamatEl.textContent = alamatEl.dataset.teksAwal || "";
    }
  }

  // Tombol Maps
  const btnMaps = document.getElementById("btn-maps");
  const linkMaps = String(
  l.link_maps ||
  "https://www.google.com/maps/search/?api=1&query=Jl.+Pasawahan,+Pasawahan,+Kuningan,+Jawa+Barat+45559"
).trim();
  const linkOk = urlGoogleMaps(linkMaps);

  if (btnMaps) {
    if (linkOk) {
      btnMaps.href = linkMaps;
      btnMaps.target = "_blank";
      btnMaps.rel = "noopener noreferrer";
      btnMaps.style.pointerEvents = "auto";
      btnMaps.style.opacity = "1";
    } else {
      btnMaps.removeAttribute("href");
      btnMaps.removeAttribute("target");
      btnMaps.style.pointerEvents = "none";
      btnMaps.style.opacity = "0.6";
    }
  }

  // Data lokasi gagal dimuat: peta tidak punya alamat untuk dimuat
  if (!lokasi) {
    setPeta("gagal", isiLokasi);
    return;
  }

  // Data ada, tetapi link Google Maps kosong / tidak valid
  if (!linkOk) tampilkanBanner("Google Maps Tidak Dapat Diakses");

  const mapUrl = ambilUrlEmbed(l.link_maps_embed || l.maps_embed_url || l.peta_embed || "");
  const petaOk = await pasangPeta(document.getElementById("peta"), mapUrl);

  if (petaOk) {
      setPeta("ok");
  } else {
      setPeta("gagal", isiLokasi);
  }
}

/* =======================================================
   HERO CAROUSEL
======================================================= */
async function tampilkanHero() {
  const carousel = await ambil("/carousel");

  const hero = document.getElementById("event");
  const judul = document.getElementById("hero-judul");
  const slider = document.getElementById("hero-slider");
  const bg = document.getElementById("hero-bg");
  const btn = document.getElementById("hero-btn");

  if (!judul || !slider || !bg || !btn) return;

  // Gagal memuat: skeleton carousel tetap tampil + banner merah
  if (!Array.isArray(carousel)) {
    tampilkanBanner("Gagal Memuat Foto Carousel");
    return;
  }

  // Data tiba: skeleton carousel dilepas (tidak menunggu kartu lain)
  hero.classList.remove("skel-hero");
  hero.removeAttribute("aria-busy");
  slider.innerHTML = "";

  if (carousel.length === 0) {
    judul.textContent = "Café Ácala";
    slider.innerHTML = "";
    bg.innerHTML = "";
    btn.href = "#";
    btn.hidden = true;                  // tidak ada event: tombol detail disembunyikan
    return;
  }

  const n = carousel.length;
  const teksHero = judul.parentElement;
  const kurangiGerak = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DURASI = 5000;        // jeda otomatis antar event (ms)
  const DURASI_GESER = 500;   // harus sama dengan transition .slide di style.css
  let i = 0;
  let timer;
  let sudahTampil = false;

  // Kartu dibuat SEKALI. Saat pindah, hanya kelas posisinya yang berganti,
  // sehingga CSS transition membuat kartu bergeser dan bertukar ukuran.
  slider.innerHTML = carousel.map((data, idx) => `
    <button type="button" class="slide" data-idx="${idx}" aria-label="${esc(data.nama || "Event")}">
      <img src="${esc(cariGambar(data) || PLACEHOLDER_FOTO)}" alt="${esc(data.nama || "Event")}" draggable="false">
    </button>
  `).join("");
  const kartu = Array.from(slider.querySelectorAll(".slide"));

  // Foto carousel gagal dimuat: slide memakai placeholder (lihat handler error global) + banner
  let fotoGagal = false;
  kartu.forEach((el) => {
    el.querySelector("img").addEventListener("error", () => {
      if (fotoGagal) return;
      fotoGagal = true;
      tampilkanBanner("Gagal Memuat Foto Carousel");
    });
  });

  // Posisi kartu terhadap event aktif (i)
  function kelasPosisi(idx) {
    const selisih = (idx - i + n) % n;
    if (selisih === 0) return "tengah";
    if (n === 2) return "kanan";
    if (selisih === 1) return "kanan";
    if (selisih === n - 1) return "kiri";
    return "sembunyi";                  // cadangan jika event lebih dari 3
  }

  // Latar: gambar baru ditumpuk di atas lalu di-fade-in; lapisan lama dibuang setelahnya
  function gantiLatar(url) {
    const lama = Array.from(bg.querySelectorAll(".hero-bg__layer"));
    if (!url) { lama.forEach((l) => l.remove()); return; }

    const baru = document.createElement("div");
    baru.className = "hero-bg__layer";
    baru.style.backgroundImage = `url("${url}")`;
    bg.appendChild(baru);

    if (kurangiGerak || !sudahTampil) {
      baru.classList.add("tampil");
      lama.forEach((l) => l.remove());
      return;
    }
    void baru.offsetWidth;              // paksa reflow agar transition opacity berjalan
    baru.classList.add("tampil");
    setTimeout(() => lama.forEach((l) => l.remove()), DURASI_GESER);
  }

  function isiTeks() {
    const item = carousel[i];
    judul.textContent = item.nama || "Café Ácala";
    // Tombol "Join the Class" menuju bagian event terkait di halaman event.
    // API /carousel mengirim id event pada field `id` (bukan `id_event`).
    const idEvent = item.id ?? item.id_event;
    if (idEvent !== undefined && idEvent !== null && idEvent !== "") {
      const kode = encodeURIComponent(idEvent);
      btn.href = `event.html?id=${kode}#event-${kode}`;
      btn.hidden = false;
    } else {
      btn.href = "#";
      btn.hidden = true;
    }
  }

  function render() {
    // 1) Posisi kartu (bergeser lewat CSS transition)
    kartu.forEach((el, idx) => {
      const lama = ["kiri", "tengah", "kanan"].find((k) => el.classList.contains(k));
      const baru = kelasPosisi(idx);
      if (lama === baru) return;

      // Kartu yang menyeberang dari kiri ke kanan (atau sebaliknya) lewat di belakang
      if ((lama === "kiri" && baru === "kanan") || (lama === "kanan" && baru === "kiri")) {
        el.classList.add("melintas");
        setTimeout(() => el.classList.remove("melintas"), DURASI_GESER);
      }
      el.classList.remove("kiri", "tengah", "kanan", "sembunyi");
      el.classList.add(baru);
      if (baru === "tengah") el.setAttribute("aria-current", "true");
      else el.removeAttribute("aria-current");
    });

    // 2) Latar (cross-fade) dan teks (fade)
    gantiLatar(cariGambar(carousel[i]));
    if (!sudahTampil || kurangiGerak) {
      isiTeks();
    } else {
      teksHero.classList.add("ganti");
      setTimeout(() => { isiTeks(); teksHero.classList.remove("ganti"); }, 250);
    }
    sudahTampil = true;
  }

  function pindah(ke) {
    const tujuan = (ke + n) % n;
    if (tujuan === i) return;
    i = tujuan;
    render();
  }

  function berhenti() {
    clearInterval(timer);
    timer = null;
  }

  function mulai() {
    berhenti();
    if (n > 1 && !kurangiGerak) {
      timer = setInterval(() => pindah(i + 1), DURASI);
    }
  }

  if (n > 1) {
    // Klik kartu kiri/kanan: kartu itu naik jadi tengah, kartu lain ikut berputar
    slider.addEventListener("click", (e) => {
      const tombol = e.target.closest(".slide");
      if (!tombol || !slider.contains(tombol) || tombol.classList.contains("tengah")) return;
      pindah(Number(tombol.dataset.idx));
      mulai();
    });

    slider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { pindah(i - 1); mulai(); }
      else if (e.key === "ArrowRight") { pindah(i + 1); mulai(); }
    });

    let awalX = null;
    slider.addEventListener("touchstart", (e) => { awalX = e.touches[0].clientX; berhenti(); }, { passive: true });
    slider.addEventListener("touchend", (e) => {
      if (awalX !== null) {
        const selisih = e.changedTouches[0].clientX - awalX;
        if (Math.abs(selisih) > 40) pindah(selisih < 0 ? i + 1 : i - 1);
      }
      awalX = null;
      mulai();
    });

    const hero = slider.closest(".hero") || slider;
    hero.addEventListener("mouseenter", berhenti);
    hero.addEventListener("mouseleave", mulai);
  }

  render();
  mulai();
}

/* =======================================================
   SIGNATURE
======================================================= */
// Kartu menu pilihan: skeleton 4 kartu sudah ada di index.html. Gagal = skeleton tetap + banner merah.
async function tampilkanSignature() {
  const wadah = document.getElementById("best-list");
  if (!wadah) return;

  const menu = await ambil("/menu?label=signature");

  if (!Array.isArray(menu)) {
    wadah.setAttribute("aria-busy", "false");
    tampilkanBanner("Gagal Memuat Menu Pilihan");
    return;
  }

  // Tampilkan SEMUA menu yang dikembalikan API (API sudah membatasi jumlahnya)
  if (menu.length === 0) {
    wadah.setAttribute("aria-busy", "false");
    wadah.innerHTML = `<p>Menu signature belum tersedia.</p>`;
    return;
  }

  // Klik kartu -> halaman menu dengan kategori menu tersebut langsung aktif
  wadah.innerHTML = menu.map(m => {
    const tujuan = m.category_id != null
      ? `menu.html?kategori=${encodeURIComponent(m.category_id)}`
      : "menu.html";
    return `
    <a class="best-card" href="${tujuan}">
      <img src="${esc(cariGambar(m) || PLACEHOLDER_FOTO)}" alt="${esc(m.nama || "Menu")}" loading="lazy">
      <h3>${esc(m.nama || "")}</h3>
      <small>${rupiahSingkat(m.harga)}</small>
    </a>`;
  }).join("");
  wadah.setAttribute("aria-busy", "false");
}

/* =======================================================
   JALANKAN SEMUA: setiap kartu berjalan sendiri-sendiri (paralel, tanpa saling menunggu)
======================================================= */
function mulaiBeranda() {
  mulaiSkeletonAwal();
  tampilkanHero();
  tampilkanAbout();
  tampilkanReservasi();
  tampilkanJam();
  tampilkanSignature();
  isiLokasi();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mulaiBeranda);
} else {
  mulaiBeranda();
}