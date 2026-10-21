

/* =======================================================
   PENGATURAN
======================================================= */
const PLACEHOLDER_FOTO = "assets/placeholder.png"; // Placeholder gambar
const SKELETON_GAMBAR  = "assets/Skeleton.svg";        // Gambar skeleton halaman penuh
const MIN_SKELETON     = 1500;  // Skeleton minimal tampil (ms)
const BATAS_WAKTU      = 8000;  // Batas tunggu per data / foto / peta (ms)

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
function isiTeks(el, nilai) {
  if (!el) return true;
  const teks = String(nilai || "").trim();
  el.textContent = teks;
  el.classList.toggle("skel-teks", !teks);
  return Boolean(teks);
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
function buatSkeleton() {
  const el = document.createElement("div");
  el.id = "skeleton-beranda";
  el.setAttribute("role", "status");
  el.setAttribute("aria-busy", "true");
  el.setAttribute("aria-label", "Memuat halaman");

  const img = document.createElement("img");
  img.src = SKELETON_GAMBAR;
  img.alt = "";
  img.decoding = "async";
  el.appendChild(img);
  return el;
}

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

await pasangFoto(
    document.querySelector(".foto-wrap.kiri"),
    c.gambar_about || c.foto || "",
    "Tampak depan " + nama
  );

  // Ubah baris ini menjadi false supaya kodenya menganggap teks gagal/kosong
  const teksAboutOk = false; 

  // Pesan khusus jika data kafe gagal/kosong
  tampilPesan(
    deskripsi,
    "profil",
    "Gagal mengambil data cafe" // <--- Paksa teks pesannya tampil di sini
  );

  // ----- RESERVASI -----
  const judulReservasi     = document.getElementById("judul-reservasi");
  const deskripsiReservasi = document.getElementById("deskripsi-reservasi");

  await pasangFoto(
    document.querySelector(".foto-wrap.kanan"),
    reservasi.foto || c.gambar_reservasi || "",
    "Area indoor " + nama
  );

  const teksReservasiOk = [
    isiTeks(judulReservasi, reservasi.judul || c.judul_reservasi),
    isiTeks(deskripsiReservasi, reservasi.deskripsi || c.deskripsi_reservasi)
  ].every(Boolean);

  // Pesan khusus jika data reservasi gagal/kosong
  tampilPesan(
    deskripsiReservasi,
    "reservasi",
    !reservasiData || !teksReservasiOk ? "Gagal memuat data reservasi" : ""
  );

  // ----- FOOTER -----
  if (cafe) {
    const footerWhatsapp = document.getElementById("footer-whatsapp");
    if (footerWhatsapp && cafe.whatsapp) {
      footerWhatsapp.textContent = cafe.whatsapp;
      footerWhatsapp.href = "https://wa.me/" + cafe.whatsapp.replace(/\D/g, "");
      footerWhatsapp.target = "_blank";
      footerWhatsapp.rel = "noopener noreferrer";
    }
    const footerEmail = document.getElementById("footer-email");
    if (footerEmail && cafe.email) {
      footerEmail.textContent = cafe.email;
      footerEmail.href = "mailto:" + cafe.email;
    }
    const footerInstagram = document.getElementById("footer-instagram");
    if (footerInstagram && cafe.instagram) {
      footerInstagram.href = cafe.instagram;
      footerInstagram.target = "_blank";
      footerInstagram.rel = "noopener noreferrer";
    }
    const footerTiktok = document.getElementById("footer-tiktok");
    if (footerTiktok && cafe.tiktok) {
      footerTiktok.href = cafe.tiktok;
      footerTiktok.target = "_blank";
      footerTiktok.rel = "noopener noreferrer";
    }
  }

  // ----- JAM OPERASIONAL -----
 // ----- JAM OPERASIONAL -----
  const openHours = document.getElementById("open-hours");
  if (!openHours) return;

  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    openHours.innerHTML = `<p>Jam operasional gagal dimuat.</p>`;
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

  if (cafeHours.length === 0) {
    openHours.innerHTML = `<p>Jam operasional belum tersedia.</p>`;
    return;
  }

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

  // Alamat & pesan "Gagal memuat lokasi cafe"
  const alamatOk = isiTeks(alamat, l.alamat);
  tampilPesan(
    alamat,
    "lokasi",
    !lokasi || !alamatOk ? "Gagal memuat lokasi cafe" : ""
  );

  // Tombol Google Maps
  const linkMaps = String(l.link_maps || "").trim();
  const linkOk = urlGoogleMaps(linkMaps);

  if (btnMaps) {
    if (linkOk) {
      btnMaps.href = linkMaps;
      btnMaps.target = "_blank";
      btnMaps.rel = "noopener noreferrer";
    } else {
      btnMaps.href = "#";
      btnMaps.removeAttribute("target");
    }

    btnMaps.onclick = (e) => {
      if (!linkOk) {
        e.preventDefault();
        tampilPesan(btnMaps, "maps", "Gagal membuka Google Maps");
      }
    };
  }

  // Peta embed & pesan "Gagal membuka Google Maps"
  const mapUrl = ambilUrlEmbed(l.link_maps_embed || l.maps_embed_url || l.peta_embed || "");
  const petaOk = await pasangPeta(peta && peta.parentElement, peta, mapUrl);

  if (lokasi && !petaOk) {
    tampilPesan(btnMaps || alamat, "maps", "Gagal membuka Google Maps");
  }
}

