const USE_MOCK = true; // ganti false kalau backend sudah siap
const BASE_URL = "/api";

// pemetaan endpoint ke file mock
const MOCK_MAP = {
  "/cafe": "mock/cafe.json",
  "/menu": "mock/menu.json",
  "/gallery": "mock/gallery.json",
  "/areas": "mock/areas.json",
  "/events": "mock/events.json",
  "/faqs": "mock/faqs.json",
};

async function fetchData(endpoint) {
  let url = BASE_URL + endpoint;
  let detailId = null;

  if (USE_MOCK) {
    // endpoint detail, contoh: /events/2
    const m = endpoint.match(/^(\/\w+)\/(\d+)$/);
    if (m) {
      url = MOCK_MAP[m[1]];
      detailId = Number(m[2]);
    } else {
      url = MOCK_MAP[endpoint];
    }
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || json.message);

    // di mode mock, detail diambil dari list berdasarkan id
    if (detailId !== null) return json.data.find(i => i.id === detailId) || null;
    return json.data;
  } catch (err) {
    console.error("Gagal mengambil " + endpoint, err);
    return null;
  }
}

// cegah karakter HTML dari data masuk sebagai kode
function esc(text) {
  const d = document.createElement("div");
  d.textContent = text ?? "";
  return d.innerHTML;
}