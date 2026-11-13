/**
 * ====================================================================
 * Logika Halaman Reservasi Café Ácala & Eatery
 * Story FE: Galeri Area, Form Validasi, Jam Operasional,
 *           Pop-up Peringatan & Konfirmasi WhatsApp
 * ====================================================================
 */
"use strict";

// Nomor WhatsApp Resmi Café Ácala
const NOMOR_WA_CAFE = '6281234567890';

// Zona waktu acuan (WIB)
const ZONA_WAKTU = 'Asia/Jakarta';

// Data Cadangan / Prototipe Sesuai Figma & Desain UI/UX
const DEFAULT_AREAS = [
  { id: 1, nama: "Indoor Depan Kasir Lantai 1", foto: "assets/area-Indoor.png" },
  { id: 2, nama: "Indoor Tertutup Lantai 1", foto: "assets/area-Indoor-VIP.png" },
  { id: 3, nama: "Outdoor Lantai 1", foto: "assets/area-Outdoor.png" },
  { id: 4, nama: "Outdoor Lantai 2", foto: "assets/area-Outdoor-Lantai-2.png" }
];

const DEFAULT_JAM_OPERASIONAL = {
  0: { hari: "Minggu", buka: "10:00", tutup: "22:00", is_closed: 0 },
  1: { hari: "Senin", buka: "10:00", tutup: "22:00", is_closed: 0 },
  2: { hari: "Selasa", buka: "10:00", tutup: "22:00", is_closed: 0 },
  3: { hari: "Rabu", buka: "10:00", tutup: "22:00", is_closed: 0 },
  4: { hari: "Kamis", buka: "10:00", tutup: "22:00", is_closed: 0 },
  5: { hari: "Jumat", buka: "10:00", tutup: "23:00", is_closed: 0 },
  6: { hari: "Sabtu", buka: "10:00", tutup: "23:00", is_closed: 0 }
};

const DEFAULT_ATURAN = [
  {
    id: 1,
    judul: "Pesan lebih awal",
    isi: "Minimal 2 jam sebelum kedatangan, maksimal 30 hari sebelumnya."
  },
  {
    id: 2,
    judul: "Toleransi 15 menit",
    isi: "Apabila terdapat perubahan jumlah pengunjung, pelanggan diharapkan menginformasikannya kepada pihak Cafe Acala melalui WhatsApp."
  },
  {
    id: 3,
    judul: "Jumlah orang",
    isi: "Kapasitas maksimal untuk setiap area adalah 15 orang untuk Private Room, 10 orang untuk area Indoor depan kasir, 12 orang untuk area Outdoor Lantai 2, dan 20 orang untuk area Outdoor Lantai 1."
  },
  {
    id: 4,
    judul: "Deposit",
    isi: "Apabila pelanggan tidak dapat menghadiri reservasi yang telah disepakati, pelanggan diperbolehkan melakukan konfirmasi pengunduran jadwal satu kali melalui WhatsApp."
  },
  {
    id: 5,
    judul: "Durasi duduk",
    isi: "Apabila pelanggan ingin mengubah tanggal dan waktu reservasi, pelanggan diharapkan menginformasikannya kepada pihak Café Acala melalui WhatsApp setidaknya 24 jam sebelum waktu reservasi awal, disesuaikan dengan ketersediaan meja."
  },
  {
    id: 6,
    judul: "Perubahan & pembatalan",
    isi: "Pelanggan yang ingin melakukan cancel reservasi, uang tidak dapat dikembalikan namun dapat dijadwalkan ulang 1 kali dalam kurun waktu 1 bulan."
  },
  {
    id: 7,
    judul: "Perubahan & pembatalan",
    isi: "Apabila pelanggan belum hadir hingga 15 menit setelah jam yang telah disepakati dan tidak ada konfirmasi atau pesan belum dibalas pihak Acala, maka reservasi dianggap batal."
  }
];

// State Global
let areaListGlobal = [];
let jamOperasionalData = {};
let aturanListGlobal = [];
let isAturanExpanded = false;
let indeksFotoAktif = 0;
let pendingWhatsAppUrl = '';
let pendingMessageText = '';
let isAreaLoadFailed = false;
let isJamLoadFailed = false;

// Format Hari dalam Bahasa Indonesia
const NAMA_HARI_INDONESIA = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
];

