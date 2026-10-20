
// ===== KODE UJI: hapus setelah selesai =====
//const UJI_GAGAL = ["/cafe"];
//const _fetchAsli = fetchData;
//const _sudahGagal = {};
//fetchData = async (url) => {
 // if (UJI_GAGAL.includes(url) && !_sudahGagal[url]) {
    //_sudahGagal[url] = true;
    //return null;
 // }
  //return _fetchAsli(url);
//};


/* =======================================================
   ESCAPE HTML (Mencegah XSS)
======================================================= */
function esc(string) {
  return String(string || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =======================================================
   NOTIFIKASI KILAT (TOAST NOTIFICATION)
======================================================= */
function tampilkanToast(pesan) {
  document.getElementById("toast-notif")?.remove();

  const toast = document.createElement("div");
  toast.id = "toast-notif";
  toast.textContent = pesan;
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #2D5F2E;
    color: #FFE77B;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: var(--font, sans-serif);
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    z-index: 9999;
    transition: opacity 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* =======================================================
   AMBIL DATA
======================================================= */
async function ambil(url) {
  return await fetchData(url);
}

/* =======================================================
   PLACEHOLDER SKELETON
======================================================= */
function skeletonHero(slider) {
  slider.innerHTML = `
    <div class="skel" style="flex:1 1 0;aspect-ratio:4/3"></div>
    <div class="skel" style="flex:1.6 1 0;aspect-ratio:4/3"></div>
    <div class="skel" style="flex:1 1 0;aspect-ratio:4/3"></div>
  `;
}

function skeletonJam(wadah) {
  wadah.innerHTML = Array.from({ length: 3 }, () => `
    <div style="min-width:160px">
      <div class="skel" style="height:26px;margin-bottom:10px"></div>
      <div class="skel" style="height:20px"></div>
    </div>
  `).join("");
}

function skeletonBest(wadah, jumlah = 4) {
  wadah.innerHTML = Array.from({ length: jumlah }, (_, k) => {
    const sorot = jumlah >= 3 && k === 2;
    return `<div class="skel" style="flex:${sorot ? 1.6 : 1} 1 0;max-width:${sorot ? 290 : 190}px;height:${sorot ? 340 : 240}px"></div>`;
  }).join("");
}

const ID_TEKS_CAFE = ["judul-about", "deskripsi", "judul-reservasi", "deskripsi-reservasi"];

function skeletonTeksCafe(aktif) {
  ID_TEKS_CAFE.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("skel-teks", aktif);
  });

  // Foto About (kiri) dan Reservasi (kanan) ikut jadi placeholder skeleton saat memuat
  document.querySelectorAll(".foto-wrap.kiri, .foto-wrap.kanan").forEach(fig => {
    fig.classList.toggle("memuat", aktif);
    fig.querySelector(".media-state")?.remove();
    if (aktif) {
      const img = fig.querySelector("img");
      if (img) img.removeAttribute("src");
    }
  });
}


/* =======================================================
   STATUS FOTO (Placeholder / Loading State)
======================================================= */
function pasangFoto(figure, src, alt, paksaPlaceholder = false) {
  if (!figure) return;

  const img = figure.querySelector("img");
  if (!img) return;

  img.alt = alt || "";

  // Hapus state placeholder lama jika ada
  figure.querySelector(".media-state")?.remove();

  // Cek apakah path foto kosong/null di database
  const kosong = !src || (typeof src === "string" && /^\s*(null|undefined)?\s*$/i.test(src));

  // Jika dipaksa placeholder ATAU fotonya memang kosong/tidak ada di database
  if (paksaPlaceholder || kosong) {
    figure.classList.remove("memuat");
    
    // Arahkan ke file gambar placeholder Anda (sesuaikan path foldernya jika perlu)
    img.src = "assets/placeholder.png"; 
    img.style.objectFit = "cover";
    img.style.padding = "0";
    img.style.background = "#e5e7eb";

    if (kosong) {
      figure.classList.add("tanpa-foto");
    }
    return;
  }

  img.style.objectFit = "";
  img.style.padding = "";
  img.style.background = "";
  figure.classList.remove("memuat", "tanpa-foto");

  // Memuat foto asli menggunakan Acala.media
  Acala.media(img, src);
}
/* =======================================================
   FORMAT RUPIAH
======================================================= */
function rupiahSingkat(n) {
  return Math.round(Number(n || 0) / 1000) + "K";
}

/* =======================================================
   FORMAT JAM
======================================================= */
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

/* =======================================================
   KELOMPOK HARI
======================================================= */
const NAMA_HARI = [
  ["Monday", "senin"],
  ["Tuesday", "selasa"],
  ["Wednesday", "rabu"],
  ["Thursday", "kamis"],
  ["Friday", "jumat"],
  ["Saturday", "sabtu"],
  ["Sunday", "minggu"]
];

function indexHari(namaHari) {
  const namaBersih = String(namaHari || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  return NAMA_HARI.findIndex(
    ([namaInggris, namaIndonesia]) =>
      namaBersih === namaInggris.toLowerCase() ||
      namaBersih === namaIndonesia
  );
}

function kelompokJam(daftarJam) {
  const daftarDenganUrutan = daftarJam.map(baris => ({
    ...baris,
    urutanHari: indexHari(baris.hari)
  }));

  const adaHariTidakDikenali = daftarDenganUrutan.some(
    baris => baris.urutanHari < 0
  );

  if (adaHariTidakDikenali) {
    return daftarJam.map(baris => ({
      label: baris.hari || "",
      buka: baris.jam_buka,
      tutup: baris.jam_tutup
    }));
  }

  daftarDenganUrutan.sort((a, b) => a.urutanHari - b.urutanHari);

  const daftarKelompok = [];

  daftarDenganUrutan.forEach(baris => {
    const terakhir = daftarKelompok[daftarKelompok.length - 1];

    const melanjutkan =
      terakhir &&
      terakhir.buka === baris.jam_buka &&
      terakhir.tutup === baris.jam_tutup &&
      baris.urutanHari === terakhir.urutanAkhir + 1;

    if (melanjutkan) {
      terakhir.urutanAkhir = baris.urutanHari;
    } else {
      daftarKelompok.push({
        urutanAwal: baris.urutanHari,
        urutanAkhir: baris.urutanHari,
        buka: baris.jam_buka,
        tutup: baris.jam_tutup
      });
    }
  });

  return daftarKelompok.map(kelompok => {
    const hariAwal = NAMA_HARI[kelompok.urutanAwal][0];
    const hariAkhir = NAMA_HARI[kelompok.urutanAkhir][0];

    return {
      label:
        kelompok.urutanAwal === kelompok.urutanAkhir
          ? hariAwal
          : hariAwal + " - " + hariAkhir,
      buka: kelompok.buka,
      tutup: kelompok.tutup
    };
  });
}

/* =======================================================
   GOOGLE MAPS
======================================================= */
function ambilUrlEmbed(teks) {
  const raw = String(teks || "").trim();
  const m = raw.match(/src=["']([^"']+)["']/i);
  return (m ? m[1] : raw).trim();
}


/* =======================================================
   INFO CAFE (About, Reservasi, Footer)
======================================================= */
let cafeTerakhir = null;

async function tampilkanBeranda() {
  const bagian = document.querySelector(".tembok");
  if (bagian) bagian.hidden = false;

  const openHours = document.getElementById("open-hours");
  if (openHours) skeletonJam(openHours);

  // Tampilkan skeleton saat pertama kali memuat data
  skeletonTeksCafe(true);

  let cafe = null;
  let reservasi = null;

  try {
    const [cafeRes, reservasiRes] = await Promise.allSettled([
      ambil("/cafe"),
      ambil("/reservasi")
    ]);

    cafe = cafeRes.status === "fulfilled" ? (Array.isArray(cafeRes.value) ? cafeRes.value[0] : cafeRes.value) : null;
    
    // Ambil data reservasi dengan aman apakah berbentuk array atau objek tunggal
    const rawReservasi = reservasiRes.status === "fulfilled" ? reservasiRes.value : null;
    reservasi = Array.isArray(rawReservasi) ? rawReservasi[0] : rawReservasi;
  } catch (error) {
    console.error("Gagal mengambil data beranda:", error);
  }

  // Anggap gagal jika kosong atau error
  if (!cafe || typeof cafe !== "object" || Object.keys(cafe).length === 0) {
    cafe = null;
  }

  // Hilangkan skeleton teks
  skeletonTeksCafe(false);

  // === JIKA DATA CAFE GAGAL DIAMBIL ===
  if (!cafe) {
    cafeTerakhir = null;

    const judulAbout = document.getElementById("judul-about");
    if (judulAbout) judulAbout.textContent = "";
    const deskripsi = document.getElementById("deskripsi");
    if (deskripsi) deskripsi.textContent = "";

    const judulReservasi = document.getElementById("judul-reservasi");
    if (judulReservasi) judulReservasi.textContent = "";
    const deskripsiReservasi = document.getElementById("deskripsi-reservasi");
    if (deskripsiReservasi) deskripsiReservasi.textContent = "";

    pasangFoto(document.querySelector(".foto-wrap.kiri"), null, "", true);
    pasangFoto(document.querySelector(".foto-wrap.kanan"), null, "", true);

    tampilkanToast("Gagal mengambil data cafe");
    await tampilkanJam(null);
    return;
  }

  // === JIKA DATA CAFE BERHASIL DIAMBIL ===
  cafeTerakhir = cafe;

  // ABOUT
  const srcAbout = cafe.gambar_about || cafe.foto || "";
  pasangFoto(
    document.querySelector(".foto-wrap.kiri"),
    srcAbout,
    "Tampak depan Café Ácala"
  );

  const judulAbout = document.getElementById("judul-about");
  if (judulAbout) {
    judulAbout.textContent = cafe.judul_about || cafe.judul_deskripsi || "";
  }

  const deskripsi = document.getElementById("deskripsi");
  if (deskripsi) {
    deskripsi.textContent = cafe.deskripsi || "";
  }

  // RESERVASI (Mendukung key dari backend: foto, judul, deskripsi maupun variasinya)
  const srcReservasi = reservasi ? (reservasi.foto || reservasi.foto_reservasi || "") : "";
  pasangFoto(
    document.querySelector(".foto-wrap.kanan"),
    srcReservasi,
    "Area indoor " + (cafe.nama || "Café Ácala")
  );

  const judulReservasi = document.getElementById("judul-reservasi");
  if (judulReservasi) {
    judulReservasi.textContent = reservasi ? (reservasi.judul || reservasi.judul_reservasi || "") : "";
  }

  const deskripsiReservasi = document.getElementById("deskripsi-reservasi");
  if (deskripsiReservasi) {
    deskripsiReservasi.textContent = reservasi ? (reservasi.deskripsi || reservasi.deskripsi_reservasi || "") : "";
  }

  // FOOTER WHATSAPP
  const footerWhatsapp = document.getElementById("footer-whatsapp");
  if (footerWhatsapp && cafe.whatsapp) {
    footerWhatsapp.textContent = cafe.whatsapp;
    const nomor = String(cafe.whatsapp).replace(/\D/g, "");
    footerWhatsapp.href = "https://wa.me/" + nomor;
    footerWhatsapp.target = "_blank";
    footerWhatsapp.rel = "noopener noreferrer";
  }

  // FOOTER EMAIL
  const footerEmail = document.getElementById("footer-email");
  if (footerEmail && cafe.email) {
    footerEmail.textContent = cafe.email;
    footerEmail.href = "mailto:" + cafe.email;
  }

  // FOOTER INSTAGRAM
  const footerInstagram = document.getElementById("footer-instagram");
  if (footerInstagram && cafe.instagram) {
    footerInstagram.href = cafe.instagram;
    footerInstagram.target = "_blank";
    footerInstagram.rel = "noopener noreferrer";
  }

  // FOOTER TIKTOK
  const footerTiktok = document.getElementById("footer-tiktok");
  if (footerTiktok && cafe.tiktok) {
    footerTiktok.href = cafe.tiktok;
    footerTiktok.target = "_blank";
    footerTiktok.rel = "noopener noreferrer";
  }

  await tampilkanJam(cafe);
}

/* =======================================================
   JAM OPERASIONAL
======================================================= */
async function tampilkanJam(cafe) {
  const openHours = document.getElementById("open-hours");
  if (!openHours) return;

  cafe = cafe || cafeTerakhir;

  skeletonJam(openHours);
  const hours = await ambil("/operating-hours");

  if (!hours) {
    openHours.innerHTML = `<p>Jam operasional belum tersedia.</p>`;
    return;
  }

  const idCafe = cafe ? cafe.id : (hours[0] && hours[0].cafe_id);
  const cafeHours = idCafe == null
    ? hours
    : hours.filter(item => String(item.cafe_id) === String(idCafe));

  if (cafeHours.length === 0) {
    openHours.innerHTML = `<p>Jam operasional belum tersedia.</p>`;
    return;
  }

  openHours.innerHTML = kelompokJam(cafeHours).map(kelompok => `
    <div>
      <h3>${esc(kelompok.label)}</h3>
      <p>${esc(formatJam(kelompok.buka))} - ${esc(formatJam(kelompok.tutup))}</p>
    </div>
  `).join("");
}

/* =======================================================
   HERO CAROUSEL
======================================================= */
const hero = {
  data: [],
  n: 0,
  i: 0,
  timer: null,
  terpasang: false
};

function heroBerhenti() {
  clearInterval(hero.timer);
  hero.timer = null;
}

function heroMulai() {
  heroBerhenti();
  const kurangiGerak =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (hero.n > 1 && !kurangiGerak) {
    hero.timer = setInterval(() => heroPindah(hero.i + 1), 2000);
  }
}

function heroPindah(ke) {
  if (hero.n === 0) return;
  hero.i = (ke + hero.n) % hero.n;
  heroRender();
}

function heroRender() {
  const judul = document.getElementById("hero-judul");
  const slider = document.getElementById("hero-slider");
  const bg = document.getElementById("hero-bg");
  const btn = document.getElementById("hero-btn");
  if (!judul || !slider || !bg || !btn) return;

  const { data, n, i } = hero;
  const item = data[i];

  judul.textContent = item.nama || "Café Ácala";
  btn.hidden = false;
  btn.href = item.id
    ? "event.html?id=" + encodeURIComponent(item.id)
    : "#";

  bg.style.backgroundImage = item.foto
    ? `url("${String(item.foto).replace(/"/g, "%22")}")`
    : "";

  const posisi = n === 1
    ? [["tengah", i]]
    : [["kiri", (i - 1 + n) % n], ["tengah", i], ["kanan", (i + 1) % n]];

  slider.innerHTML = posisi.map(([kelas, idx]) => {
    const d = data[idx];
    return `
      <button
        class="slide ${kelas}"
        data-idx="${idx}"
        aria-label="${esc(d.nama || "Event")}"
      >
        <img src="${esc(d.foto || "")}" alt="${esc(d.nama || "Event")}">
      </button>
    `;
  }).join("");
}

function heroPasangEvent(slider) {
  if (hero.terpasang) return;
  hero.terpasang = true;

  slider.addEventListener("click", (e) => {
    const tombol = e.target.closest(".slide");
    if (!tombol || !slider.contains(tombol) || tombol.classList.contains("tengah")) {
      return;
    }
    heroPindah(Number(tombol.dataset.idx));
    heroMulai();
  });

  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      heroPindah(hero.i - 1);
      heroMulai();
    } else if (e.key === "ArrowRight") {
      heroPindah(hero.i + 1);
      heroMulai();
    }
  });

  let awalX = null;
  slider.addEventListener("touchstart", (e) => {
    awalX = e.touches[0].clientX;
    heroBerhenti();
  }, { passive: true });

  slider.addEventListener("touchend", (e) => {
    if (awalX !== null) {
      const selisih = e.changedTouches[0].clientX - awalX;
      if (Math.abs(selisih) > 40) {
        heroPindah(selisih < 0 ? hero.i + 1 : hero.i - 1);
      }
    }
    awalX = null;
    heroMulai();
  });

  const area = slider.closest(".hero") || slider;
  area.addEventListener("mouseenter", heroBerhenti);
  area.addEventListener("mouseleave", heroMulai);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      heroBerhenti();
    } else {
      heroMulai();
    }
  });
}

