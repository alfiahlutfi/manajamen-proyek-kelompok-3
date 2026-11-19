const BASE_URL   = "../backend/api/";   // folder file PHP API
const BASE_ASSET = "../backend/";       // folder yang berisi "uploads/" (lihat tabel di atas)

const API_MAP = {
    "/cafe": "cafe",
    "/menu": "menu?featured=1",
    "/gallery": "gallery",
    "/area": "area",
    "/events": "event",
    "/carousel": "carousel",
    "/faqs": "faq",
    "/menu-category": "menu_category",
    "/operating-hours": "operating_hours",
    "/lokasi": "location",
    "/reservasi": "reservation",
    "/contact": "contact",
    "/reservation-rule": "reservation_rule"

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


// ======================================================
// POP-UP DETAIL MENU (FRONTEND FETCH LANGSUNG)
// ======================================================

async function bukaDetailMenu(menuId) {
  if (!menuId) {
    console.error("ID Menu tidak valid.");
    return;
  }

  const modal = document.getElementById('menuDetailModal');
  const badgeContainer = document.getElementById('modalBadgeContainer');
  const labelElement = document.getElementById('modalMenuLabel');
  
  const skelImg = document.getElementById('modalSkeletonImg');
  const skelName = document.getElementById('modalSkeletonName');
  const skelPrice = document.getElementById('modalSkeletonPrice');
  const skelDesc = document.getElementById('modalSkeletonDesc');

  const imgElement = document.getElementById('modalMenuImg');
  const placeholder = document.getElementById('modalImgPlaceholder');
  const nameElement = document.getElementById('modalMenuName');
  const priceElement = document.getElementById('modalMenuPrice');
  const descElement = document.getElementById('modalMenuDesc');
  const errorMsg = document.getElementById('modalErrorMessage');
  
  // 1. Tampilkan modal & set kondisi awal (Skeleton wajib tampil)
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  
  skelImg.style.display = 'block';
  skelName.style.display = 'block';
  skelPrice.style.display = 'block';
  skelDesc.style.display = 'block';

  imgElement.style.display = 'none';
  placeholder.style.display = 'none';
  nameElement.style.display = 'none';
  priceElement.style.display = 'none';
  descElement.style.display = 'none';
  errorMsg.style.display = 'none';
  badgeContainer.style.display = 'none';

  try {
    // Gunakan fungsi fetchData yang sudah ada, 
    // karena helper ini sudah otomatis menangani BASE_URL dan membersihkan ?featured=1
    const data = await fetchData(`/menu?id=${menuId}`);

    if (!data) throw new Error("Gagal memuat detail menu dari database");

    // Sembunyikan skeleton bagian teks
    skelImg.style.display = 'none';
    skelName.style.display = 'none';
    skelPrice.style.display = 'none';
    skelDesc.style.display = 'none';

    // Munculkan badge HANYA JIKA ada label dari database
    const badgeText = ambilBadge(data.label);
    if (badgeText) {
      labelElement.textContent = badgeText;
      badgeContainer.style.display = 'inline-flex';
    } else {
      badgeContainer.style.display = 'none';
    }

    // Masukkan data asli ke elemen UI
    nameElement.textContent = data.nama || "";
    nameElement.style.display = 'block';

    priceElement.textContent = formatHarga(data.harga);
    priceElement.style.display = 'block';

    // Kolom deskripsi dari database
    descElement.textContent = data.deskripsi || "Deskripsi belum tersedia untuk menu ini.";
    descElement.style.display = 'block';

    // Tangani foto / placeholder
    if (data.foto) {
      imgElement.src = urlGambar(data.foto);
      imgElement.onload = () => {
        skelImg.style.display = 'none';
        imgElement.style.display = 'block';
      };
      imgElement.onerror = () => {
        skelImg.style.display = 'none';
        placeholder.style.display = 'flex';
      };
    } else {
      skelImg.style.display = 'none';
      placeholder.style.display = 'flex';
    }

  } catch (err) {
    console.error("Gagal memuat detail menu:", err);
    
    // Skeleton tetap tampil saat error sesuai ketentuan
    skelImg.style.display = 'block';
    skelName.style.display = 'block';
    skelPrice.style.display = 'block';
    skelDesc.style.display = 'block';

    imgElement.style.display = 'none';
    placeholder.style.display = 'none';
    nameElement.style.display = 'none';
    priceElement.style.display = 'none';
    descElement.style.display = 'none';
    badgeContainer.style.display = 'none';

    errorMsg.style.display = 'block';
  }
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

    let baseFile = fileName;
    
    // --- BAGIAN INI YANG HARUS DIPERBAIKI ---
    // Jika pemanggilan menyertakan parameter "id" atau "category_id", 
    // abaikan default "?featured=1" agar tidak bentrok dengan backend menu.php
    if (queryString && (queryString.includes("category_id") || queryString.includes("id")) && baseFile.includes("?featured=1")) {
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