const NAMA_BULAN_INDONESIA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/* ====================================================================
   INISIALISASI HALAMAN
   ==================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  InisialisasiFloatingWA();
  SetMinMaxTanggal();
  PasangEventForm();
  PasangNavigasiKeyboard();

  // Muat data dari API atau fallback
  MuatDataAreaReservasi();
  MuatDataJamOperasional();
  MuatDataAturanReservasi();
});

function InisialisasiFloatingWA() {
  const waBtn = document.getElementById('floating-wa-btn');
  if (waBtn) {
    waBtn.href = `https://wa.me/${NOMOR_WA_CAFE}?text=` + encodeURIComponent('Halo Admin Café Ácala, saya ingin bertanya seputar reservasi meja.');
  }
}

/**
 * Tanggal (YYYY-MM-DD) menurut WIB, digeser sejumlah hari dari hari ini.
 * offsetHari = 0 -> hari ini (WIB), 1 -> besok (WIB), dst.
 */
function tanggalWIB(offsetHari = 0) {
  const hariIniWIB = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_WAKTU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()); // format YYYY-MM-DD

  const [y, m, d] = hariIniWIB.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetHari));
  return dt.toISOString().slice(0, 10);
}

/**
 * Atur batas tanggal: hanya mulai BESOK (acuan WIB); hari ini dan
 * sebelumnya nonaktif (tidak dapat diklik). Maksimal 30 hari ke depan.
 */
function SetMinMaxTanggal() {
  const inputTanggal = document.getElementById('tanggal');
  if (!inputTanggal) return;

  inputTanggal.min = tanggalWIB(1);
  inputTanggal.max = tanggalWIB(30);
}

function formatYYYYMMDD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pasang Event Listener Form & Input Real-time
 */
function PasangEventForm() {
  const formEl = document.getElementById('formReservasiAcala');
  if (formEl) {
    formEl.addEventListener('submit', HandleSubmitReservasi);
  }

  const inputTanggal = document.getElementById('tanggal');
  if (inputTanggal) {
    inputTanggal.addEventListener('change', HandlePerubahanTanggal);
  }

  // Bersihkan pesan error saat pengguna mulai mengetik / memilih
  ['nama', 'whatsapp', 'tanggal', 'jam', 'areaSelect', 'jumlah'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => BersihkanErrorField(id));
      el.addEventListener('change', () => BersihkanErrorField(id));
    }
  });
}

function PasangNavigasiKeyboard() {
  document.addEventListener('keydown', (e) => {
    const modalFoto = document.getElementById('modalFotoBesar');
    if (modalFoto && modalFoto.style.display !== 'none') {
      if (e.key === 'Escape') tutupModalFotoBesar();
      else if (e.key === 'ArrowLeft') geserFotoModal(-1);
      else if (e.key === 'ArrowRight') geserFotoModal(1);
    }

    const modalKosong = document.getElementById('modalFormKosong');
    if (modalKosong && modalKosong.style.display !== 'none' && e.key === 'Escape') {
      tutupModalFormKosong();
    }

    const modalKonfirmasi = document.getElementById('modalKonfirmasiWA');
    if (modalKonfirmasi && modalKonfirmasi.style.display !== 'none' && e.key === 'Escape') {
      tutupModalKonfirmasiWA();
    }

    const modalAturan = document.getElementById('modalAturan');
    if (modalAturan && modalAturan.style.display !== 'none' && e.key === 'Escape') {
      tutupModalAturan();
    }
  });
}

/* ====================================================================
   CARD 12.2.1: MUAT DATA AREA RESERVASI & GALERI POLAROID
   ==================================================================== */
