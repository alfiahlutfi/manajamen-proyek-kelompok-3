// =========================================================
// LAYOUT GLOBAL: NAVBAR + FOOTER (ANTIGAGAL & STABIL)
// =========================================================
"use strict";

const MENU_NAV = [
  { label: "Home", href: "index.html" },
  { label: "Menu", href: "menu.html" },
  { label: "Event", href: "event.html" },
  { label: "Gallery", href: "gallery.html" },
  { label: "Reservation", href: "reservasi.html" },
];

// Link di footer (satu-satunya sumber untuk SEMUA halaman)
const FOOTER_NAV = [
  { label: "Menu", href: "menu.html" },
  { label: "Event", href: "event.html" },
  { label: "Gallery", href: "gallery.html" },
  { label: "Reservation", href: "reservasi.html" },
];

// =========================================================
// NOTIFIKASI "KONTAK GAGAL DIMUAT"
// Bila data kontak (API /contact) gagal diambil, ikon kontak di footer
// (Instagram, TikTok, Email, WhatsApp) tetap tampil. Notifikasi merah
// muncul sebentar di atas layar HANYA saat ikon-ikon itu ditekan.
// Simulasi: tambahkan ?error=contact pada URL.
// =========================================================
const PESAN_KONTAK_GAGAL = "Kontak Gagal Dimuat";
const DURASI_NOTIF_MS = 800;
let timerNotifKontak = null;

window.kontakGagal = false;

function tampilkanNotifKontakGagal() {
  let notif = document.getElementById("notif-kontak-gagal");

  if (!notif) {
    notif = document.createElement("div");
    notif.id = "notif-kontak-gagal";
    notif.className = "notif-kontak-gagal";
    notif.setAttribute("role", "alert");
    notif.textContent = PESAN_KONTAK_GAGAL;
    document.body.appendChild(notif);
  }

  // Tampil tepat di bawah navbar (navbar bersifat sticky di atas layar)
  const nav = document.querySelector(".nav-acala");
  notif.style.top = (nav ? Math.round(nav.getBoundingClientRect().bottom) : 0) + "px";

  // Reflow agar animasi masuk berjalan ulang bila ikon ditekan berkali-kali
  notif.classList.remove("tampil");
  void notif.offsetWidth;
  notif.classList.add("tampil");

  clearTimeout(timerNotifKontak);
  timerNotifKontak = setTimeout(() => notif.classList.remove("tampil"), DURASI_NOTIF_MS);
}

// Dipakai juga oleh tombol WhatsApp melayang di halaman Reservasi
function tanganiKlikKontak(event) {
  if (!window.kontakGagal) return;
  event.preventDefault();
  tampilkanNotifKontakGagal();
}

window.tampilkanNotifKontakGagal = tampilkanNotifKontakGagal;
window.tanganiKlikKontak = tanganiKlikKontak;

