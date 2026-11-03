// =========================================================
// LAYOUT GLOBAL: NAVBAR + FOOTER (ANTIGAGAL & STABIL)
// =========================================================
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