async function tampilkanHero() {
  const judul = document.getElementById("hero-judul");
  const slider = document.getElementById("hero-slider");
  const bg = document.getElementById("hero-bg");
  const btn = document.getElementById("hero-btn");

  if (!judul || !slider || !bg || !btn) return;

  heroBerhenti();
  skeletonHero(slider);

  const carousel = await ambil("/carousel");

  if (!carousel) {
    hero.data = [];
    hero.n = 0;
    judul.textContent = "Café Ácala";
    bg.style.backgroundImage = "";
    btn.hidden = true;
    slider.innerHTML = `<p style="color:#fff;">Event belum tersedia</p>`;
    return;
  }

  if (carousel.length === 0) {
    hero.data = [];
    hero.n = 0;
    judul.textContent = "Café Ácala";
    slider.innerHTML = "";
    bg.style.backgroundImage = "";
    btn.hidden = false;
    btn.href = "#";
    return;
  }

  hero.data = carousel;
  hero.n = carousel.length;
  hero.i = 0;

  if (hero.n > 1) heroPasangEvent(slider);

  heroRender();
  heroMulai();
}

/* =======================================================
   SIGNATURE
======================================================= */
async function tampilkanBest() {
  const wadah = document.getElementById("best-list");
  if (!wadah) return;

  skeletonBest(wadah);

  const menu = await ambil("/menu");

  if (!menu) {
    wadah.innerHTML = `<p>Menu best seller belum tersedia.</p>`;
    return;
  }

  const best = menu
    .filter(m => m.label === "signature")
    .sort((a, b) => Number(a.urutan) - Number(b.urutan))
    .slice(0, 4);

  if (best.length === 0) {
    wadah.innerHTML = `<p>Menu best seller belum tersedia.</p>`;
    return;
  }

  const sorot = best.length >= 3 ? 2 : 0;

  wadah.innerHTML = best.map((m, k) => `
    <a
      class="best-card${k === sorot ? " sorot" : ""}"
      href="menu-detail.html?id=${encodeURIComponent(m.id)}"
    >
      <img src="${esc(m.foto || "")}" alt="${esc(m.nama || "Menu")}" loading="lazy">
      <h3>${esc(m.nama || "")}</h3>
      <small>${esc(rupiahSingkat(m.harga))}</small>
    </a>
  `).join("");
}