// Render footer global ke <footer id="footer" class="footer-section"></footer>
function renderFooter() {
  const footer = document.getElementById("footer");
  if (!footer) return;

  const footerLinks = FOOTER_NAV.map(
    item => `<li><a href="${item.href}">${item.label}</a></li>`
  ).join("");

  footer.innerHTML = `
<div class="footer-container">

  <!-- Kolom 1: Logo -->
  <div class="footer-col footer-brand-col">
    <a href="index.html" aria-label="Café Ácala - Beranda">
      <img src="assets/logo_acala.png" alt="Logo Café Ácala" class="footer-logo-img" loading="lazy">
    </a>
  </div>

  <!-- Kolom 2: Get to Know Us -->
  <div class="footer-col footer-nav-col">
    <h3>GET TO KNOW US</h3>
    <ul class="footer-links">
      ${footerLinks}
    </ul>
  </div>

  <!-- Kolom 3: Connect With Us (ikon, tautan dinamis dari database) -->
  <div class="footer-col footer-connect-col">
    <h3>CONNECT WITH US</h3>
    <div class="footer-socials">
      <a id="footer-instagram" href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.3" y="1.3" width="21.4" height="21.4" rx="6"/><circle cx="11.6" cy="12.2" r="4.6"/><circle cx="18.2" cy="5.7" r="1.5" fill="currentColor" stroke="none"/></svg>
      </a>
      <a id="footer-email" href="#" aria-label="Email">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="3.9" width="21" height="16.2" rx="2.2"/><path d="M2.6 5.6L12 12.9l9.4-7.3"/></svg>
      </a>
      <a id="footer-whatsapp" href="#" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11.6" fill="none" stroke="currentColor" stroke-width="0.8"/><circle cx="12" cy="12" r="9.9" fill="currentColor"/><g transform="translate(5.7 5.7) scale(0.52)"><path fill="#fff" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></g></svg>
      </a>
      <a id="footer-tiktok" href="#" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.1" y="1.1" width="21.8" height="21.8" rx="5.4"/><g fill="currentColor" stroke="none" transform="translate(12 12) scale(1.153) translate(-12 -12)"><path fill-rule="evenodd" d="M8.51 14.26a2.57 2.57 0 1 0 5.14 0a2.57 2.57 0 1 0-5.14 0zM12.05 13.95a.85.85 0 1 1-1.7 0a.85.85 0 1 1 1.7 0z"/><path d="M12.12 6.2h1.53c.2 1.4 1.15 2.3 2.35 2.5c-.7.7-1.45.95-2.35 1v5H12.12z"/></g></svg>
      </a>
    </div>
  </div>

</div>

<!-- Copyright -->
<div class="footer-bottom">
  <p>© 2021-2026 Cafe Acala &amp; Eatery</p>
</div>
  
  `;
}

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

// ======================================================
// LOGIKA HOVER & AKTIF INDIKATOR NAVBAR (PRESISI & DIAM SAAT REFRESH)
// ======================================================
// ======================================================
// LOGIKA HOVER & AKTIF INDIKATOR NAVBAR (DIAM TOTAL & ANTI-LONCAT)
// ======================================================
function inisialisasiNavIndicator() {
  const nav = document.querySelector(".nav-acala nav");
  if (!nav) return;

  const hoverIndicator = nav.querySelector(".nav-indicator-hover");
  const activeIndicator = nav.querySelector(".nav-indicator-active");
  const links = nav.querySelectorAll("a");

  function posisikanIndikator(indicatorEl, el, instant = false) {
    if (!el || !indicatorEl) return;
    
    const leftPos = el.offsetLeft;
    const topPos = (nav.clientHeight - el.offsetHeight) / 2;
    const width = el.offsetWidth;

    if (width === 0) {
      requestAnimationFrame(() => posisikanIndikator(indicatorEl, el, instant));
      return;
    }

    if (instant) {
      indicatorEl.style.cssText += "transition: none !important;";
    } else {
      indicatorEl.style.transition = "left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
    }

    indicatorEl.style.left = `${leftPos}px`;
    indicatorEl.style.top = `${topPos}px`;
    indicatorEl.style.width = `${width}px`;
    indicatorEl.style.height = `${el.offsetHeight}px`;
    indicatorEl.style.opacity = "1";

    if (instant) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          indicatorEl.style.transition = "";
        });
      });
    }
  }

  function aturPosisiAktif(instant = false) {
    const halamanSkarang = location.pathname.split("/").pop() || "index.html";
    let activeLink = null;

    links.forEach(link => {
      const href = link.getAttribute("href");
      const isMatch = (href === halamanSkarang) || ((halamanSkarang === "" || halamanSkarang === "/") && href === "index.html");
      if (isMatch) {
        link.classList.add("aktif");
        activeLink = link;
      } else {
        link.classList.remove("aktif");
      }
    });

    if (!activeLink) {
      activeLink = nav.querySelector('a[href="index.html"]');
      if (activeLink) activeLink.classList.add("aktif");
    }

    if (activeLink && activeIndicator) {
      posisikanIndikator(activeIndicator, activeLink, instant);
    }
  }

  // Tunggu hingga font benar-benar siap agar posisi dihitung pas dalam 1 kali eksekusi matang
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      aturPosisiAktif(true);
    });
  }

  // Eksekusi sekali saja secara instan untuk frame pertama
  aturPosisiAktif(true);

  if (hoverIndicator) {
    hoverIndicator.style.opacity = "0";
  }

  // Logika Hover
  links.forEach(link => {
    link.addEventListener("mouseenter", () => {
      if (hoverIndicator) posisikanIndikator(hoverIndicator, link, false);
    });
  });

  nav.addEventListener("mouseleave", () => {
    if (hoverIndicator) hoverIndicator.style.opacity = "0";
    const currentActive = nav.querySelector("a.aktif");
    if (currentActive && activeIndicator) {
      posisikanIndikator(activeIndicator, currentActive, false);
    }
  });

  window.addEventListener("resize", () => {
    const currentActive = nav.querySelector("a.aktif");
    if (currentActive && activeIndicator) posisikanIndikator(activeIndicator, currentActive, true);
  });
}