async function MuatDataAreaReservasi(forceError = false) {
  const skeleton = document.getElementById('areaSkeletonContainer');
  const errorAlert = document.getElementById('areaErrorAlert');
  const gallery = document.getElementById('areaGalleryContainer');
  const container = document.getElementById('dynamicAreaCards');
  const selectArea = document.getElementById('areaSelect');
  const btnSubmit = document.getElementById('btnSubmitReservasi');

  // Reset state ke loading (tampilkan skeleton)
  if (skeleton) skeleton.style.display = 'block';
  if (errorAlert) errorAlert.style.display = 'none';
  if (gallery) gallery.style.display = 'none';

  // Periksa apakah ada simulasi error via parameter URL (contoh: ?error=area)
  const urlParams = new URLSearchParams(window.location.search);
  const simulasiGagal = forceError || urlParams.get('error') === 'area';

  try {
    // Delay minimum 400ms agar skeleton terlihat mulus sesuai standar UX
    await new Promise((r) => setTimeout(r, 450));

    if (simulasiGagal) {
      throw new Error("Simulasi kegagalan memuat area reservasi");
    }

    let dataArea = null;
    try {
      const response = await fetchData("/area");
      if (Array.isArray(response)) {
        dataArea = response;
      } else if (response && Array.isArray(response.data)) {
        dataArea = response.data;
      } else if (response && typeof response === 'object') {
        dataArea = Object.values(response).find(val => Array.isArray(val)) || null;
      }
    } catch (e) {
      console.warn("Backend /area tidak dapat diakses secara langsung:", e);
    }

    // Jika API belum tersedia atau kosong pada lingkungan lokal, gunakan aset prototipe Figma
    if (!dataArea || dataArea.length === 0) {
      dataArea = DEFAULT_AREAS;
    }

    isAreaLoadFailed = false;
    areaListGlobal = dataArea;

    // Sembunyikan skeleton dan tampilkan galeri scrapbook
    if (skeleton) skeleton.style.display = 'none';
    if (gallery) gallery.style.display = 'block';

    // Render kartu polaroid scrapbook (4 kartu atau dinamis)
    if (container) {
      const classesPosisi = ['p-1', 'p-2', 'p-3', 'p-4'];
      container.innerHTML = dataArea.map((area, index) => {
        const kelasPosisi = classesPosisi[index % classesPosisi.length];
        const fotoSrc = urlGambar(area.foto || area.gambar);
        const namaArea = esc(area.nama || `Area ${index + 1}`);

        // Cek simulasi foto hilang via parameter ?error=photo
        const fotoHilang = urlParams.get('error') === 'photo' || !fotoSrc;

return `
  <div class="polaroid-card ${kelasPosisi}" onclick="bukaModalFotoBesar(${index})" tabindex="0" role="button" aria-label="Buka foto ${namaArea}">
    <div class="tape" aria-hidden="true"></div>
    <div class="polaroid-img-wrap">
      <img src="${fotoSrc || '../assets/placeholder-reservasi.png'}" alt="${namaArea}" onerror="this.onerror=null; this.src='assets/placeholder-reservasi.png';" loading="lazy">
    </div>
    <p class="polaroid-caption">${formatCaptionNama(namaArea)}</p>
  </div>
`;
      }).join('');
    }

    // Isi pilihan dropdown Area Reservasi
    if (selectArea) {
      selectArea.innerHTML = '<option value="">Pilih Area</option>' + 
        dataArea.map(a => `<option value="${esc(a.nama)}">${esc(a.nama)}</option>`).join('');
      selectArea.disabled = false;
    }

    if (btnSubmit) {
      btnSubmit.disabled = false;
    }

  } catch (error) {
    console.error("Gagal memuat area reservasi:", error);
    isAreaLoadFailed = true;

    // Tampilkan pesan error dan skeleton tetap terlihat, nonaktifkan dropdown & form submit
    if (skeleton) skeleton.style.display = 'block';
    if (gallery) gallery.style.display = 'none';
    if (errorAlert) errorAlert.style.display = 'block';

    if (selectArea) {
      selectArea.innerHTML = '<option value="">Gagal memuat data area</option>';
      selectArea.disabled = true;
    }

    TampilkanErrorField('areaSelect', 'Gagal memuat area dari server. Form tidak dapat dikirim.');
    if (btnSubmit) {
      btnSubmit.disabled = true;
    }
  }
}

/**
 * Tangani jika foto area gagal memuat (404/broken) tanpa menghilangkan informasi kartu
 */
function tanganiErrorFotoPolaroid(imgElement, namaArea) {
  const wrapper = imgElement.closest('.polaroid-img-wrap');
  if (wrapper) {
    wrapper.innerHTML = `
      <div class="polaroid-placeholder-wrap" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #8A8F88; background: #1A281E; padding: 10px; text-align: center;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <span style="font-size: 11px; margin-top: 6px;">Foto ${namaArea} gagal dimuat</span>
      </div>
    `;
  }
}

function formatCaptionNama(nama) {
  if (!nama) return '';
  // Potong pada kata "Lantai" agar baris rapi seperti desain referensi
  if (nama.includes("Lantai") && !nama.includes("<br>")) {
    return nama.replace("Lantai", "<br>Lantai");
  }
  return nama;
}

/* ====================================================================
   CARD 12.2.3: MUAT DATA JAM OPERASIONAL
   ==================================================================== */