/* =======================================================
   HERO CAROUSEL
======================================================= */
async function tampilkanHero() {
  const carousel = await ambil("/carousel");

  const judul = document.getElementById("hero-judul");
  const slider = document.getElementById("hero-slider");
  const bg = document.getElementById("hero-bg");
  const btn = document.getElementById("hero-btn");

  if (!judul || !slider || !bg || !btn) return;

  if (!carousel || carousel.length === 0) {
    judul.textContent = "Café Ácala";
    slider.innerHTML = "";
    bg.style.backgroundImage = "";
    btn.href = "#";
    return;
  }

  const n = carousel.length;
  let i = 0;
  let timer;

  function render() {
    const item = carousel[i];
    judul.textContent = item.nama || "Café Ácala";
    btn.href = item.id_event ? "event.html?id=" + encodeURIComponent(item.id_event) : "#";

    const gambarItem = cariGambar(item);
    bg.style.backgroundImage = gambarItem ? `url("${gambarItem}")` : "";

    const posisi = n === 1
      ? [["tengah", i]]
      : [["kiri", (i - 1 + n) % n], ["tengah", i], ["kanan", (i + 1) % n]];

    slider.innerHTML = posisi.map(([kelas, idx]) => {
      const data = carousel[idx];
      return `
        <button class="slide ${kelas}" data-idx="${idx}" aria-label="${esc(data.nama || "Event")}">
          <img src="${esc(cariGambar(data) || PLACEHOLDER_FOTO)}" alt="${esc(data.nama || "Event")}">
        </button>
      `;
    }).join("");
  }

  const DURASI = 2000;
  const kurangiGerak = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pindah(ke) {
    i = (ke + n) % n;
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
async function tampilkanSignature() {
  const menu = await ambil("/menu?label=signature");
  const wadah = document.getElementById("best-list");
  if (!wadah) return;

  if (!Array.isArray(menu)) {
    wadah.textContent = "Menu gagal dimuat.";
    return;
  }

  const best = menu.filter(m => m.label === "signature").slice(0, 4);
  if (best.length === 0) {
    wadah.innerHTML = `<p>Menu signature belum tersedia.</p>`;
    return;
  }

  const sorot = best.length >= 3 ? 2 : 0;
  wadah.innerHTML = best.map((m, k) => `
    <a class="best-card${k === sorot ? " sorot" : ""}" href="menu-detail.html?id=${encodeURIComponent(m.id)}">
      <img src="${esc(cariGambar(m) || PLACEHOLDER_FOTO)}" alt="${esc(m.nama || "Menu")}" loading="lazy">
      <h3>${esc(m.nama || "")}</h3>
      <small>${rupiahSingkat(m.harga)}</small>
    </a>
  `).join("");
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
  const penuh = perluSkeletonPenuh();
  let skeleton = null;
  let disembunyikan = [];

  if (penuh) {
    body.classList.add("memuat-awal");
    disembunyikan = [...body.children].map(el => [el, el.style.display]);
    disembunyikan.forEach(([el]) => { el.style.display = "none"; });
    skeleton = buatSkeleton();
    body.prepend(skeleton);
  } else {
    ["judul-about", "deskripsi", "judul-reservasi", "deskripsi-reservasi", "alamat"]
      .forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.textContent.trim()) el.classList.add("skel-teks");
      });
  }

  await Promise.allSettled([
    tampilkanBeranda(),
    tampilkanHero(),
    tampilkanSignature(),
    penuh ? tunggu(MIN_SKELETON) : Promise.resolve()
  ]);

  if (penuh) {
    disembunyikan.forEach(([el, tampil]) => { el.style.display = tampil; });
    body.classList.remove("memuat-awal");
    body.classList.add("beranda-siap");
    skeleton.remove();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mulaiBeranda);
} else {
  mulaiBeranda();
}
