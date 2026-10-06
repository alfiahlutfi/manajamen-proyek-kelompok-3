const MENU_NAV = [
  { label: "Beranda", href: "index.html" },
  { label: "Menu", href: "menu.html" },
  { label: "Event", href: "index.html#event" },
  { label: "Galeri", href: "galeri.html" },
  { label: "Reservasi", href: "reservasi.html" },
  { label: "FAQ", href: "faq.html" },
];

// Sosmed & email belum ada di API contract -> sementara di sini.
// Minta backend menambahkan field instagram, tiktok, email di /api/cafe.
const SOSMED = {
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  email: "acalacafe@gmail.com",
};

// jam_operasional bentuk: "Monday - Thursday: 11 AM - 11 PM; Friday - Sunday: 09 AM - 10 PM"
// Kalau tidak ada ";" / ":" -> ditampilkan sebagai satu baris.
function parseJam(teks) {
  return String(teks || "").split(";").map(s => s.trim()).filter(Boolean).map(s => {
    const i = s.lastIndexOf(": ");
    return i > 0 ? { hari: s.slice(0, i), jam: s.slice(i + 2) } : { hari: "Setiap hari", jam: s };
  });
}

const HARI = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// "Monday - Thursday" -> [Monday, Tuesday, Wednesday, Thursday]; selain itu dikembalikan apa adanya
function pecahHari(label) {
  const [a, b] = String(label).split(/\s*-\s*/);
  const i = HARI.indexOf(a), j = HARI.indexOf(b);
  if (i >= 0 && j >= i) return HARI.slice(i, j + 1);
  return [label];
}

const IKON_IG = `<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#ig)"/><rect x="12" y="12" width="24" height="24" rx="7" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="6" fill="none" stroke="#fff" stroke-width="3"/><circle cx="31.5" cy="16.5" r="1.8" fill="#fff"/></svg>`;
const IKON_TT = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#000"/><path d="M26 11v18.5a5 5 0 1 1-5-5" fill="none" stroke="#25f4ee" stroke-width="3.5" transform="translate(-1.5 0)"/><path d="M26 11v18.5a5 5 0 1 1-5-5" fill="none" stroke="#fe2c55" stroke-width="3.5" transform="translate(1.5 0)"/><path d="M26 11c.6 4 3 6.5 7.5 7" fill="none" stroke="#fff" stroke-width="3.5"/><path d="M26 11v18.5a5 5 0 1 1-5-5" fill="none" stroke="#fff" stroke-width="3.5"/></svg>`;

function formatTelp(wa) {
  const n = String(wa || "").replace(/^62/, "");
  return "+62 " + n.replace(/(\d{3})(\d{4})(\d+)/, "$1 $2 $3");
}

async function renderLayout() {
  const cafe = await fetchData("/cafe");
  const halaman = location.pathname.split("/").pop() || "index.html";

  const navbar = document.getElementById("navbar");
  if (navbar) {
    const links = MENU_NAV.map(m => {
      const aktif = !m.href.includes("#") && m.href === halaman ? ' class="aktif"' : "";
      return `<a href="${m.href}"${aktif}>${m.label}</a>`;
    }).join("");
    navbar.innerHTML = `
    <a href="index.html" class="brand">
      <img src="assets/logo_acala-removebg-preview.png" class="logo-icon" alt="Logo">
      <img src="assets/logo_acala_-_Salin-removebg-preview.png" class="logo-text" alt="ACALA">
    </a>
  <nav>${links}</nav>`;
  }

  const footer = document.getElementById("footer");
  if (footer) {
    if (!cafe) { footer.innerHTML = "<p>&copy; Café Ácala</p>"; return; }
    const jam = parseJam(cafe.jam_operasional).flatMap(j =>
      pecahHari(j.hari).map(h => `<li><span>${esc(h)}</span><i></i><span>${esc(j.jam)}</span></li>`)).join("");
    footer.innerHTML = `
      <div class="footer-grid">
        <div>
          <h4>Opening Hours</h4>
          <ul class="jam-list">${jam}</ul>
        </div>
        <div>
          <h4>Get To Know Us</h4>
          <ul class="link-list">
            <li><a href="menu.html">Menu</a></li>
            <li><a href="index.html#event">Event</a></li>
            <li><a href="galeri.html">Galeri</a></li>
            <li><a href="reservasi.html">Reservasi</a></li>
          </ul>
        </div>
        <div>
          <h4>Connect With Us</h4>
          <p><a href="https://wa.me/${esc(cafe.whatsapp)}" target="_blank" rel="noopener">${formatTelp(cafe.whatsapp)}</a></p>
          <p><a href="mailto:${esc(SOSMED.email)}">${esc(SOSMED.email)}</a></p>
          <p class="sosmed">
            <a href="${esc(SOSMED.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${IKON_IG}</a>
            <a href="${esc(SOSMED.tiktok)}" target="_blank" rel="noopener" aria-label="TikTok">${IKON_TT}</a>
          </p>
        </div>
      </div>
      <p class="copy">&copy; ${new Date().getFullYear()} ${esc(cafe.nama)} &amp; Eatery</p>`;
  }
}

renderLayout();