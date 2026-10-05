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
  const cafe = await fetchData("/cafe");
  if (!cafe) return;

  document.getElementById("deskripsi").textContent = cafe.deskripsi;
  document.getElementById("alamat").textContent = cafe.alamat;
  document.getElementById("btn-maps").href = cafe.link_maps;

  document.getElementById("peta").src = urlPeta(cafe);

  document.getElementById("open-hours").innerHTML = parseJam(cafe.jam_operasional).map(j => `
    <div><h3>${esc(j.hari)}</h3><p>${esc(j.jam)}</p></div>`).join("");
}

/* ---------- hero: carousel event ---------- */
async function tampilkanHero() {
  const events = await fetchData("/events");
  const judul = document.getElementById("hero-judul");
  if (!events || events.length === 0) { judul.textContent = "Café Ácala"; return; }

  const slider = document.getElementById("hero-slider");
  const bg = document.getElementById("hero-bg");
  const btn = document.getElementById("hero-btn");
  const n = events.length;
  let i = 0, timer;

  function render() {
    const ev = events[i];
    judul.textContent = ev.nama;
    btn.href = "event.html?id=" + ev.id;
    bg.style.backgroundImage = `url("${ev.gambar}")`;

    const posisi = n === 1 ? [["tengah", i]] :
      [["kiri", (i - 1 + n) % n], ["tengah", i], ["kanan", (i + 1) % n]];
    slider.innerHTML = posisi.map(([kelas, idx]) => `
      <button class="slide ${kelas}" data-idx="${idx}" aria-label="${esc(events[idx].nama)}">
        <img src="${esc(events[idx].gambar)}" alt="${esc(events[idx].nama)}">
      </button>`).join("");
  }

  function mulai() {
    if (n < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearInterval(timer);
    timer = setInterval(() => { i = (i + 1) % n; render(); }, 5000);
  }

  slider.addEventListener("click", e => {
    const s = e.target.closest(".slide");
    if (!s) return;
    i = Number(s.dataset.idx); render(); mulai();
  });

  render(); mulai();
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