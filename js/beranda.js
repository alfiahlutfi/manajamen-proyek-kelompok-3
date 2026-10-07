/* =======================================================
   FORMAT RUPIAH
======================================================= */

function rupiahSingkat(n) {
  return Math.round(Number(n || 0) / 1000) + "K";
}


/* =======================================================
   FORMAT JAM
======================================================= */

function formatJam(jam) {
  if (!jam) {
    return "";
  }

  const parts = String(jam).split(":");

  if (parts.length < 2) {
    return jam;
  }

  let hour = parseInt(parts[0], 10);
  const minute = parts[1];

  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${suffix}`;
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


  if (cafeHours.length === 0) {

    openHours.innerHTML = `
      <p>Jam operasional belum tersedia.</p>
    `;

    return;
  }


  /* =====================================================
     TAMPILKAN JAM
  ===================================================== */

  openHours.innerHTML =
    cafeHours.map(j => {

      if (
        Number(j.is_closed) === 1
      ) {

        return `
          <div>
            <h3>${esc(j.hari)}</h3>
            <p>Tutup</p>
          </div>
        `;
      }


      return `
        <div>
          <h3>${esc(j.hari)}</h3>

          <p>
            ${esc(
              formatJam(j.jam_buka)
            )}
            -
            ${esc(
              formatJam(j.jam_tutup)
            )}
          </p>
        </div>
      `;

    }).join("");
}


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
     AUTOPLAY
  ===================================================== */

  function mulai() {

    if (
      n < 2 ||
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {

      return;
    }


    clearInterval(timer);


    timer =
      setInterval(() => {

        i =
          (i + 1) % n;

        render();

      }, 5000);
  }


  /* =====================================================
     KLIK SLIDE
  ===================================================== */

  slider.addEventListener(
    "click",
    e => {

      const s =
        e.target.closest(
          ".slide"
        );


      if (!s) {
        return;
      }


      i =
        Number(
          s.dataset.idx
        );


      render();

      mulai();
    }
  );


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