/* =======================================================
   LOKASI
======================================================= */
async function isiLokasi() {
  const kontainer = document.querySelector(".lokasi-container");
  if (kontainer) kontainer.hidden = false;

  const alamat = document.getElementById("alamat");
  if (alamat) alamat.classList.add("skel-teks");

  let lokasi = null;

  try {
    const lokasiData = await ambil("/lokasi");
    lokasi = Array.isArray(lokasiData) ? lokasiData[0] : lokasiData;
  } catch (error) {
    console.error("Terjadi error di isiLokasi:", error);
  }

  if (alamat) alamat.classList.remove("skel-teks");

  if (!lokasi) {
    if (alamat) alamat.textContent = "Alamat belum tersedia.";
    return;
  }

  if (alamat) {
    alamat.textContent = lokasi.alamat || "Alamat belum tersedia";
  }

  const btnMaps = document.getElementById("btn-maps");
  if (btnMaps) {
    const linkMaps = String(lokasi.link_maps || "").trim();
    btnMaps.className = "btn-maps";
    btnMaps.textContent = "Maps";
    btnMaps.onclick = null;

    if (!linkMaps || linkMaps === "#") {
      btnMaps.classList.add("btn-maps-gagal");
      btnMaps.removeAttribute("href");
      btnMaps.setAttribute("aria-disabled", "true");
      btnMaps.innerHTML = `<span class="maps-error-text">Link Google Maps belum tersedia</span>`;
    } else {
      btnMaps.removeAttribute("aria-disabled");
      btnMaps.href = linkMaps;
      btnMaps.target = "_blank";
      btnMaps.rel = "noopener noreferrer";
    }
  }

  const peta = document.getElementById("peta");
  if (peta) {
    const rawMap = lokasi.link_maps_embed || lokasi.maps_embed_url || lokasi.peta_embed || "";

    Acala.media(peta, async () => {
      const mapUrl = ambilUrlEmbed(rawMap);
      if (!mapUrl) {
        throw new Error("Gagal memuat peta");
      }
      return mapUrl;
    });
  }
}

/* =======================================================
   JALANKAN SEMUA
======================================================= */
Promise.allSettled([
  window.layoutSiap,
  tampilkanBeranda(),
  tampilkanHero(),
  tampilkanBest(),
  isiLokasi()
]).finally(() => {
  if (typeof selesaiMemuat === "function") {
    selesaiMemuat();
  }
});