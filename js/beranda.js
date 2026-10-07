function rupiahSingkat(n) { return Math.round(n / 1000) + "K"; }

/* ---------- peta Google Maps ---------- */
// Urutan: (1) map_embed_url yang valid, (2) peta otomatis dari alamat.
function urlPeta(cafe) {
  let u = String(cafe.map_embed_url || "").trim();

  // kalau yang ditempel seluruh tag <iframe ...>, ambil isi src-nya saja
  const m = u.match(/src=["']([^"']+)["']/i);
  if (m) u = m[1];

  if (u.startsWith("https://www.google.com/maps/embed")) return u;

  // fallback: embed berdasarkan alamat (tanpa API key)
  return "https://maps.google.com/maps?q=" + encodeURIComponent(cafe.alamat || cafe.nama) + "&t=k&z=16&output=embed";
}

/* ---------- info café ---------- */
async function tampilkanBeranda() {

  /* ---------- data café ---------- */

  const cafeData = await fetchData("/cafe");

  if (!cafeData || cafeData.length === 0) {
    console.warn("Data café tidak ditemukan.");
    return;
  }

  // API cafe.php mengembalikan array
  const cafe = cafeData[0];


  /* =======================================================
     NAMA CAFÉ — PNG
  ======================================================= */

  const namaCafe =
    document.getElementById("nama-cafe");

  if (namaCafe) {
    namaCafe.src = cafe.nama || "";
    namaCafe.alt = "Acala Coffee & Eatery";
  }


  /* =======================================================
     LOGO CAFÉ — PNG
  ======================================================= */

  const logoCafe =
    document.getElementById("logo-cafe");

  if (logoCafe) {
    logoCafe.src = cafe.logo || "";
    logoCafe.alt = "Acala Coffee & Eatery";
  }


  /* =======================================================
     DESKRIPSI
  ======================================================= */

  const deskripsi =
    document.getElementById("deskripsi");

  if (deskripsi) {
    deskripsi.textContent =
      cafe.deskripsi || "";
  }


  /* =======================================================
     ALAMAT
  ======================================================= */

  const alamat =
    document.getElementById("alamat");

  if (alamat) {
    alamat.textContent =
      cafe.alamat || "";
  }


  /* =======================================================
     GOOGLE MAPS BUTTON
  ======================================================= */

  const btnMaps =
    document.getElementById("btn-maps");

  if (btnMaps) {

    btnMaps.href =
      cafe.link_maps || "#";

    btnMaps.target = "_blank";
    btnMaps.rel = "noopener noreferrer";
  }


  /* =======================================================
     GOOGLE MAPS EMBED
  ======================================================= */

  const peta =
    document.getElementById("peta");

  if (peta) {
    peta.src = urlPeta(cafe);
  }


  /* =======================================================
     JAM OPERASIONAL
  ======================================================= */

  const hours =
    await fetchData("/operating-hours");

  const openHours =
    document.getElementById("open-hours");

  if (!openHours) {
    return;
  }


  if (!hours || hours.length === 0) {

    openHours.innerHTML = `
      <p>Jam operasional belum tersedia.</p>
    `;

    return;
  }


  // Ambil jam operasional sesuai cafe_id
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


  openHours.innerHTML =
    cafeHours.map(j => `
      <div>
        <h3>${esc(j.hari)}</h3>
        <p>
          ${esc(j.jam_buka)} -
          ${esc(j.jam_tutup)}
        </p>
      </div>
    `).join("");
}



/* ---------- hero: carousel event ---------- */
async function tampilkanHero() {

  const events =
    await fetchData("/events");

  const judul =
    document.getElementById("hero-judul");

  const slider =
    document.getElementById("hero-slider");

  const bg =
    document.getElementById("hero-bg");

  const btn =
    document.getElementById("hero-btn");


  if (!judul || !slider || !bg || !btn) {
    return;
  }


  if (!events || events.length === 0) {

    judul.textContent =
      "Café Ácala";

    return;
  }


  const n = events.length;

  let i = 0;
  let timer;


  function render() {

    const ev = events[i];


    /* ---------- judul ---------- */

    judul.textContent =
      ev.nama || "Café Ácala";


    /* ---------- tombol ---------- */

    btn.href =
      "event.html?id=" +
      encodeURIComponent(ev.id);


    /* ---------- background ---------- */

    if (ev.gambar) {

      bg.style.backgroundImage =
        `url("${ev.gambar}")`;
    }


    /* ---------- posisi slide ---------- */

    const posisi = n === 1
      ? [
          ["tengah", i]
        ]
      : [
          ["kiri", (i - 1 + n) % n],
          ["tengah", i],
          ["kanan", (i + 1) % n]
        ];


    /* ---------- render slide ---------- */

    slider.innerHTML = posisi.map(
      ([kelas, idx]) => `
        <button
          class="slide ${kelas}"
          data-idx="${idx}"
          aria-label="${esc(events[idx].nama)}"
        >
          <img
            src="${esc(events[idx].gambar)}"
            alt="${esc(events[idx].nama)}"
          >
        </button>
      `
    ).join("");
  }


  /* ---------- autoplay ---------- */

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


    timer = setInterval(() => {

      i = (i + 1) % n;

      render();

    }, 5000);
  }


  /* ---------- klik slide ---------- */

  slider.addEventListener("click", e => {

    const s =
      e.target.closest(".slide");

    if (!s) {
      return;
    }


    i =
      Number(s.dataset.idx);

    render();

    mulai();
  });


  render();

  mulai();
}

/* ---------- best sellers ---------- */
async function tampilkanBest() {
  const menu = await fetchData("/menu");
  const wadah = document.getElementById("best-list");
  if (!menu) { wadah.textContent = "Menu gagal dimuat."; return; }

  const best = menu.filter(m => m.label === "Best Seller").slice(0, 4);
  const sorot = best.length >= 3 ? 2 : 0; // kartu kuning (seperti di desain)
  wadah.innerHTML = best.map((m, k) => `
    <a class="best-card${k === sorot ? " sorot" : ""}" href="menu-detail.html?id=${m.id}">
      <img src="${esc(m.gambar)}" alt="${esc(m.nama)}" loading="lazy">
      <h3>${esc(m.nama)}</h3>
      <small>${rupiahSingkat(m.harga)}</small>
    </a>`).join("");
}

tampilkanBeranda();
tampilkanHero();
tampilkanBest();