const BASE_URL   = "../backend/api/";   // folder file PHP API
const BASE_ASSET = "../backend/";       // folder yang berisi "uploads/" (lihat tabel di atas)

const API_MAP = {
    "/cafe": "cafe.php",
    "/menu": "menu.php?featured=1",
    "/gallery": "gallery.php",
    "/areas": "area.php",
    "/events": "event.php",
    "/carousel": "carousel.php",
    "/faqs": "faq.php",
    "/menu-category": "menu_category.php",
    "/operating-hours": "operating_hours.php",
    "/lokasi": "location.php",
    "/reservasi": "reservation.php"
};


// "uploads/cafe/logo.png" → "../backend/uploads/cafe/logo.png"
function perbaikiPathGambar(data) {
    if (typeof data === "string") {
        return data.startsWith("uploads/") ? BASE_ASSET + data : data;
    }
    if (Array.isArray(data)) return data.map(perbaikiPathGambar);
    if (data && typeof data === "object") {
        const hasil = {};
        for (const k in data) hasil[k] = perbaikiPathGambar(data[k]);
        return hasil;
    }
    return data;
}


async function fetchData(endpoint) {
    const cleanEndpoint = endpoint.startsWith("/")
        ? endpoint
        : "/" + endpoint;

    // Mendukung endpoint detail, misalnya /events/2
    const detailMatch = cleanEndpoint.match(/^(.+)\/(\d+)$/);

    let apiEndpoint = cleanEndpoint;
    let detailId = null;

    if (detailMatch) {
        apiEndpoint = detailMatch[1];
        detailId = Number(detailMatch[2]);
    }

    const fileName = API_MAP[apiEndpoint];

    if (!fileName) {
        throw new Error("Endpoint tidak terdaftar: " + endpoint);
    }

    const res = await fetch(BASE_URL + fileName);

    if (!res.ok) {
        throw new Error("HTTP " + res.status);
    }

    const json = await res.json();

    if (!json.success) {
        throw new Error(json.message || "Gagal mengambil data");
    }

    const data = perbaikiPathGambar(json.data);

    if (detailId !== null) {
        if (!Array.isArray(data)) {
            throw new Error("Format data detail tidak valid");
        }

        const item = data.find(item => Number(item.id) === detailId);

        if (!item) {
            throw new Error("Data detail tidak ditemukan");
        }

        return item;
    }

    if (apiEndpoint === "/cafe" && Array.isArray(data)) {
        if (!data.length) {
            throw new Error("Data cafe kosong");
        }

        return data[0];
    }

    return data;
}


function esc(text) {
    const d = document.createElement("div");
    d.textContent = text ?? "";
    return d.innerHTML;
}

