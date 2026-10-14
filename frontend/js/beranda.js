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

  // Jika nama hari tidak dikenali, tampilkan apa adanya
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

  daftarDenganUrutan.sort(
    (barisPertama, barisKedua) =>
      barisPertama.urutanHari - barisKedua.urutanHari
  );

  const daftarKelompok = [];

  daftarDenganUrutan.forEach(baris => {

    const kelompokTerakhir =
      daftarKelompok[daftarKelompok.length - 1];

    const melanjutkanKelompok =
      kelompokTerakhir &&
      kelompokTerakhir.buka === baris.jam_buka &&
      kelompokTerakhir.tutup === baris.jam_tutup &&
      baris.urutanHari === kelompokTerakhir.urutanAkhir + 1;

    if (melanjutkanKelompok) {
      kelompokTerakhir.urutanAkhir = baris.urutanHari;
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

function urlPeta(cafe) {

  let u =
    String(cafe.maps_embed_url || "").trim();

  /*
   * Jika database menyimpan seluruh tag iframe,
   * ambil URL dari atribut src.
   */
  const m =
    u.match(/src=["']([^"']+)["']/i);

  if (m) {
    u = m[1];
  }

  return u;
}


/* =======================================================
   INFO CAFE
======================================================= */

async function tampilkanBeranda() {

  /* =====================================================
     AMBIL DATA CAFE DARI DATABASE
  ===================================================== */

  const cafeData =
    await fetchData("/cafe");

  if (!cafeData || cafeData.length === 0) {

    console.warn(
      "Data café tidak ditemukan."
    );

    return;
  }

  const cafe =
    cafeData[0];


  /* =====================================================
     ABOUT
  ===================================================== */

  /* GAMBAR ABOUT */

  const gambarAbout =
    document.getElementById("gambar-about");

  if (gambarAbout) {

    gambarAbout.src =
      cafe.gambar_about || "";

    gambarAbout.alt =
      "Tampak depan " +
      (cafe.nama || "Café Ácala");
  }


  /* JUDUL ABOUT */

  const judulAbout =
    document.getElementById("judul-about");

  if (judulAbout) {

    judulAbout.textContent =
      cafe.judul_about || "";
  }


  /* DESKRIPSI ABOUT */

  const deskripsi =
    document.getElementById("deskripsi");

  if (deskripsi) {

    deskripsi.textContent =
      cafe.deskripsi || "";
  }


  /* =====================================================
     RESERVASI
  ===================================================== */

  /* GAMBAR RESERVASI */

  const gambarReservasi =
    document.getElementById("gambar-reservasi");

  if (gambarReservasi) {

    gambarReservasi.src =
      cafe.gambar_reservasi || "";

    gambarReservasi.alt =
      "Area indoor " +
      (cafe.nama || "Café Ácala");
  }


  /* JUDUL RESERVASI */

  const judulReservasi =
    document.getElementById("judul-reservasi");

  if (judulReservasi) {

    judulReservasi.textContent =
      cafe.judul_reservasi || "";
  }


  /* DESKRIPSI RESERVASI */

  const deskripsiReservasi =
    document.getElementById(
      "deskripsi-reservasi"
    );

  if (deskripsiReservasi) {

    deskripsiReservasi.textContent =
      cafe.deskripsi_reservasi || "";
  }


  /* =====================================================
     FOOTER - WHATSAPP
     
     TIDAK MENGUBAH DATA DATABASE
  ===================================================== */

  const footerWhatsapp =
    document.getElementById(
      "footer-whatsapp"
    );

  if (footerWhatsapp && cafe.whatsapp) {

    footerWhatsapp.textContent =
      cafe.whatsapp;

    const nomor =
      cafe.whatsapp.replace(/\D/g, "");

    footerWhatsapp.href =
      "https://wa.me/" + nomor;

    footerWhatsapp.target =
      "_blank";

    footerWhatsapp.rel =
      "noopener noreferrer";
  }


  /* =====================================================
     FOOTER - EMAIL
     
     TIDAK MENGUBAH DATA DATABASE
  ===================================================== */

  const footerEmail =
    document.getElementById(
      "footer-email"
    );

  if (footerEmail && cafe.email) {

    footerEmail.textContent =
      cafe.email;

    footerEmail.href =
      "mailto:" + cafe.email;
  }


  /* =====================================================
     FOOTER - INSTAGRAM
     
     LINK DIAMBIL LANGSUNG DARI DATABASE
  ===================================================== */

  const footerInstagram =
    document.getElementById(
      "footer-instagram"
    );

  if (footerInstagram && cafe.instagram) {

    footerInstagram.href =
      cafe.instagram;

    footerInstagram.target =
      "_blank";

    footerInstagram.rel =
      "noopener noreferrer";
  }


  /* =====================================================
     FOOTER - TIKTOK
     
     LINK DIAMBIL LANGSUNG DARI DATABASE
  ===================================================== */

  const footerTiktok =
    document.getElementById(
      "footer-tiktok"
    );

  if (footerTiktok && cafe.tiktok) {

    footerTiktok.href =
      cafe.tiktok;

    footerTiktok.target =
      "_blank";

    footerTiktok.rel =
      "noopener noreferrer";
  }


  /* =====================================================
     ALAMAT
  ===================================================== */

  const alamat =
    document.getElementById("alamat");

  if (alamat) {

    alamat.textContent =
      cafe.alamat || "";
  }


  /* =====================================================
     GOOGLE MAPS BUTTON
  ===================================================== */

  const btnMaps =
    document.getElementById("btn-maps");

  if (btnMaps) {

    btnMaps.href =
      cafe.link_maps || "#";

    btnMaps.target =
      "_blank";

    btnMaps.rel =
      "noopener noreferrer";
  }


  /* =====================================================
     GOOGLE MAPS EMBED
  ===================================================== */

  const peta =
    document.getElementById("peta");

  if (peta) {

    const mapUrl =
      urlPeta(cafe);

    if (mapUrl) {

      peta.src =
        mapUrl;

    } else {

      peta.removeAttribute("src");
    }
  }


  /* =====================================================
     JAM OPERASIONAL
  ===================================================== */

  const hours =
    await fetchData(
      "/operating-hours"
    );

  const openHours =
    document.getElementById(
      "open-hours"
    );

  if (!openHours) {
    return;
  }


  /* =====================================================
     JIKA DATA JAM KOSONG
  ===================================================== */

  if (!hours || hours.length === 0) {

    openHours.innerHTML = `
      <p>Jam operasional belum tersedia.</p>
    `;

    return;
  }


  /* =====================================================
     FILTER BERDASARKAN CAFE ID
  ===================================================== */

  const cafeHours =
    hours.filter(
      item =>
        String(item.cafe_id) ===
        String(cafe.id)
    );


      openHours.innerHTML = kelompokJam(cafeHours).map(kelompok => `
    <div>
      <h3>${esc(kelompok.label)}</h3>
      <p>${formatJam(kelompok.buka)} - ${formatJam(kelompok.tutup)}</p>
    </div>
  `).join("");

}   // penutup tampilkanBeranda


 



/* =======================================================
   HERO CAROUSEL
======================================================= */

async function tampilkanHero() {

  const carousel =
    await fetchData("/carousel");


  const judul =
    document.getElementById(
      "hero-judul"
    );

  const slider =
    document.getElementById(
      "hero-slider"
    );

  const bg =
    document.getElementById(
      "hero-bg"
    );

  const btn =
    document.getElementById(
      "hero-btn"
    );


  if (
    !judul ||
    !slider ||
    !bg ||
    !btn
  ) {
    return;
  }


  /* =====================================================
     JIKA CAROUSEL KOSONG
  ===================================================== */

  if (
    !carousel ||
    carousel.length === 0
  ) {

    judul.textContent =
      "Café Ácala";

    slider.innerHTML =
      "";

    bg.style.backgroundImage =
      "";

    btn.href =
      "#";

    return;
  }


  const n =
    carousel.length;

  let i = 0;

  let timer;


  /* =====================================================
     RENDER CAROUSEL
  ===================================================== */

  function render() {

    const item =
      carousel[i];


    /* ===================================================
       JUDUL
    =================================================== */

    judul.textContent =
      item.nama ||
      "Café Ácala";


    /* ===================================================
       BUTTON EVENT
    =================================================== */

    if (item.id_event) {

      btn.href =
        "event.html?id=" +
        encodeURIComponent(
          item.id_event
        );

    } else {

      btn.href =
        "#";
    }


    /* ===================================================
       BACKGROUND
    =================================================== */

    if (item.gambar) {

      bg.style.backgroundImage =
        `url("${item.gambar}")`;

    } else {

      bg.style.backgroundImage =
        "";
    }


    /* ===================================================
       POSISI SLIDE
    =================================================== */

    const posisi =
      n === 1
        ? [
            ["tengah", i]
          ]
        : [
            [
              "kiri",
              (i - 1 + n) % n
            ],
            [
              "tengah",
              i
            ],
            [
              "kanan",
              (i + 1) % n
            ]
          ];


    /* ===================================================
       RENDER SLIDE
    =================================================== */

    slider.innerHTML =
      posisi.map(
        ([kelas, idx]) => {

          const data =
            carousel[idx];

          return `
            <button
              class="slide ${kelas}"
              data-idx="${idx}"
              aria-label="${esc(
                data.nama || "Event"
              )}"
            >

              <img
                src="${esc(
                  data.gambar || ""
                )}"
                alt="${esc(
                  data.nama || "Event"
                )}"
              >

            </button>
          `;
        }
      ).join("");
  }



  /* =====================================================
     KONTROL CAROUSEL (autoplay, klik, geser, keyboard)
  ===================================================== */

  const DURASI = 2000; // ms antar slide

  const kurangiGerak =
    window.matchMedia &&
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

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

      timer = setInterval(
        () => pindah(i + 1),
        DURASI
      );
    }
  }

  if (n > 1) {

    /* Klik slide kiri / kanan -> pindah ke slide itu */
    slider.addEventListener(
      "click",
      (e) => {

        const tombol =
          e.target.closest(".slide");

        if (
          !tombol ||
          !slider.contains(tombol) ||
          tombol.classList.contains(
            "tengah"
          )
        ) {
          return;
        }

        pindah(
          Number(tombol.dataset.idx)
        );

        mulai();
      }
    );

    /* Panah kiri / kanan di keyboard saat fokus di carousel */
    slider.addEventListener(
      "keydown",
      (e) => {

        if (e.key === "ArrowLeft") {

          pindah(i - 1);

          mulai();

        } else if (
          e.key === "ArrowRight"
        ) {

          pindah(i + 1);

          mulai();
        }
      }
    );

    /* Geser (swipe) di layar sentuh */
    let awalX = null;

    slider.addEventListener(
      "touchstart",
      (e) => {

        awalX =
          e.touches[0].clientX;

        berhenti();
      },
      { passive: true }
    );

    slider.addEventListener(
      "touchend",
      (e) => {

        if (awalX !== null) {

          const selisih =
            e.changedTouches[0]
              .clientX - awalX;

          if (Math.abs(selisih) > 40) {

            pindah(
              selisih < 0
                ? i + 1
                : i - 1
            );
          }
        }

        awalX = null;

        mulai();
      }
    );

    /* Jeda saat kursor di atas carousel, lanjut saat keluar */
    const hero =
      slider.closest(".hero") ||
      slider;

    hero.addEventListener(
      "mouseenter",
      berhenti
    );

    hero.addEventListener(
      "mouseleave",
      mulai
    );

    /* Jeda saat tab tidak aktif */
    document.addEventListener(
      "visibilitychange",
      () => {

        if (document.hidden) {

          berhenti();

        } else {

          mulai();
        }
      }
    );
  }


  /* =====================================================
     START
  ===================================================== */

  render();

  mulai();
}


/* =======================================================
   BEST SELLER
======================================================= */

async function tampilkanBest() {

  const menu =
    await fetchData("/menu");


  const wadah =
    document.getElementById(
      "best-list"
    );


  if (!wadah) {
    return;
  }


  if (!menu) {

    wadah.textContent =
      "Menu gagal dimuat.";

    return;
  }


  /* =====================================================
     FILTER BEST SELLER
  ===================================================== */

  const best =
    menu
      .filter(
        m =>
          m.label ===
          "best_seller"
      )
      .sort(
        (a, b) =>
          Number(a.urutan) -
          Number(b.urutan)
      )
      .slice(0, 4);


  if (best.length === 0) {

    wadah.innerHTML = `
      <p>
        Menu best seller belum tersedia.
      </p>
    `;

    return;
  }


  /* =====================================================
     KARTU YANG DISOROT
  ===================================================== */

  const sorot =
    best.length >= 3
      ? 2
      : 0;


  /* =====================================================
     RENDER MENU
  ===================================================== */

  wadah.innerHTML =
    best.map(
      (m, k) => {

        return `
          <a
            class="best-card${
              k === sorot
                ? " sorot"
                : ""
            }"
            href="menu-detail.html?id=${
              encodeURIComponent(m.id)
            }"
          >

            <img
              src="${esc(
                m.gambar || ""
              )}"
              alt="${esc(
                m.nama || "Menu"
              )}"
              loading="lazy"
            >

            <h3>
              ${esc(
                m.nama || ""
              )}
            </h3>

            <small>
              ${rupiahSingkat(
                m.harga
              )}
            </small>

          </a>
        `;
      }
    ).join("");
}


/* =======================================================
   JALANKAN SEMUA
======================================================= */

tampilkanBeranda();

tampilkanHero();

tampilkanBest();