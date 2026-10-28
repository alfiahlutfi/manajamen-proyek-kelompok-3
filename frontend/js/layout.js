/* =========================================================
   LAYOUT GLOBAL: NAVBAR + FOOTER (ANTIGAGAL & STABIL)
   ========================================================= */
"use strict";

const MENU_NAV = [
  { label: "Beranda", href: "index.html" },
  { label: "Menu", href: "menu.html" },
  { label: "Event", href: "event.html" },
  { label: "Galeri", href: "gallery.html" },
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
  const halaman = location.pathname.split("/").pop() || "index.html";
  const navbar = document.getElementById("navbar");

  // 1. RENDER NAVBAR DIJAMIN TAMPIL DULUAN
  if (navbar) {
    const links = MENU_NAV.map(item => {
      const aktif = isHalamanAktif(item.href, halaman) ? ' class="aktif" aria-current="page"' : "";
      return `<a href="${item.href}"${aktif}>${item.label}</a>`;
    }).join("");

    navbar.innerHTML = `
      <a href="index.html" class="brand" aria-label="Café Ácala - Beranda">
        <img src="assets/logo_acala-removebg-preview.png" class="logo-icon" alt="Logo Acala Icon">
        <img src="assets/logo_acala_-_Salin-removebg-preview.png" class="logo-text" alt="Acala Text">
      </a>
      <nav aria-label="Navigasi utama">${links}</nav>
    `;
  }

  // 2. AMBIL DATA KAFE & KONTAK UNTUK FOOTER DARI DATABASE
// 2. AMBIL DATA KONTAK & KAFE MURNI DARI DATABASE
  let contact = null;
  let cafe = null;
  try {
    if (typeof fetchData === "function") {
      const [contactResponse, cafeResponse] = await Promise.all([
        fetchData("/contact").catch(() => null),
        fetchData("/cafe").catch(() => null)
      ]);
      contact = Array.isArray(contactResponse) ? contactResponse[0] : contactResponse;
      cafe = Array.isArray(cafeResponse) ? cafeResponse[0] : cafeResponse;
    }
  } catch (err) {
    console.warn("Gagal mengambil data dari database:", err);
  }

  // Field dari contact.php: nomor_telepon, email, url_whatsapp, url_gmail, url_instagram, url_tiktok
  // (fallback ke tabel cafe bila contact.php gagal)
  const c = contact || {};
  const k = cafe || {};

  const waNumber = c.nomor_telepon || k.whatsapp || "";
  const waUrl    = c.url_whatsapp || (waNumber ? formatWaLink(waNumber) : "");
  const emailVal = c.email || k.email || "";
  const emailUrl = c.url_gmail || (emailVal ? "mailto:" + emailVal : "");
  const igVal    = c.url_instagram || k.instagram || "";
  const ttVal    = c.url_tiktok || k.tiktok || "";

  function setLink(id, href, teks, display) {
    const el = document.getElementById(id);
    if (!el) return;
    if (href) {
      el.href = href;
      if (teks !== null) el.textContent = teks;
      el.style.display = display;
    } else {
      el.style.display = "none";
    }
  }

  setLink("footer-whatsapp", waUrl, formatTelp(waNumber), "block");
  setLink("footer-email", emailUrl, emailVal, "block");
  setLink("footer-instagram", /^https?:\/\//i.test(igVal) ? igVal : "", null, "inline-block");
  setLink("footer-tiktok", /^https?:\/\//i.test(ttVal) ? ttVal : "", null, "inline-block");

  const copyright = document.querySelector(".footer-bottom p");
  if (copyright) {
    copyright.innerHTML = `© 2021-${new Date().getFullYear()} Cafe Acala & Eatery`;
  }
}

// Jalankan otomatis saat halaman siap
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderLayout);
} else {
  renderLayout();
}