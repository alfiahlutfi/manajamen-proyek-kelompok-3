// js/event.js — Halaman Event (kartu 11.2.2)
// Urutan script: api.js -> states.js -> layout.js -> event.js
// Kontrak data (GET event.php, tanpa id): array berisi
//   { id, nama, foto, deskripsi, tanggal (YYYY-MM-DD), waktu (HH:MM:SS), lokasi, status, [kategori], [waktu_selesai] }
// `status` dan urutan dipakai apa adanya dari API (FE tidak menghitung / mengurutkan ulang).
(() => {
  "use strict";

  const grid = document.getElementById("event-grid");
  if (!grid) return;

  const MIN_SKELETON = 3000;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const HARI = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const BULAN = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
  const BULAN_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  };

  /* ---------- Target dari carousel: ?id=3 dan/atau #event-3 ---------- */
  function idTujuan() {
    const q = new URLSearchParams(location.search).get("id");
    const h = location.hash.match(/^#event-(.+)$/);
    const v = (q || (h && decodeURIComponent(h[1])) || "").trim();
    return v;
  }

  /* ---------- Format tampilan ---------- */
  function parseTanggal(t) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(t || ""));
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return { hari: HARI[d.getUTCDay()], tgl: +m[3], bulan: BULAN_EN[+m[2] - 1] };
  }
  const jam = (w) => (w ? String(w).slice(0, 5).replace(":", ":") : "");

  /* ---------- Skeleton ---------- */
  function skeletonCard() {
    const c = el("article", "ev-card ev-skel");
    c.setAttribute("aria-hidden", "true");
    c.append(el("div", "ev-photo"));
    const b = el("div", "ev-body");
    ["w1", "w2", "w3", "w4", "w3"].forEach((w) => b.append(el("div", "ev-line " + w)));
    c.append(b);
    return c;
  }
  const skeletonList = (n = 3) => Array.from({ length: n }, skeletonCard);

  /* ---------- Kartu event ---------- */
  // Ambil field dari API; beberapa nama alternatif diterima supaya cocok dengan kontrak BE
  const pick = (o, ...keys) => {
    for (const k of keys) if (o[k] !== undefined && o[k] !== null && String(o[k]).trim() !== "") return o[k];
    return "";
  };

  function kartu(ev) {
    const kategori = pick(ev, "kategori", "category", "jenis", "tipe");
    const status   = pick(ev, "status", "status_event", "status_label");
    const mulai    = pick(ev, "waktu", "jam_mulai", "waktu_mulai");
    const selesai  = pick(ev, "waktu_selesai", "jam_selesai", "waktu_akhir");
    const lokasi   = pick(ev, "lokasi", "tempat");

    const c = el("article", "ev-card");
    c.id = "event-" + ev.id;                       // alamat unik: event.html#event-{id}
    c.dataset.id = ev.id;

    const foto = el("div", "ev-photo");
    const img = document.createElement("img");
    img.alt = ev.nama ? "Foto event " + ev.nama : "Foto event";
    img.decoding = "async";
    foto.append(img);

    const tg = parseTanggal(ev.tanggal);
    if (tg) {
      const tag = el("div", "ev-tanggal");
      tag.append(el("small", "", tg.hari), el("strong", "", String(tg.tgl)), el("small", "", tg.bulan));
      c.append(tag);
    }

    const body = el("div", "ev-body");
    const badges = el("div", "ev-badges");
    if (kategori) badges.append(el("span", "ev-badge", kategori));
    if (status) {
      const done = /selesai/i.test(status);          // hanya untuk warna; teks tetap dari API
      badges.append(el("span", "ev-badge " + (done ? "status-selesai" : "status-akan"), status));
    }
    body.append(badges);

    const meta = [
      [jam(mulai), jam(selesai)].filter(Boolean).join(" – "),
      lokasi
    ].filter(Boolean).join(" | ");
    if (meta) body.append(el("p", "ev-meta", meta));

    // Judul tampil 2 baris seperti desain: "Acala Acoustic:" / "Friday Unplugged" (pemisah ":" atau baris baru dari DB)
    body.append(el("h3", "ev-title", String(ev.nama || "").replace(/:\s+/, ":\n")));
    body.append(el("p", "ev-desc", ev.deskripsi || ""));   // deskripsi lengkap, tanpa dipotong

    c.append(foto, body);
    return { node: c, img, foto, src: ev.foto };
  }

  /* ---------- Gulir ke kartu tujuan (tidak tertutup navbar) ---------- */
  function tinggiNav() {
    const nav = document.getElementById("navbar");
    return nav ? nav.offsetHeight : 72;
  }
  function gulirKe(target) {
    document.documentElement.style.setProperty("--ev-nav", tinggiNav() + "px");
    const y = target.getBoundingClientRect().top + window.scrollY - tinggiNav() - 16;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    target.classList.add("ev-sorot");
    setTimeout(() => target.classList.remove("ev-sorot"), 2500);
  }

  /* ---------- Render ---------- */
  function tampilkanSkeleton() {
    grid.setAttribute("aria-busy", "true");
    grid.replaceChildren(...skeletonList());
  }

  function tampilkanGagal() {
    const pesan = el("div", "ev-pesan");
    pesan.setAttribute("role", "alert");
    pesan.append(el("p", "", "Gagal memuat event"));
    const btn = el("button", "ev-btn", "Muat Ulang");
    btn.type = "button";
    btn.addEventListener("click", () => { btn.disabled = true; muat(); });
    pesan.append(btn);
    grid.replaceChildren(pesan, ...skeletonList());   // skeleton tetap tampil saat gagal
    grid.setAttribute("aria-busy", "false");
  }

  function tampilkanKosong() {
    const p = el("div", "ev-pesan", "Belum ada event saat ini");
    grid.replaceChildren(p);
    grid.setAttribute("aria-busy", "false");
  }

  function tampilkanDaftar(data, tujuan) {
    const nodes = [];
    let tidakDitemukan = false;

    if (tujuan && !data.some((e) => String(e.id) === String(tujuan))) tidakDitemukan = true;
    if (tidakDitemukan) {
      nodes.push(el("p", "ev-info", "Event yang kamu tuju tidak ditemukan. Berikut daftar event kami."));
    }

    const items = data.map(kartu);              // urutan persis dari API
    items.forEach((i) => nodes.push(i.node));
    grid.replaceChildren(...nodes);
    grid.setAttribute("aria-busy", "false");

    items.forEach((i) => {
      if (window.Acala && Acala.media) Acala.media(i.img, i.src || "");   // placeholder / gagal muat foto
      else if (!i.src) i.foto.classList.add("tanpa-foto");
      else i.img.src = i.src;
    });

    const target = tujuan && !tidakDitemukan ? document.getElementById("event-" + tujuan) : null;
    if (target) requestAnimationFrame(() => gulirKe(target));
    else window.scrollTo(0, 0);                 // dibuka biasa / ID tidak ada: mulai dari atas
  }

  let nomor = 0;
  async function muat() {
    const saya = ++nomor;
    tampilkanSkeleton();
    const mulai = Date.now();
    const tujuan = idTujuan();

    try {
      const url = BASE_URL + API_MAP["/events"];
      const json = await Acala.getJSON(url);
      let data = json && json.data;
      if (!Array.isArray(data)) throw new Error("Format respons tidak sesuai kontrak.");
      data = perbaikiPathGambar(data);

      const sisa = MIN_SKELETON - (Date.now() - mulai);
      if (sisa > 0) await sleep(sisa);
      if (saya !== nomor) return;

      if (!data.length) return tampilkanKosong();
      tampilkanDaftar(data, tujuan);
    } catch (err) {
      if (saya !== nomor) return;
      console.error("Gagal memuat event:", err);
      const sisa = MIN_SKELETON - (Date.now() - mulai);
      if (sisa > 0) await sleep(sisa);
      if (saya !== nomor) return;
      tampilkanGagal();
    }
  }

  // Cegah browser melompat sendiri ke hash sebelum kartu ada
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("hashchange", () => {
    const t = document.getElementById("event-" + (idTujuan() || ""));
    if (t) gulirKe(t);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", muat);
  else muat();
})();