async function MuatDataJamOperasional(forceError = false) {
  const urlParams = new URLSearchParams(window.location.search);
  const simulasiGagal = forceError || urlParams.get('error') === 'jam';

  try {
    if (simulasiGagal) {
      throw new Error("Simulasi kegagalan memuat jam operasional");
    }

    const res = await fetchData("/operating-hours");
    if (res && Array.isArray(res) && res.length > 0) {
      res.forEach((item, idx) => {
        const dayIdx = item.day !== undefined ? Number(item.day) : idx;
        jamOperasionalData[dayIdx] = {
          hari: item.hari || NAMA_HARI_INDONESIA[dayIdx],
          buka: item.jam_buka ? item.jam_buka.substring(0, 5) : "10:00",
          tutup: item.jam_tutup ? item.jam_tutup.substring(0, 5) : "22:00",
          is_closed: item.is_closed ? 1 : 0
        };
      });
    } else {
      jamOperasionalData = { ...DEFAULT_JAM_OPERASIONAL };
    }
    isJamLoadFailed = false;

  } catch (e) {
    console.error("Gagal memuat jam operasional:", e);
    // Jika ada simulasi atau error sesungguhnya
    if (simulasiGagal) {
      isJamLoadFailed = true;
      jamOperasionalData = {};
      const selectJam = document.getElementById('jam');
      if (selectJam) {
        selectJam.innerHTML = '<option value="">Gagal memuat jam</option>';
        selectJam.disabled = true;
      }
      TampilkanErrorField('jam', 'Gagal memuat data jam operasional.');
      const btnSubmit = document.getElementById('btnSubmitReservasi');
      if (btnSubmit) btnSubmit.disabled = true;
    } else {
      // Fallback jam operasional normal
      jamOperasionalData = { ...DEFAULT_JAM_OPERASIONAL };
      isJamLoadFailed = false;
    }
  }
}

/* ====================================================================
   CARD 12.3.3: MUAT DATA ATURAN RESERVASI & INTERAKSI SELENGKAPNYA
   - Awal: 3 aturan pertama + tombol "Selengkapnya"
   - Setelah "Selengkapnya" diklik: seluruh aturan tampil dan tombol
     hilang (tidak ada tombol untuk kembali ke tampilan awal)
   ==================================================================== */
async function MuatDataAturanReservasi() {
  const modalBody = document.getElementById('modalAturanBody');

  let rules = null;
  try {
    const res = await fetchData("/reservation-rule");
    if (Array.isArray(res)) rules = res;
    else if (res && Array.isArray(res.data)) rules = res.data;
  } catch (err) {
    console.warn("Backend /reservation-rule tidak tersedia, menggunakan fallback:", err);
  }

  if (!rules || rules.length === 0) {
    rules = DEFAULT_ATURAN;
  }

  aturanListGlobal = rules;
  renderAturan();

  // Render modal aturan lengkap (jika dipanggil terpisah)
  if (modalBody) {
    modalBody.innerHTML = rules.map((r, i) => `
      <div class="mb-3 pb-2 border-bottom border-light-subtle">
        <h5 class="fw-bold mb-1" style="color: #1F2E22;">${i + 1}. ${esc(r.judul)}</h5>
        <p class="text-secondary mb-0">${esc(r.isi)}</p>
      </div>
    `).join('');
  }
}

/**
 * Render aturan di dalam card Aturan Reservasi
 * (3 aturan saat awal, semua aturan setelah "Selengkapnya" diklik)
 */
function renderAturan() {
  const container = document.getElementById('rulesPreviewContainer');
  const btnToggle = document.getElementById('btnToggleAturan');
  const btnWrapper = document.getElementById('rulesBtnWrapper');
  const cardAturan = document.getElementById('cardAturanReservasi');

  if (!container) return;

  const rulesToShow = isAturanExpanded ? aturanListGlobal : aturanListGlobal.slice(0, 3);

  container.innerHTML = rulesToShow.map((r, i) => `
    <div class="rules-item-row">
      <div class="rules-badge-num">${i + 1}</div>
      <div class="rules-content-body">
        <div class="rules-item-heading">${esc(r.judul)}</div>
        <p class="rules-item-text">${esc(r.isi)}</p>
      </div>
    </div>
  `).join('');

  // Tombol hanya tampil pada kondisi awal. Setelah diperluas, tombol hilang
  // dan tidak ada kontrol untuk kembali ke tampilan awal.
  if (btnWrapper) btnWrapper.style.display = isAturanExpanded ? 'none' : 'flex';
  if (btnToggle) btnToggle.setAttribute('aria-expanded', String(isAturanExpanded));
  if (cardAturan) cardAturan.classList.toggle('expanded', isAturanExpanded);
}

