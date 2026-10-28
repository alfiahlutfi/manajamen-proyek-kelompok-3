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
    "/reservasi": "reservation.php",
    "/contact": "contact.php"

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
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : "/" + endpoint;

    // Pisahkan query string dari path
    const [pathSaja, queryString] = cleanEndpoint.split("?");

    const detailMatch = pathSaja.match(/^(.+)\/(\d+)$/);

    let apiEndpoint = pathSaja;
    let detailId = null;

    if (detailMatch) {
        apiEndpoint = detailMatch[1];
        detailId = Number(detailMatch[2]);
    }

    const fileName = API_MAP[apiEndpoint];

    if (!fileName) {
        throw new Error("Endpoint tidak terdaftar: " + endpoint);
    }

    // --- BAGIAN INI YANG DIPERBAIKI ---
    // Jika memanggil parameter spesifik seperti category_id, abaikan default ?featured=1
    let baseFile = fileName;
    if (queryString && queryString.includes("category_id") && baseFile.includes("?featured=1")) {
        baseFile = baseFile.split("?")[0];
    }

    // Gabungkan query dari API_MAP dan dari pemanggil
    let url = BASE_URL + baseFile;
    if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
    }

    try {
        const res = await fetch(url);

        if (!res.ok) {
            console.warn(`API ${fileName} merespon status HTTP ${res.status}`);
            return null;
        }

        const json = await res.json();

        if (!json.success) {
            console.warn(`API ${fileName} mengembalikan pesan gagal:`, json.message);
            return null;
        }

        const data = perbaikiPathGambar(json.data);

        if (detailId !== null) {
            if (!Array.isArray(data)) return null;
            return data.find(item => Number(item.id) === detailId) || null;
        }

        if (apiEndpoint === "/cafe" && Array.isArray(data)) {
            return data.length ? data[0] : null;
        }

        return data;
    } catch (err) {
        console.error(`Gagal koneksi ke endpoint ${endpoint}:`, err);
        return null;
    }
}