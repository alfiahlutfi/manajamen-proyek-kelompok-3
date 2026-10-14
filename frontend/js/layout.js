/* =========================================================
   LAYOUT GLOBAL: NAVBAR + FOOTER
   Menggunakan struktur index.html yang sudah ada.
   ========================================================= */
"use strict";

const MENU_NAV = [
  { label: "Beranda", href: "index.html" },
  { label: "Menu", href: "menu.html" },
  { label: "Event", href: "index.html#event" },
  { label: "Galeri", href: "galeri.html" },
  { label: "Reservasi", href: "reservasi.html" },
  { label: "FAQ", href: "faq.html" }
];

function formatTelp(wa) {
  const value = String(wa || "").trim();
  if (!value) return "";
  if (value.startsWith("+62")) return value;

  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) return value;

  const national = digits.slice(2);
  // Format nomor Indonesia secara fleksibel tanpa memotong digit.
  if (national.length >= 10) {
    return "+62 " + national.slice(0, 3) + " " +
      national.slice(3, 7) + " " + national.slice(7);
  }
  return "+62 " + national;
}

function formatWaLink(wa) {
  let nomor = String(wa || "").replace(/\D/g, "");
  if (!nomor) return "#";
  if (nomor.startsWith("0")) nomor = "62" + nomor.slice(1);
  else if (!nomor.startsWith("62")) nomor = "62" + nomor;
  return "https://wa.me/" + nomor;
}

function isHalamanAktif(href, halaman) {
  if (href.includes("#")) return false;
  return href === halaman || (href === "index.html" && halaman === "");
}

async function renderLayout() {
  const cafeResponse = await fetchData("/cafe");
  const cafe = Array.isArray(cafeResponse) ? cafeResponse[0] : cafeResponse;
  const halaman = location.pathname.split("/").pop() || "index.html";
  const navbar = document.getElementById("navbar");

  if (navbar) {
    const links = MENU_NAV.map(item => {
      const aktif = isHalamanAktif(item.href, halaman) ? ' class="aktif" aria-current="page"' : "";
      return `<a href="${item.href}"${aktif}>${item.label}</a>`;
    }).join("");

    const logoCafe = cafe && cafe.logo
      ? cafe.logo
      : "assets/logo_acala-removebg-preview.png";
    const namaCafe = cafe && cafe.nama
      ? cafe.nama
      : "assets/logo_acala_-_Salin-removebg-preview.png";

    navbar.innerHTML = `
      <a href="index.html" class="brand" aria-label="Café Ácala - Beranda">
        <img src="${esc(logoCafe)}" class="logo-icon" alt="Logo Acala">
        <img src="${esc(namaCafe)}" class="logo-text" alt="Acala">
      </a>
      <nav aria-label="Navigasi utama">${links}</nav>
    `;
  }

  if (!cafe) {
    console.error("Data café tidak ditemukan; navbar memakai logo cadangan.");
    return;
  }

  const footerWhatsapp = document.getElementById("footer-whatsapp");
  if (footerWhatsapp) {
    footerWhatsapp.href = formatWaLink(cafe.whatsapp);
    footerWhatsapp.target = "_blank";
    footerWhatsapp.rel = "noopener noreferrer";
    footerWhatsapp.textContent = formatTelp(cafe.whatsapp);
  }

  const footerEmail = document.getElementById("footer-email");
  if (footerEmail) {
    footerEmail.href = cafe.email ? "mailto:" + cafe.email : "#";
    footerEmail.textContent = cafe.email || "";
  }

  const footerInstagram = document.getElementById("footer-instagram");
  if (footerInstagram) {
    footerInstagram.href = cafe.instagram || "#";
    footerInstagram.target = "_blank";
    footerInstagram.rel = "noopener noreferrer";
  }

  const footerTiktok = document.getElementById("footer-tiktok");
  if (footerTiktok) {
    footerTiktok.href = cafe.tiktok || "#";
    footerTiktok.target = "_blank";
    footerTiktok.rel = "noopener noreferrer";
  }

  const copyright = document.querySelector(".footer-bottom p");
  if (copyright) {
    copyright.innerHTML = `&copy; 2021-${new Date().getFullYear()} Cafe Acala &amp; Eatery`;
  }
}

renderLayout();