/**
 * Tombol "Selengkapnya": tampilkan seluruh aturan (satu arah, tanpa kembali)
 */
function ekspansiAturan() {
  if (isAturanExpanded) return;
  isAturanExpanded = true;
  renderAturan();
}

function bukaModalAturan() {
  const modal = document.getElementById('modalAturan');
  if (modal) modal.style.display = 'flex';
}

function tutupModalAturan() {
  const modal = document.getElementById('modalAturan');
  if (modal) modal.style.display = 'none';
}

/* ====================================================================
   LOGIKA PERUBAHAN TANGGAL & PENYUSUNAN WAKTU KUNJUNGAN
   - Nama hari di bawah tanggal
   - Jam menyesuaikan jam operasional hari terpilih (interval 1 jam)
   - Tanggal hanya mulai besok, sehingga seluruh jam operasional tersedia
   - Menangani hari libur / kafe tutup
   ==================================================================== */
function HandlePerubahanTanggal(e) {
  const tglVal = e.target.value;
  const selectJam = document.getElementById('jam');
  const namaHariDisplay = document.getElementById('namaHariDisplay');
  const btnSubmit = document.getElementById('btnSubmitReservasi');

  BersihkanErrorField('tanggal');
  BersihkanErrorField('jam');

  if (!tglVal) {
    if (namaHariDisplay) namaHariDisplay.innerText = 'Pilih tanggal reservasi';
    if (selectJam) {
      selectJam.innerHTML = '<option value="">Pilih Jam</option>';
      selectJam.disabled = true;
    }
    return;
  }

  // Konversi tanggal yang dipilih
  const dateObj = new Date(tglVal + 'T00:00:00');
  const hariIndex = dateObj.getDay(); // 0 = Minggu, 1 = Senin, ...
  const namaHari = NAMA_HARI_INDONESIA[hariIndex];
  const tgl = dateObj.getDate();
  const namaBulan = NAMA_BULAN_INDONESIA[dateObj.getMonth()];
  const tahun = dateObj.getFullYear();

  // Tampilkan Nama Hari di Bawah Tanggal
  if (namaHariDisplay) {
    namaHariDisplay.innerText = `${namaHari}, ${tgl} ${namaBulan} ${tahun}`;
  }

  if (!selectJam) return;

  // Cek apakah data jam operasional gagal dimuat
  if (isJamLoadFailed) {
    selectJam.innerHTML = '<option value="">Gagal memuat jam</option>';
    selectJam.disabled = true;
    TampilkanErrorField('jam', 'Gagal memuat data jam operasional.');
    if (btnSubmit) btnSubmit.disabled = true;
    return;
  }

  // Ambil jadwal operasional hari tersebut
  const jadwalHari = jamOperasionalData[hariIndex] || DEFAULT_JAM_OPERASIONAL[hariIndex] || { buka: "10:00", tutup: "22:00", is_closed: 0 };

  // Kondisi: Kafe Tutup pada hari tersebut
  if (jadwalHari.is_closed) {
    selectJam.innerHTML = `<option value="">Kafe Tutup</option>`;
    selectJam.disabled = true;
    TampilkanErrorField('jam', `Kafe tutup pada hari ${namaHari}. Silakan pilih tanggal lain.`);
    return;
  }

  // Jam buka dan tutup
  const jamBukaNum = parseInt(jadwalHari.buka.split(':')[0], 10);
  const jamTutupNum = parseInt(jadwalHari.tutup.split(':')[0], 10);

  // Pilihan waktu berinterval 1 jam, dari jam buka sampai sebelum jam tutup
  const daftarWaktuTersedia = [];
  for (let h = jamBukaNum; h < jamTutupNum; h++) {
    daftarWaktuTersedia.push(`${String(h).padStart(2, '0')}:00 WIB`);
  }

  if (daftarWaktuTersedia.length === 0) {
    selectJam.innerHTML = `<option value="">Tidak ada waktu tersedia</option>`;
    selectJam.disabled = true;
    TampilkanErrorField('jam', 'Tidak ada waktu tersedia pada tanggal ini. Silakan pilih tanggal lain.');
    return;
  }

  // Aktifkan pilihan jam (pilihan sebelumnya otomatis direset saat tanggal diganti)
  selectJam.disabled = false;
  selectJam.innerHTML = '<option value="">Pilih Jam</option>' + 
    daftarWaktuTersedia.map(w => `<option value="${w}">${w}</option>`).join('');
}