async function renderLayout() {
  const halaman = location.pathname.split("/").pop() || "index.html";
  const navbar = document.getElementById("navbar");

  if (navbar) {
    const links = MENU_NAV.map(item => {
      const isAktif = isHalamanAktif(item.href, halaman) || ((halaman === "" || halaman === "/") && item.href === "index.html");
      const aktif = isAktif ? ' class="aktif" aria-current="page"' : "";
      return `<a href="${item.href}"${aktif}>${item.label}</a>`;
    }).join("");

    // RENDER NAVBAR DENGAN KUNCI TRANSISI MATI (AGAR TIDAK BERGESER SAAT HARD REFRESH)
    navbar.innerHTML = `
      <a href="index.html" class="brand" aria-label="Café Ácala - Beranda">
        <img src="assets/logo_acala-removebg-preview.png" class="logo-icon" alt="Logo Acala Icon">
        <img src="assets/logo_acala_-_Salin-removebg-preview.png" class="logo-text" alt="Acala Text">
      </a>
      <nav aria-label="Navigasi utama">
        <div class="nav-indicator-active" style="opacity: 1 !important; transition: none !important;"></div>
        <div class="nav-indicator-hover"></div>
        ${links}
      </nav>
    `;

    // Jalankan kalkulasi posisi agar langsung klop di awal
    inisialisasiNavIndicator();
  }

  // Footer global (dirender sebelum link kontak diisi dari database)
  renderFooter();

  // 2. AMBIL DATA KONTAK & KAFE DARI DATABASE
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

  // ?error=contact -> simulasi kontak gagal dimuat (untuk pengujian SQA)
  if (new URLSearchParams(location.search).get("error") === "contact") {
    contact = null;
    cafe = null;
  }

  // Gagal = request /contact gagal / tidak mengembalikan data.
  // (Data ada tetapi sebagian kolom kosong BUKAN gagal; ikonnya saja yang disembunyikan.)
  window.kontakGagal = !contact || typeof contact !== "object";

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

  const idIkonKontak = ["footer-whatsapp", "footer-email", "footer-instagram", "footer-tiktok"];

  if (window.kontakGagal) {
    // Kontak gagal dimuat: ikon tetap tampil, tetapi tidak membuka tautan apa pun
    idIkonKontak.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.href = "#";
      el.removeAttribute("target");
      el.style.display = "inline-flex";
    });
  } else {
    setLink("footer-whatsapp", waUrl, null, "inline-flex");
    setLink("footer-email", emailUrl, null, "inline-flex");
    setLink("footer-instagram", /^https?:\/\//i.test(igVal) ? igVal : "", null, "inline-flex");
    setLink("footer-tiktok", /^https?:\/\//i.test(ttVal) ? ttVal : "", null, "inline-flex");
  }

  // Saat kontak gagal dimuat, menekan ikon menampilkan notifikasi
  idIkonKontak.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", tanganiKlikKontak);
  });

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