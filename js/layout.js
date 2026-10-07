const MENU_NAV = [
  { label: "Beranda", href: "index.html" },
  { label: "Menu", href: "menu.html" },
  { label: "Event", href: "index.html#event" },
  { label: "Galeri", href: "galeri.html" },
  { label: "Reservasi", href: "reservasi.html" },
  { label: "FAQ", href: "faq.html" },
];


// ======================================================
// JAM OPERASIONAL
// ======================================================

// "Monday - Thursday: 11 AM - 11 PM; Friday - Sunday: 09 AM - 10 PM"
// akan diubah menjadi beberapa bagian.
function parseJam(teks) {
  return String(teks || "")
    .split(";")
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const i = s.lastIndexOf(": ");

      return i > 0
        ? {
            hari: s.slice(0, i),
            jam: s.slice(i + 2)
          }
        : {
            hari: "Setiap hari",
            jam: s
          };
    });
}


const HARI = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];


// "Monday - Thursday"
// menjadi:
// Monday
// Tuesday
// Wednesday
// Thursday
function pecahHari(label) {
  const [a, b] = String(label).split(/\s*-\s*/);

  const i = HARI.indexOf(a);
  const j = HARI.indexOf(b);

  if (i >= 0 && j >= i) {
    return HARI.slice(i, j + 1);
  }

  return [label];
}


// ======================================================
// FORMAT NOMOR WHATSAPP
// ======================================================

function formatTelp(wa) {
  const value = String(wa || "").trim();

  if (!value) {
    return "";
  }

  // Kalau sudah menggunakan format +62 xxx xxxx xxxx,
  // tampilkan sesuai data database.
  if (value.startsWith("+62")) {
    return value;
  }

  // Kalau database menggunakan 62xxxxxxxxxx
  if (value.startsWith("62")) {
    const n = value.slice(2);

    return "+62 " + n.replace(
      /(\d{3})(\d{4})(\d+)/,
      "$1 $2 $3"
    );
  }

  // Kalau menggunakan 08xxxxxxxxxx
  if (value.startsWith("0")) {
    const n = value.slice(1);

    return "+62 " + n.replace(
      /(\d{3})(\d{4})(\d+)/,
      "$1 $2 $3"
    );
  }

  return value;
}


// ======================================================
// NOMOR WHATSAPP UNTUK LINK WA.ME
// ======================================================

function formatWaLink(wa) {
  let nomor = String(wa || "").trim();

  // Hanya sisakan angka
  nomor = nomor.replace(/\D/g, "");

  // Jika nomor dimulai 0
  // contoh: 085797275590
  // menjadi: 6285797275590
  if (nomor.startsWith("0")) {
    nomor = "62" + nomor.slice(1);
  }

  // Jika belum dimulai 62
  if (!nomor.startsWith("62")) {
    nomor = "62" + nomor;
  }

  return "https://wa.me/" + nomor;
}


// ======================================================
// RENDER LAYOUT
// ======================================================

async function renderLayout() {

  // Ambil data Cafe dari database
  const cafe = await fetchData("/cafe");

  // Nama halaman saat ini
  const halaman =
    location.pathname.split("/").pop() || "index.html";


  // ====================================================
  // HEADER / NAVBAR
  // ====================================================

  const navbar = document.getElementById("navbar");

  if (navbar) {

    const links = MENU_NAV.map(m => {

      const aktif =
        !m.href.includes("#") &&
        m.href === halaman
          ? ' class="aktif"'
          : "";

      return `
        <a href="${m.href}"${aktif}>
          ${m.label}
        </a>
      `;

    }).join("");


    // Kalau data cafe berhasil diambil,
    // logo dan tulisan Acala diambil dari database.
    const logoCafe =
      cafe && cafe.logo
        ? cafe.logo
        : "assets/logo_acala-removebg-preview.png";

    const namaCafe =
      cafe && cafe.nama
        ? cafe.nama
        : "assets/logo_acala_-_Salin-removebg-preview.png";


    navbar.innerHTML = `
      <a href="index.html" class="brand">

        <img
          src="${esc(logoCafe)}"
          class="logo-icon"
          alt="Logo Acala">

        <img
          src="${esc(namaCafe)}"
          class="logo-text"
          alt="Acala">

      </a>

      <nav>
        ${links}
      </nav>
    `;
  }


  // ====================================================
  // FOOTER
  // ====================================================

  if (!cafe) {
    console.error("Data cafe tidak ditemukan.");
    return;
  }


  // ====================================================
  // WHATSAPP
  // ====================================================

  const footerWhatsapp =
    document.getElementById("footer-whatsapp");

  if (footerWhatsapp) {

    footerWhatsapp.href =
      formatWaLink(cafe.whatsapp);

    footerWhatsapp.target = "_blank";
    footerWhatsapp.rel = "noopener noreferrer";

    footerWhatsapp.textContent =
      formatTelp(cafe.whatsapp);
  }


  // ====================================================
  // EMAIL
  // ====================================================

  const footerEmail =
    document.getElementById("footer-email");

  if (footerEmail) {

    footerEmail.href =
      "mailto:" + cafe.email;

    footerEmail.textContent =
      cafe.email || "";
  }


  // ====================================================
  // INSTAGRAM
  // ====================================================

  const footerInstagram =
    document.getElementById("footer-instagram");

  if (footerInstagram) {

    footerInstagram.href =
      cafe.instagram || "#";

    footerInstagram.target = "_blank";
    footerInstagram.rel = "noopener noreferrer";
  }


  // ====================================================
  // TIKTOK
  // ====================================================

  const footerTiktok =
    document.getElementById("footer-tiktok");

  if (footerTiktok) {

    footerTiktok.href =
      cafe.tiktok || "#";

    footerTiktok.target = "_blank";
    footerTiktok.rel = "noopener noreferrer";
  }


  // ====================================================
  // COPYRIGHT
  // ====================================================

  const footerBottom =
    document.querySelector(".footer-bottom p");

  if (footerBottom) {

    const tahunSekarang =
      new Date().getFullYear();

    footerBottom.innerHTML =
      `&copy; 2021-${tahunSekarang} Cafe Acala &amp; Eatery`;
  }
}


// Jalankan layout
renderLayout();