/* ====================================================================
   VALIDASI FORM FRONT-END & PENANGANAN PENGIRIMAN
   ==================================================================== */
async function HandleSubmitReservasi(event) {
  event.preventDefault();

  const nama = document.getElementById('nama')?.value.trim() || '';
  const whatsapp = document.getElementById('whatsapp')?.value.trim() || '';
  const tanggal = document.getElementById('tanggal')?.value || '';
  const jam = document.getElementById('jam')?.value || '';
  const area = document.getElementById('areaSelect')?.value || '';
  const jumlahVal = document.getElementById('jumlah')?.value.trim() || '';
  const catatan = document.getElementById('catatan')?.value.trim() || '';
  const btnSubmit = document.getElementById('btnSubmitReservasi');

  // Bersihkan semua error visual
  BersihkanSemuaError();

  // 1. KONDISI: Seluruh field kosong -> Tampilkan pop-up peringatan tanpa membuka WhatsApp
  const seluruhFieldKosong = !nama && !whatsapp && !tanggal && !jam && !area && (!jumlahVal || jumlahVal === '');
  if (seluruhFieldKosong) {
    bukaModalFormKosong();
    return;
  }

  // 2. KONDISI: Sebagian field belum terisi atau tidak valid
  let isValid = true;
  let firstInvalidEl = null;

  // Validasi Nama: wajib, minimal 2 karakter
  if (!nama) {
    TampilkanErrorField('nama', 'Nama pemesan wajib diisi.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('nama');
  } else if (nama.length < 2) {
    TampilkanErrorField('nama', 'Nama pemesan minimal 2 karakter.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('nama');
  }

  // Validasi Nomor WhatsApp: format nomor Indonesia (diawali 08 / 628 / +628, 10-15 digit)
  const regexWAIndo = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;
  if (!whatsapp) {
    TampilkanErrorField('whatsapp', 'Nomor telepon / WhatsApp wajib diisi.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('whatsapp');
  } else if (!regexWAIndo.test(whatsapp.replace(/[\s-]/g, ''))) {
    TampilkanErrorField('whatsapp', 'Format nomor WhatsApp tidak valid (contoh: 08123456789).');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('whatsapp');
  }

  // Validasi Tanggal: wajib, mulai besok (acuan WIB), maksimal 30 hari ke depan
  const besokStr = tanggalWIB(1);
  const maksStr = tanggalWIB(30);
  if (!tanggal) {
    TampilkanErrorField('tanggal', 'Tanggal kunjungan wajib dipilih.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('tanggal');
  } else if (tanggal < besokStr) {
    TampilkanErrorField('tanggal', 'Tanggal minimal mulai besok. Hari ini dan sebelumnya tidak dapat dipilih.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('tanggal');
  } else if (tanggal > maksStr) {
    TampilkanErrorField('tanggal', 'Tanggal maksimal 30 hari dari sekarang.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('tanggal');
  }

  // Validasi Waktu: wajib dipilih
  if (!jam) {
    TampilkanErrorField('jam', 'Jam kedatangan wajib dipilih.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('jam');
  }

  // Validasi Jumlah Pengunjung: bilangan bulat minimal 1
  const jumlahNum = parseInt(jumlahVal, 10);
  if (!jumlahVal || isNaN(jumlahNum) || jumlahNum < 1 || String(jumlahNum) !== jumlahVal) {
    TampilkanErrorField('jumlah', 'Jumlah pengunjung harus berupa bilangan bulat minimal 1.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('jumlah');
  }

  // Validasi Area: wajib dipilih
  if (isAreaLoadFailed) {
    TampilkanErrorField('areaSelect', 'Area reservasi gagal dimuat. Form tidak dapat dikirim.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('areaSelect');
  } else if (!area) {
    TampilkanErrorField('areaSelect', 'Area reservasi wajib dipilih.');
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById('areaSelect');
  }

  if (!isValid) {
    if (firstInvalidEl) {
      firstInvalidEl.focus();
      firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  // 3. KONDISI: Data lengkap dan valid
  // Tampilkan loading sekitar 2 detik pada tombol "SUBMIT" dan nonaktifkan agar tidak ditekan berulang
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>MEMPROSES...`;
  }

  // Siapkan data pesan WhatsApp
  const dateObj = new Date(tanggal + 'T00:00:00');
  const namaHari = NAMA_HARI_INDONESIA[dateObj.getDay()];
  const tglFormatted = `${namaHari}, ${dateObj.getDate()} ${NAMA_BULAN_INDONESIA[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  pendingMessageText = `Halo Admin Café Ácala & Eatery, saya ingin mengajukan reservasi meja dengan rincian:

• Nama Pemesan: ${nama}
• Nomor WhatsApp: ${whatsapp}
• Hari & Tanggal: ${tglFormatted}
• Jam Kedatangan: ${jam}
• Jumlah Tamu: ${jumlahNum} Orang
• Area Reservasi: ${area}
• Catatan Khusus: ${catatan || '-'}`;

  pendingWhatsAppUrl = `https://wa.me/${NOMOR_WA_CAFE}?text=` + encodeURIComponent(pendingMessageText);

  // Jeda loading 2 detik sebelum pop-up konfirmasi muncul
  setTimeout(() => {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `SUBMIT`;
    }
    // Tampilkan Pop-Up Konfirmasi dengan tombol "OK"
    bukaModalKonfirmasiWA();
  }, 2000);
}

/* ====================================================================
   POP-UP KONFIRMASI WHATSAPP & LOADING BAR SETELAH "OK"
   ==================================================================== */
function bukaModalKonfirmasiWA() {
  const modal = document.getElementById('modalKonfirmasiWA');
  const btnWrap = document.getElementById('konfirmasiBtnWrap');
  const loadingWrap = document.getElementById('konfirmasiLoadingWrap');
  const progressBar = document.getElementById('waProgressBar');

  if (btnWrap) btnWrap.style.display = 'block';
  if (loadingWrap) loadingWrap.style.display = 'none';
  if (progressBar) progressBar.style.width = '0%';

  if (modal) modal.style.display = 'flex';
}

function tutupModalKonfirmasiWA() {
  const modal = document.getElementById('modalKonfirmasiWA');
  if (modal) modal.style.display = 'none';
}

/**
 * Pelanggan menekan OK pada pop-up konfirmasi:
 * Tampilkan loading bar, lalu buka WhatsApp dengan pesan terisi, pertahankan isian form
 */
function handleKonfirmasiOK() {
  const btnWrap = document.getElementById('konfirmasiBtnWrap');
  const loadingWrap = document.getElementById('konfirmasiLoadingWrap');
  const progressBar = document.getElementById('waProgressBar');

  // Sembunyikan tombol OK dan tampilkan loading bar
  if (btnWrap) btnWrap.style.display = 'none';
  if (loadingWrap) loadingWrap.style.display = 'block';

  // Animasi loading bar berjalan ke 100%
  setTimeout(() => {
    if (progressBar) progressBar.style.width = '100%';
  }, 50);

  // Setelah loading bar selesai (sekitar 1.2 detik), buka WhatsApp
  setTimeout(() => {
    tutupModalKonfirmasiWA();

    // Buka tautan WhatsApp di tab baru tanpa API BE
    window.open(pendingWhatsAppUrl, '_blank');

    // Tampilkan Card Fallback di bawah form (jika WhatsApp diblokir popup blocker atau tidak terbuka)
    TampilkanWAFallback(pendingWhatsAppUrl, pendingMessageText);

    // Isian form TETAP ADA / tidak di-reset sesuai spesifikasi
  }, 1300);
}

/**
 * Tampilkan Fallback jika WhatsApp tidak terbuka otomatis
 */
function TampilkanWAFallback(waUrl, messageText) {
  const container = document.getElementById('waFallbackContainer');
  const btnDirect = document.getElementById('btnBukaWALangsung');
  const previewText = document.getElementById('waMessagePreviewText');

  if (container) container.style.display = 'block';
  if (btnDirect) btnDirect.href = waUrl;
  if (previewText) previewText.textContent = messageText;

  // Scroll halus ke arah container fallback
  container?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function salinPesanWA() {
  if (!pendingMessageText) return;

  navigator.clipboard.writeText(pendingMessageText).then(() => {
    const badge = document.getElementById('copyAlertSuccess');
    if (badge) {
      badge.style.display = 'block';
      setTimeout(() => { badge.style.display = 'none'; }, 3000);
    }
  }).catch(() => {
    alert("Silakan salin teks pesan secara manual.");
  });
}

/* ====================================================================
   POP-UP PERINGATAN FORM KOSONG
   ==================================================================== */
function bukaModalFormKosong() {
  const modal = document.getElementById('modalFormKosong');
  if (modal) modal.style.display = 'flex';
}

function tutupModalFormKosong() {
  const modal = document.getElementById('modalFormKosong');
  if (modal) modal.style.display = 'none';

  // Arahkan kursor ke input pertama
  const inputNama = document.getElementById('nama');
  if (inputNama) inputNama.focus();
}

/* ====================================================================
   CARD 12.4.3: POP-UP FOTO AREA BESAR (LIGHTBOX)
   ==================================================================== */
function bukaModalFotoBesar(index) {
  indeksFotoAktif = index;
  updateKontenModalFoto();
  const modal = document.getElementById('modalFotoBesar');
  if (modal) modal.style.display = 'flex';
}

function tutupModalFotoBesar() {
  const modal = document.getElementById('modalFotoBesar');
  if (modal) modal.style.display = 'none';
}

function geserFotoModal(arah) {
  if (!areaListGlobal || areaListGlobal.length === 0) return;
  indeksFotoAktif += arah;
  if (indeksFotoAktif < 0) {
    indeksFotoAktif = areaListGlobal.length - 1;
  } else if (indeksFotoAktif >= areaListGlobal.length) {
    indeksFotoAktif = 0;
  }
  updateKontenModalFoto();
}

function updateKontenModalFoto() {
  const area = areaListGlobal[indeksFotoAktif];
  if (!area) return;

  const captionEl = document.getElementById('lightboxCaption');
  const imgEl = document.getElementById('lightboxImg');
  const placeholderEl = document.getElementById('lightboxPlaceholder');

  const namaArea = area.nama || `Area ${indeksFotoAktif + 1}`;
  if (captionEl) {
    captionEl.textContent = `${namaArea} (${indeksFotoAktif + 1} dari ${areaListGlobal.length})`;
  }

  const fotoSrc = urlGambar(area.foto || area.gambar);
  const urlParams = new URLSearchParams(window.location.search);
  const simulasiFotoHilang = urlParams.get('error') === 'photo';

  if (fotoSrc && !simulasiFotoHilang) {
    imgEl.src = fotoSrc;
    imgEl.alt = namaArea;
    imgEl.style.display = 'block';
    if (placeholderEl) placeholderEl.style.display = 'none';

    imgEl.onerror = () => {
      imgEl.style.display = 'none';
      if (placeholderEl) placeholderEl.style.display = 'flex';
    };
  } else {
    imgEl.style.display = 'none';
    if (placeholderEl) placeholderEl.style.display = 'flex';
  }
}

/* ====================================================================
   UTILITAS ERROR & TAMPILAN
   ==================================================================== */
function TampilkanErrorField(fieldId, pesan) {
  const el = document.getElementById(fieldId);
  const errEl = document.getElementById('error-' + fieldId);
  if (el) el.classList.add('is-invalid');
  if (errEl) {
    errEl.innerText = pesan;
    errEl.classList.add('aktif');
  }
}

function BersihkanErrorField(fieldId) {
  const el = document.getElementById(fieldId);
  const errEl = document.getElementById('error-' + fieldId);
  if (el) el.classList.remove('is-invalid');
  if (errEl) {
    errEl.innerText = '';
    errEl.classList.remove('aktif');
  }
}

function BersihkanSemuaError() {
  ['nama', 'whatsapp', 'tanggal', 'jam', 'areaSelect', 'jumlah'].forEach(BersihkanErrorField);
}

function urlGambar(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.startsWith("uploads/") ? "../backend/" + path : path;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ====================================================================
   FUNGSI BANTUAN PENGUJIAN SQA (Bisa diakses dari Console Browser)
   ==================================================================== */
window.testErrorArea = function(enable = true) {
  MuatDataAreaReservasi(enable);
};

window.testErrorJam = function(enable = true) {
  MuatDataJamOperasional(enable);
  HandlePerubahanTanggal({ target: document.getElementById('tanggal') });
};

window.bukaModalFormKosong = bukaModalFormKosong;
window.bukaModalKonfirmasiWA = bukaModalKonfirmasiWA;
window.bukaModalFotoBesar = bukaModalFotoBesar;
window.bukaModalAturan = bukaModalAturan;
window.ekspansiAturan = ekspansiAturan;