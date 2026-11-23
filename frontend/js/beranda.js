/* =======================================================
   PENGATURAN
======================================================= */
const PLACEHOLDER_FOTO = "assets/placeholder.png"; // Placeholder gambar
const BATAS_WAKTU      = 5000;  // Batas tunggu per data / foto / peta (ms)

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
// true bila data utama beranda (carousel, signature) gagal dimuat -> skeleton halaman penuh dipertahankan
let gagalMuat = false;

// Banner merah gagal memuat (data deskripsi / foto). Ditampung dulu, ditampilkan setelah skeleton halaman dilepas.
const antrianBanner = [];

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
function isiTeks(el, nilai) {
  if (!el) return true;
  const teks = String(nilai || "").trim();
  el.textContent = teks;
  el.classList.toggle("skel-teks", !teks);
  // Paragraf kosong: skeleton berupa 4 baris abu-abu (sesuai desain)
  if (!teks && el.tagName === "P") {
    for (let i = 0; i < 4; i++) {
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

// Banner merah penuh lebar di bawah navbar. Hilang sendiri setelah 6 detik atau saat diklik.
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

function tampilkanAntrianBanner() {
  antrianBanner.splice(0).forEach(tampilkanBanner);
}

// Tampilkan / hapus pesan gagal tepat setelah elemen "jangkar".
function tampilPesan(jangkar, kunci, teks) {
  if (!jangkar || !jangkar.parentElement) return;

  const induk = jangkar.parentElement;
  let p = induk.querySelector(`:scope > [data-pesan="${kunci}"]`);

  if (!teks) {
    if (p) p.remove();
    return;
  }

  if (!p) {
    p = document.createElement("p");
    p.className = "pesan-gagal";
    p.dataset.pesan = kunci;
    p.setAttribute("role", "alert");
    jangkar.insertAdjacentElement("afterend", p);
  }
  p.textContent = teks;
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

    let selesai = false;
    let batas = null;

    const akhir = (berhasil) => {
      if (selesai) return;
      selesai = true;
      clearTimeout(batas);
      img.onload = null;
      img.onerror = null;

      if (!berhasil) {
        figure.classList.add("gagal-foto");
        img.src = PLACEHOLDER_FOTO;
      }
      resolve(berhasil);
    };

    batas = setTimeout(() => akhir(false), BATAS_WAKTU);
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

function pasangPeta(wadah, iframe, url) {
  return new Promise(resolve => {
    if (!wadah || !iframe) {
      resolve(false);
      return;
    }

    wadah.classList.remove("gagal-foto");
    wadah.querySelectorAll(".peta-placeholder").forEach(el => el.remove());

    let selesai = false;
    let batas = null;

    const akhir = (berhasil) => {
      if (selesai) return;
      selesai = true;
      clearTimeout(batas);
      iframe.onload = null;

      if (!berhasil) {
        wadah.classList.add("gagal-foto");
        iframe.removeAttribute("src");

        const img = new Image();
        img.className = "peta-placeholder";
        img.src = PLACEHOLDER_FOTO;
        img.alt = "Peta tidak tersedia";
        wadah.appendChild(img);
      }
      resolve(berhasil);
    };

    batas = setTimeout(() => akhir(false), BATAS_WAKTU);
    if (!urlGoogleMaps(url) || navigator.onLine === false) {
      akhir(false);
      return;
    }

    iframe.loading = "eager";
    iframe.onload = () => akhir(true);
    iframe.src = url;
  });
}

/* =======================================================
   SKELETON HALAMAN PENUH
======================================================= */

/* =======================================================
   BERANDA: ABOUT, RESERVASI, FOOTER, JAM OPERASIONAL
======================================================= */
async function tampilkanBeranda() {
  await Promise.allSettled([isiBeranda(), isiLokasi()]);
}

async function isiBeranda() {
  const [cafeData, hours, reservasiData] = await Promise.all([
    ambil("/cafe"),
    ambil("/operating-hours"),
    ambil("/reservasi")
  ]);

  const cafe = (Array.isArray(cafeData) ? cafeData[0] : cafeData) || null;
  const reservasi = (Array.isArray(reservasiData) ? reservasiData[0] : reservasiData) || {};

  const c = cafe || {};
  const nama = c.nama || "Café Ácala";

    // ----- ABOUT (PROFIL CAFE) -----
  const judulAbout = document.getElementById("judul-about");
  const deskripsi  = document.getElementById("deskripsi");

  // Judul: isi dari database. Kalau kosong/gagal, tampil skeleton teks.
  isiTeks(judulAbout, c.judul_deskripsi || c.judul_about || c.judul);

  const deskripsiOk = isiTeks(deskripsi, c.deskripsi_about || c.deskripsi);
  // Gagal memuat data deskripsi: yang tampil hanya skeleton (judul, baris teks, tombol) + banner
  const aboutGagal = !cafe || !deskripsiOk;
  skeletonTombol(deskripsi, aboutGagal);

  // ----- RESERVASI -----
  const judulReservasi     = document.getElementById("judul-reservasi");
  const deskripsiReservasi = document.getElementById("deskripsi-reservasi");

  isiTeks(judulReservasi, reservasi.judul || c.judul_reservasi);

  const deskripsiResOk = isiTeks(deskripsiReservasi, reservasi.deskripsi || c.deskripsi_reservasi);
  const reservasiGagal = !reservasiData || !deskripsiResOk;
  skeletonTombol(deskripsiReservasi, reservasiGagal);
  if (aboutGagal || reservasiGagal) antrianBanner.push("Gagal Memuat Data Deskripsi");

  // ----- JAM OPERASIONAL -----
  isiJamOperasional(hours, cafe);

  // Foto dipasang bersamaan, tidak menahan teks
  const srcAbout     = c.gambar_about || c.foto || "";
  const srcReservasi = reservasi.foto || c.gambar_reservasi || "";
  const [fotoAboutOk, fotoReservasiOk] = await Promise.all([
    pasangFoto(document.querySelector(".foto-wrap.kiri"), srcAbout, "Tampak depan " + nama),
    pasangFoto(document.querySelector(".foto-wrap.kanan"), srcReservasi, "Area indoor " + nama)
  ]);
  // Foto gagal dimuat: yang tampil placeholder (diatur pasangFoto) + banner.
  // Kalau datanya sendiri yang gagal (tidak ada alamat foto), cukup banner data deskripsi.
  if ((srcAbout && !fotoAboutOk) || (srcReservasi && !fotoReservasiOk)) {
    antrianBanner.push("Gagal Memuat Foto");
  }
}

/* =======================================================
   JAM OPERASIONAL
   Gagal memuat: hanya bagian "Open Hours" yang tampil sebagai skeleton
   (potongan dari skeleton halaman penuh, assets/skeleton_jam.png) +
   notifikasi merah "Gagal Memuat Jam Operasional". Bagian lain tetap normal.
======================================================= */
function skeletonJam(aktif) {
  const kotak = document.querySelector(".jam-wrap .retak");
  if (!kotak) return;
  kotak.classList.toggle("skel-jam", aktif);
  if (aktif) kotak.setAttribute("aria-busy", "true");
  else kotak.removeAttribute("aria-busy");
}

function isiJamOperasional(hours, cafe) {
  const openHours = document.getElementById("open-hours");
  if (!openHours) return;

  // ?error=jam -> simulasi jam operasional gagal dimuat (untuk pengujian SQA)
  const simulasiGagal = new URLSearchParams(location.search).get("error") === "jam";

  if (simulasiGagal || !hours || !Array.isArray(hours) || hours.length === 0) {
    openHours.innerHTML = "";
    skeletonJam(true);
    antrianBanner.push("Gagal Memuat Jam Operasional");
    return;
  }

  // Coba filter berdasarkan cafe_id, tetapi jika hasilnya kosong,
  // gunakan seluruh data jam yang ada agar tetap bisa tampil di web.
  let cafeHours = hours;
  if (cafe && cafe.id) {
    const terfilter = hours.filter(item => String(item.cafe_id || item.id_cafe || "") === String(cafe.id));
    if (terfilter.length > 0) {
      cafeHours = terfilter;
    }
  }

  skeletonJam(false);

  openHours.innerHTML = kelompokJam(cafeHours).map(kelompok => `
    <div>
      <h3>${esc(kelompok.label)}</h3>
      <p>${formatJam(kelompok.buka)} - ${formatJam(kelompok.tutup)}</p>
    </div>
  `).join("");
}

/* =======================================================
   LOKASI (location.php)
======================================================= */
async function isiLokasi() {
  const lokasiData = await ambil("/lokasi");
  const lokasi = (Array.isArray(lokasiData) ? lokasiData[0] : lokasiData) || null;
  const l = lokasi || {};

  const alamat  = document.getElementById("alamat");
  const btnMaps = document.getElementById("btn-maps");
  const peta    = document.getElementById("peta");

  // Alamat
  const alamatOk = isiTeks(alamat, l.alamat);

  // Pesan gagal hanya jika data lokasi gagal diambil / alamat kosong
  tampilPesan(
    alamat,
    "lokasi",
    !lokasi || !alamatOk ? "Gagal memuat lokasi cafe" : ""
  );

  // Tombol Maps
  const linkMaps = String(l.link_maps || "").trim();
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

    // BARU: pesan "Gagal membuka Google Maps" (hanya jika data lokasi
    // berhasil dimuat tetapi link Google Maps-nya kosong / tidak valid)
    tampilPesan(
      btnMaps,
      "maps",
      lokasi && !linkOk ? "Gagal membuka Google Maps" : ""
    );
  }

  // Peta embed
  const mapUrl = ambilUrlEmbed(l.link_maps_embed || l.maps_embed_url || l.peta_embed || "");
  const wadahPeta = peta ? peta.parentElement : null;

  if (wadahPeta) {
    const petaOk = await pasangPeta(wadahPeta, peta, mapUrl);

    // BARU: pesan "Gagal memuat peta" di bawah kotak peta.
    // Alamat dan tombol Maps tidak terpengaruh, tetap tampil.
    tampilPesan(
      wadahPeta,
      "peta",
      petaOk ? "" : "Gagal memuat peta"
    );
  }
}

/* =======================================================
   HERO CAROUSEL
======================================================= */
async function tampilkanHero() {
  const carousel = await ambil("/carousel");
  if (carousel === null) gagalMuat = true;

  const judul = document.getElementById("hero-judul");
  const slider = document.getElementById("hero-slider");
  const bg = document.getElementById("hero-bg");
  const btn = document.getElementById("hero-btn");

  if (!judul || !slider || !bg || !btn) return;

  if (!carousel || carousel.length === 0) {
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
  const DURASI = 4000;        // jeda otomatis antar event (ms)
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
const JUMLAH_SKELETON_SIGNATURE = 4;

// Skeleton kartu menu pilihan (bentuk kartu sama dengan aslinya)
function skeletonSignature(wadah) {
  wadah.setAttribute("aria-busy", "true");
  wadah.innerHTML = Array.from({ length: JUMLAH_SKELETON_SIGNATURE }, () => `
    <div class="best-card best-skel" aria-hidden="true">
      <div class="best-skel__foto"></div>
      <div class="best-skel__teks"></div>
      <div class="best-skel__teks pendek"></div>
    </div>`).join("");
}

// Tampilkan / sembunyikan seluruh bagian Menu Pilihan (judul + kotak hijau)
function aturBagianSignature(tampil) {
  document.querySelector(".best-header-wrapper")?.toggleAttribute("hidden", !tampil);
  document.querySelector("section.best")?.toggleAttribute("hidden", !tampil);
}

async function tampilkanSignature() {
  const wadah = document.getElementById("best-list");
  if (!wadah) return;

  // Skeleton kartu tidak ditampilkan di awal (skeleton halaman muncul sendiri bila pemuatan lambat).
  wadah.setAttribute("aria-busy", "true");

  // Hanya menu berlabel "signature". API sudah membatasi jumlahnya (maksimal 4) dan mengurutkannya.
  const menu = await ambil("/menu?label=signature");

  // Gagal: HANYA bagian Menu Pilihan yang terdampak. Skeleton tampil di bagian ini
  // + notifikasi merah "Gagal Memuat Menu Pilihan". Bagian beranda lain tetap normal.
  if (!Array.isArray(menu)) {
    aturBagianSignature(true);
    skeletonSignature(wadah);
    wadah.setAttribute("aria-busy", "false");
    antrianBanner.push("Gagal Memuat Menu Pilihan");
    return;
  }

  // Tidak ada menu pilihan: seluruh bagian Menu Pilihan disembunyikan
  if (menu.length === 0) {
    aturBagianSignature(false);
    wadah.innerHTML = "";
    wadah.setAttribute("aria-busy", "false");
    return;
  }

  aturBagianSignature(true);

  // Klik kartu -> halaman menu dengan kategori menu tersebut langsung aktif
  wadah.innerHTML = menu.map(m => {
    const tujuan = m.category_id != null
      ? `menu.html?kategori=${encodeURIComponent(m.category_id)}`
      : "menu.html";
    const nama = m.nama || "";
    return `
    <a class="best-card" href="${tujuan}" title="${esc(nama)}">
      <img src="${esc(cariGambar(m) || PLACEHOLDER_FOTO)}" alt="${esc(nama || "Menu")}" loading="lazy">
      <h3><span>${esc(nama)}</span></h3>
      <small>${rupiahSingkat(m.harga)}</small>
    </a>`;
  }).join("");
  wadah.setAttribute("aria-busy", "false");
}

/* =======================================================
   JALANKAN SEMUA (SKELETON PENUH AWAL / RELOAD)
======================================================= */
function perluSkeletonPenuh() {
  const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  const tipe = nav ? nav.type : "navigate";

  let sudahBuka = false;
  try {
    sudahBuka = Boolean(sessionStorage.getItem("acala-sudah-buka"));
    sessionStorage.setItem("acala-sudah-buka", "1");
  } catch (err) {}

  const namaFile = location.pathname.split("/").pop();
  const alamatBeranda = namaFile === "" || /^index(\.html?|\.php)?$/i.test(namaFile);
  if (!alamatBeranda || !document.getElementById("hero-slider")) return false;

  if (tipe === "back_forward") return false;
  if (tipe === "reload") return true;

  try {
    if (document.referrer && new URL(document.referrer).origin === location.origin) {
      return false;
    }
  } catch (err) {}

  return !sudahBuka;
}

async function mulaiBeranda() {
  const body = document.body;
  // Skeleton halaman penuh (navbar + isi + footer) hanya tampil bila data lambat dimuat
  // (lihat js/skeleton.js). Elemennya sudah ada di index.html.
  const penuh = Boolean(document.getElementById("skel-halaman"));

  if (penuh) {
    body.classList.add("memuat-awal");
    if (window.AcalaSkeleton) AcalaSkeleton.tampil();
  }

  await Promise.allSettled([
    tampilkanBeranda(),
    tampilkanHero(),
    tampilkanSignature()
  ]);

  if (!penuh) { tampilkanAntrianBanner(); return; }

  // Gagal memuat: skeleton tetap tampil, pesan + "Muat ulang" di atasnya
  if (gagalMuat && window.AcalaSkeleton) {
    AcalaSkeleton.gagal("Gagal memuat Beranda", () => location.reload());
    return;
  }

  if (window.AcalaSkeleton) AcalaSkeleton.sembunyi(); else body.classList.remove("skel-aktif");
  body.classList.remove("memuat-awal");
  body.classList.add("beranda-siap");
  tampilkanAntrianBanner();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mulaiBeranda);
} else {
  mulaiBeranda();
}