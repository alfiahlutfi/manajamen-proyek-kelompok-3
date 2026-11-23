/**
 * ====================================================================
 * Logika Halaman Reservasi Café Ácala & Eatery
 * Story FE: Galeri Area, Form Validasi, Jam Operasional,
 *           Pop-up Peringatan & Konfirmasi WhatsApp
 * ====================================================================
 */
"use strict";

// Nomor WhatsApp Café Ácala (format internasional tanpa +).
// SATU-SATUNYA sumber: API /contact (tabel cafe), sama dengan ikon WhatsApp di footer.
// Sengaja tidak ada nomor cadangan: bila API gagal, pesan tidak dikirim ke nomor yang salah,
// melainkan pop-up "WhatsApp tidak dapat dibuka" ditampilkan.
let NOMOR_WA_CAFE = '';

// Zona waktu acuan (WIB)
const ZONA_WAKTU = 'Asia/Jakarta';

// Pemetaan nama hari dari API (Inggris) / Indonesia -> indeks JS (0 = Minggu)
const INDEKS_HARI = {
  sunday: 0, minggu: 0, monday: 1, senin: 1, tuesday: 2, selasa: 2,
  wednesday: 3, rabu: 3, thursday: 4, kamis: 4, friday: 5, jumat: 5,
  saturday: 6, sabtu: 6
};

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
let isAreaLoading = true;
let isAreaEmpty = false;
let isSubmitting = false;
let isMembukaWA = false;

// Format Hari dalam Bahasa Indonesia
const NAMA_HARI_INDONESIA = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
];

const NAMA_BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
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

  MuatNomorWhatsApp();

  // Muat data dari API. Skeleton halaman penuh dilepas begitu data area berhasil dimuat.
  // Gagal: skeleton tetap tampil, pesan + "Muat ulang" di atasnya.
  function muatAwalReservasi() {
    return MuatDataAreaReservasi().then(() => {
      if (!window.AcalaSkeleton) return;
      if (isAreaLoadFailed) AcalaSkeleton.gagal("Gagal memuat data reservasi", muatAwalReservasi);
      else AcalaSkeleton.sembunyi();
    });
  }
  muatAwalReservasi();
  MuatDataJamOperasional();
  MuatDataAturanReservasi();
});

/**
 * Ambil nomor WhatsApp cafe dari API /contact (sumber yang sama dengan footer).
 * Mengembalikan true bila nomor berhasil didapat. ?error=contact untuk simulasi gagal.
 */
async function MuatNomorWhatsApp() {
  // Status footer (window.kontakGagal) HANYA dikelola js/layout.js. Fungsi ini tidak menyentuhnya,
  // supaya hasil pemuatan kontak di footer tidak tertimpa (ke true maupun false) dari halaman ini.
  const gagalKontak = () => false;

  if (new URLSearchParams(window.location.search).get('error') === 'contact') return gagalKontak();
  try {
    const c = await fetchData('/contact');
    if (!c || typeof c !== 'object') return gagalKontak();

    const sumber = c.url_whatsapp || c.nomor_telepon || '';
    let digit = String(sumber).replace(/\D+/g, '');
    if (!digit) return false; // data kontak ada tetapi nomor WhatsApp belum diisi: bukan gagal memuat
    if (digit.startsWith('0')) digit = '62' + digit.slice(1);
    NOMOR_WA_CAFE = digit;
    InisialisasiFloatingWA();
    return true;
  } catch (e) {
    console.warn('Nomor WhatsApp dari API /contact tidak tersedia:', e);
    return gagalKontak();
  }
}

/** Tautan WhatsApp dengan pesan ter-encode; kosong bila nomor belum tersedia. */
function bangunUrlWA() {
  if (!NOMOR_WA_CAFE || !pendingMessageText) return '';
  return `https://wa.me/${NOMOR_WA_CAFE}?text=` + encodeURIComponent(pendingMessageText);
}

function InisialisasiFloatingWA() {
  const waBtn = document.getElementById('floating-wa-btn');
  if (waBtn && NOMOR_WA_CAFE) {
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
 * Atur batas tanggal: hanya mulai BESOK (acuan WIB). Hari ini dan sebelumnya
 * nonaktif (abu-abu, tidak dapat diklik di kalender).
 */
function SetMinMaxTanggal() {
  const inputTanggal = document.getElementById('tanggal');
  if (!inputTanggal) return;

  inputTanggal.min = tanggalWIB(1);
  inputTanggal.removeAttribute('max');
}

/** Tombol SUBMIT nonaktif bila data area/jam belum siap atau gagal dimuat. */
function updateSubmitState() {
  const btn = document.getElementById('btnSubmitReservasi');
  if (!btn || isSubmitting) return;
  btn.disabled = isAreaLoading || isAreaLoadFailed || isAreaEmpty || isJamLoadFailed;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    // Selama loading bar berjalan, pop-up konfirmasi tidak dapat ditutup
    if (modalKonfirmasi && modalKonfirmasi.style.display !== 'none' && e.key === 'Escape' && !isMembukaWA) {
      tutupModalKonfirmasiWA();
    }

    const modalWAGagal = document.getElementById('modalWAGagal');
    if (modalWAGagal && modalWAGagal.style.display !== 'none' && e.key === 'Escape') {
      tutupModalWAGagal();
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
  const PLACEHOLDER = 'assets/placeholder-reservasi.png';

  // Kondisi loading: skeleton tampil, form belum bisa dikirim
  isAreaLoading = true;
  isAreaLoadFailed = false;
  isAreaEmpty = false;
  if (skeleton) skeleton.style.display = 'block';
  if (errorAlert) errorAlert.style.display = 'none';
  if (gallery) gallery.style.display = 'none';
  if (selectArea) {
    selectArea.innerHTML = '<option value="">Memuat area...</option>';
    selectArea.disabled = true;
  }
  BersihkanErrorField('areaSelect');
  updateSubmitState();

  const urlParams = new URLSearchParams(window.location.search);
  const simulasiGagal = forceError || urlParams.get('error') === 'area';
  const mulai = Date.now();

  try {
    if (simulasiGagal) throw new Error('Simulasi kegagalan memuat area reservasi');

    // fetchData mengembalikan null bila request/HTTP/respons gagal
    const dataArea = await fetchData('/area');
    if (!Array.isArray(dataArea)) throw new Error('Data area gagal dimuat dari server');

    // Skeleton tampil minimal 450 ms agar tidak berkedip
    await sleep(Math.max(0, 450 - (Date.now() - mulai)));

    areaListGlobal = dataArea;
    isAreaLoading = false;
    if (skeleton) skeleton.style.display = 'none';
    if (gallery) gallery.style.display = 'block';

    // Belum ada area aktif: bukan error
    if (dataArea.length === 0) {
      isAreaEmpty = true;
      if (container) container.innerHTML = '<p class="text-center py-4 mb-0">Belum ada area reservasi yang tersedia.</p>';
      if (selectArea) {
        selectArea.innerHTML = '<option value="">Belum ada area</option>';
        selectArea.disabled = true;
      }
      updateSubmitState();
      return;
    }

    const classesPosisi = ['p-1', 'p-2', 'p-3', 'p-4'];
    if (container) {
      container.innerHTML = dataArea.map((area, index) => {
        const kelasPosisi = classesPosisi[index % classesPosisi.length];
        const namaArea = esc(area.nama || `Area ${index + 1}`);
        // Foto null / simulasi ?error=photo -> placeholder
        const fotoSrc = urlParams.get('error') === 'photo' ? '' : urlGambar(area.foto);

        return `
  <div class="polaroid-card ${kelasPosisi}" onclick="bukaModalFotoBesar(${index})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();bukaModalFotoBesar(${index});}" tabindex="0" role="button" aria-label="Buka foto ${namaArea}">
    <div class="tape" aria-hidden="true"></div>
    <div class="polaroid-img-wrap">
      <img src="${esc(fotoSrc || PLACEHOLDER)}" alt="${namaArea}" onerror="this.onerror=null; this.src='${PLACEHOLDER}';" loading="lazy">
    </div>
    <p class="polaroid-caption">${formatCaptionNama(namaArea)}</p>
  </div>
`;
      }).join('');
    }

    // Dropdown area dari data area
    if (selectArea) {
      selectArea.innerHTML = '<option value="">Pilih Area</option>' +
        dataArea.map(a => `<option value="${esc(a.nama)}">${esc(a.nama)}</option>`).join('');
      selectArea.disabled = false;
    }
    updateSubmitState();

  } catch (error) {
    console.error('Gagal memuat area reservasi:', error);
    isAreaLoading = false;
    isAreaLoadFailed = true;
    areaListGlobal = [];

    // Pesan error + skeleton tetap tampil, dropdown & submit nonaktif
    if (skeleton) skeleton.style.display = 'block';
    if (gallery) gallery.style.display = 'none';
    if (errorAlert) errorAlert.style.display = 'block';
    if (selectArea) {
      selectArea.innerHTML = '<option value="">Gagal memuat data area</option>';
      selectArea.disabled = true;
    }
    TampilkanErrorField('areaSelect', 'Gagal memuat area dari server. Form tidak dapat dikirim.');
    updateSubmitState();
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
  const selectJam = document.getElementById('jam');

  try {
    if (simulasiGagal) throw new Error('Simulasi kegagalan memuat jam operasional');

    const res = await fetchData('/operating-hours');
    if (!Array.isArray(res) || res.length === 0) throw new Error('Data jam operasional gagal dimuat');

    // API mengirim nama hari berbahasa Inggris (Monday..Sunday): petakan ke indeks 0-6
    const baru = {};
    res.forEach((item) => {
      const idx = INDEKS_HARI[String(item.hari || '').trim().toLowerCase()];
      if (idx === undefined) return;
      baru[idx] = {
        hari: NAMA_HARI_INDONESIA[idx],
        buka: item.jam_buka || null,
        tutup: item.jam_tutup || null,
        is_closed: item.is_closed ? 1 : 0
      };
    });
    if (Object.keys(baru).length === 0) throw new Error('Format jam operasional tidak dikenali');

    jamOperasionalData = baru;
    isJamLoadFailed = false;
    BersihkanErrorField('jam');

    // Jika tanggal sudah dipilih, susun ulang pilihan waktu
    const tgl = document.getElementById('tanggal');
    if (tgl && tgl.value) {
      terapkanPilihanJam(tgl.value);
    } else if (selectJam) {
      selectJam.innerHTML = '<option value="">Pilih Jam</option>';
      selectJam.disabled = true;
    }
  } catch (e) {
    console.error('Gagal memuat jam operasional:', e);
    isJamLoadFailed = true;
    jamOperasionalData = {};
    if (selectJam) {
      selectJam.innerHTML = '<option value="">Gagal memuat jam</option>';
      selectJam.disabled = true;
    }
    TampilkanErrorField('jam', 'Gagal memuat data jam operasional. Pilih ulang tanggal untuk mencoba lagi.');
  }
  updateSubmitState();
}

/* ====================================================================
   CARD 12.3.3: MUAT DATA ATURAN RESERVASI & INTERAKSI SELENGKAPNYA
   - Awal: 3 aturan pertama + tombol "Selengkapnya"
   - Setelah "Selengkapnya" diklik: seluruh aturan tampil dan tombol
     hilang (tidak ada tombol untuk kembali ke tampilan awal)
   ==================================================================== */
async function MuatDataAturanReservasi() {
  const modalBody = document.getElementById('modalAturanBody');
  const container = document.getElementById('rulesPreviewContainer');
  const btnWrapper = document.getElementById('rulesBtnWrapper');

  // Loading: skeleton sederhana
  if (btnWrapper) btnWrapper.style.display = 'none';
  if (container) {
    container.innerHTML = '<div class="skeleton-box" style="height:64px;border-radius:12px;margin-bottom:12px"></div>'.repeat(3);
  }

  const rules = await fetchData('/reservation-rule');

  if (!Array.isArray(rules)) {
    if (container) {
      container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2" role="alert">
          <span class="fw-semibold text-danger">Gagal memuat aturan reservasi.</span>
          <button type="button" class="btn-retry-action" onclick="MuatDataAturanReservasi()">Coba Muat Ulang</button>
        </div>`;
    }
    return;
  }

  aturanListGlobal = rules;
  isAturanExpanded = false;

  if (rules.length === 0 && container) {
    container.innerHTML = '<p class="mb-0">Belum ada aturan reservasi.</p>';
    return;
  }
  renderAturan();

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
  if (btnWrapper) btnWrapper.style.display = (isAturanExpanded || aturanListGlobal.length <= 3) ? 'none' : 'flex';
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
async function HandlePerubahanTanggal(e) {
  const tglVal = e.target.value;
  const selectJam = document.getElementById('jam');
  const namaHariDisplay = document.getElementById('namaHariDisplay');

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

  // Nama hari di bawah tanggal
  const dateObj = new Date(tglVal + 'T00:00:00');
  if (namaHariDisplay) {
    namaHariDisplay.innerText = `${NAMA_HARI_INDONESIA[dateObj.getDay()]}, ${dateObj.getDate()} ${NAMA_BULAN_INDONESIA[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  }

  // Jam operasional gagal dimuat: coba muat ulang saat tanggal dipilih
  if (isJamLoadFailed) {
    await MuatDataJamOperasional();
    return;
  }
  terapkanPilihanJam(tglVal);
}

/**
 * Susun pilihan waktu (interval 1 jam) sesuai jam operasional hari dari tanggal terpilih.
 * Pilihan sebelumnya otomatis direset karena daftar opsi dibuat ulang.
 */
function terapkanPilihanJam(tglVal) {
  const selectJam = document.getElementById('jam');
  if (!selectJam) return;

  BersihkanErrorField('jam');

  // Tanggal hari ini / sebelumnya (mis. diketik manual) tidak valid
  if (tglVal < tanggalWIB(1)) {
    selectJam.innerHTML = '<option value="">Pilih Jam</option>';
    selectJam.disabled = true;
    TampilkanErrorField('tanggal', 'Tanggal minimal mulai besok. Hari ini dan sebelumnya tidak dapat dipilih.');
    return;
  }

  const hariIndex = new Date(tglVal + 'T00:00:00').getDay();
  const namaHari = NAMA_HARI_INDONESIA[hariIndex];
  const jadwal = jamOperasionalData[hariIndex];

  if (!jadwal) {
    selectJam.innerHTML = '<option value="">Jam tidak tersedia</option>';
    selectJam.disabled = true;
    TampilkanErrorField('jam', `Jam operasional hari ${namaHari} tidak tersedia. Silakan pilih tanggal lain.`);
    return;
  }

  if (jadwal.is_closed || !jadwal.buka || !jadwal.tutup) {
    selectJam.innerHTML = '<option value="">Kafe Tutup</option>';
    selectJam.disabled = true;
    TampilkanErrorField('jam', `Kafe tutup pada hari ${namaHari}. Silakan pilih tanggal lain.`);
    return;
  }

  // Dari jam buka sampai sebelum jam tutup, interval 60 menit
  const ke_menit = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
  const slots = [];
  for (let m = ke_menit(jadwal.buka); m < ke_menit(jadwal.tutup); m += 60) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }

  if (slots.length === 0) {
    selectJam.innerHTML = '<option value="">Tidak ada waktu tersedia</option>';
    selectJam.disabled = true;
    TampilkanErrorField('jam', 'Tidak ada waktu tersedia pada tanggal ini. Silakan pilih tanggal lain.');
    return;
  }

  selectJam.disabled = false;
  selectJam.innerHTML = '<option value="">Pilih Jam</option>' +
    slots.map(w => `<option value="${w}">${w} WIB</option>`).join('');
}

/* ====================================================================
   VALIDASI FORM FRONT-END & PENANGANAN PENGIRIMAN
   ==================================================================== */
async function HandleSubmitReservasi(event) {
  event.preventDefault();
  if (isSubmitting) return;

  const nama = document.getElementById('nama')?.value.trim() || '';
  const whatsapp = document.getElementById('whatsapp')?.value.trim() || '';
  const tanggal = document.getElementById('tanggal')?.value || '';
  const jam = document.getElementById('jam')?.value || '';
  const area = document.getElementById('areaSelect')?.value || '';
  const jumlahVal = document.getElementById('jumlah')?.value.trim() || '';
  const catatan = document.getElementById('catatan')?.value.trim() || '';
  const btnSubmit = document.getElementById('btnSubmitReservasi');

  BersihkanSemuaError();

  // 1. Seluruh field kosong -> pop-up peringatan, WhatsApp tidak dibuka
  if (!nama && !whatsapp && !tanggal && !jam && !area && !jumlahVal) {
    bukaModalFormKosong();
    return;
  }

  // 2. Sebagian field kosong / tidak valid -> error per field
  let isValid = true;
  let firstInvalidEl = null;
  const gagal = (id, pesan) => {
    TampilkanErrorField(id, pesan);
    isValid = false;
    firstInvalidEl = firstInvalidEl || document.getElementById(id);
  };

  if (!nama) gagal('nama', 'Nama pemesan wajib diisi.');
  else if (nama.length < 2) gagal('nama', 'Nama pemesan minimal 2 karakter.');

  const regexWAIndo = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;
  if (!whatsapp) gagal('whatsapp', 'Nomor telepon / WhatsApp wajib diisi.');
  else if (!regexWAIndo.test(whatsapp.replace(/[\s-]/g, ''))) gagal('whatsapp', 'Format nomor WhatsApp tidak valid (contoh: 08123456789).');

  // Tanggal: wajib, mulai besok (acuan WIB)
  if (!tanggal) gagal('tanggal', 'Tanggal kunjungan wajib dipilih.');
  else if (tanggal < tanggalWIB(1)) gagal('tanggal', 'Tanggal minimal mulai besok. Hari ini dan sebelumnya tidak dapat dipilih.');

  if (isJamLoadFailed) gagal('jam', 'Gagal memuat data jam operasional. Form tidak dapat dikirim.');
  else if (!jam) gagal('jam', 'Jam kedatangan wajib dipilih.');

  const jumlahNum = parseInt(jumlahVal, 10);
  if (!jumlahVal || isNaN(jumlahNum) || jumlahNum < 1 || String(jumlahNum) !== jumlahVal) {
    gagal('jumlah', 'Jumlah pengunjung harus berupa bilangan bulat minimal 1.');
  }

  if (isAreaLoadFailed) gagal('areaSelect', 'Area reservasi gagal dimuat. Form tidak dapat dikirim.');
  else if (!area) gagal('areaSelect', 'Area reservasi wajib dipilih.');

  if (!isValid) {
    if (firstInvalidEl) {
      firstInvalidEl.focus();
      firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  // 3. Data lengkap & valid: loading pada tombol (~2 detik), cegah klik berulang
  isSubmitting = true;
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>MEMPROSES...`;
  }

  // Susun pesan (tanpa API BE). Hari + tanggal mudah dibaca, mis. "Minggu, 15 Nov 2026, 19:00"
  const d = new Date(tanggal + 'T00:00:00');
  const tglFormatted = `${NAMA_HARI_INDONESIA[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`;

  const baris = [
    'Halo Café Acala, saya ingin reservasi:',
    `Nama: ${nama}`,
    `Telepon: ${whatsapp}`,
    `Area: ${area}`,
    `Tanggal/Waktu: ${tglFormatted}, ${jam}`,
    `Jumlah: ${jumlahNum} orang`
  ];
  if (catatan) baris.push(`Catatan: ${catatan}`);

  pendingMessageText = baris.join('\n');
  // Isi pesan di-encode agar karakter khusus (&, #, baris baru, dll.) aman di URL
  pendingWhatsAppUrl = bangunUrlWA();

  setTimeout(() => {
    isSubmitting = false;
    if (btnSubmit) btnSubmit.innerHTML = 'SUBMIT';
    updateSubmitState();
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
 * loading bar -> buka WhatsApp dengan pesan terisi. Isian form TIDAK direset.
 * Jika WhatsApp tidak terbuka, tampilkan pop-up fallback.
 */
function handleKonfirmasiOK() {
  if (isMembukaWA) return;
  isMembukaWA = true;

  const btnWrap = document.getElementById('konfirmasiBtnWrap');
  const loadingWrap = document.getElementById('konfirmasiLoadingWrap');
  const progressBar = document.getElementById('waProgressBar');

  if (btnWrap) btnWrap.style.display = 'none';
  if (loadingWrap) loadingWrap.style.display = 'block';
  setTimeout(() => { if (progressBar) progressBar.style.width = '100%'; }, 50);

  setTimeout(async () => {
    tutupModalKonfirmasiWA();
    isMembukaWA = false;

    // ?error=wa -> simulasi WhatsApp tidak terbuka (untuk pengujian SQA)
    const simulasiGagal = new URLSearchParams(window.location.search).get('error') === 'wa';

    // Nomor belum didapat dari API /contact -> coba sekali lagi
    if (!NOMOR_WA_CAFE) await MuatNomorWhatsApp();
    pendingWhatsAppUrl = bangunUrlWA();

    let terbuka = false;
    if (!simulasiGagal && pendingWhatsAppUrl) {
      try {
        // window.open bernilai null bila diblokir browser / tidak bisa dibuka
        const w = window.open(pendingWhatsAppUrl, '_blank');
        if (w) {
          try { w.opener = null; } catch (e) { /* abaikan */ }
          terbuka = true;
        }
      } catch (e) {
        terbuka = false;
      }
    }

    if (!terbuka) TampilkanWAFallback(pendingWhatsAppUrl, pendingMessageText);
  }, 1300);
}

/** Pop-up "WhatsApp tidak dapat dibuka": isi pesan dapat disalin + tautan coba lagi */
function TampilkanWAFallback(waUrl, messageText) {
  const modal = document.getElementById('modalWAGagal');
  const btnDirect = document.getElementById('btnBukaWALangsung');
  const previewText = document.getElementById('waMessagePreviewText');
  const badge = document.getElementById('copyAlertSuccess');

  if (btnDirect) {
    btnDirect.href = waUrl || '#';
    btnDirect.onclick = cobaBukaWALagi;
    btnDirect.textContent = 'Coba buka WhatsApp lagi';
  }
  if (previewText) previewText.textContent = messageText;
  if (badge) badge.style.display = 'none';
  if (modal) modal.style.display = 'flex';
}

/** Tautan "Coba buka WhatsApp lagi": ambil ulang nomor bila perlu, lalu buka WhatsApp. */
async function cobaBukaWALagi(e) {
  if (e) e.preventDefault();
  const link = document.getElementById('btnBukaWALangsung');
  const simulasiGagal = new URLSearchParams(window.location.search).get('error') === 'wa';

  if (!NOMOR_WA_CAFE) await MuatNomorWhatsApp();
  pendingWhatsAppUrl = bangunUrlWA();

  let terbuka = false;
  if (!simulasiGagal && pendingWhatsAppUrl) {
    try {
      const w = window.open(pendingWhatsAppUrl, '_blank');
      if (w) { try { w.opener = null; } catch (err) { /* abaikan */ } terbuka = true; }
    } catch (err) { terbuka = false; }
  }

  if (terbuka) {
    tutupModalWAGagal();
  } else if (link) {
    link.textContent = 'WhatsApp masih tidak dapat dibuka. Coba lagi';
  }
}

function tutupModalWAGagal() {
  const modal = document.getElementById('modalWAGagal');
  if (modal) modal.style.display = 'none';
}

function salinPesanWA() {
  if (!pendingMessageText) return;

  const tampilkanBerhasil = () => {
    const badge = document.getElementById('copyAlertSuccess');
    if (badge) {
      badge.style.display = 'block';
      setTimeout(() => { badge.style.display = 'none'; }, 3000);
    }
  };

  // Cadangan untuk browser tanpa Clipboard API / konteks non-HTTPS
  const salinManual = () => {
    const ta = document.createElement('textarea');
    ta.value = pendingMessageText;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    if (ok) tampilkanBerhasil();
    else alert('Salin pesan gagal. Silakan blok dan salin teks pesan secara manual.');
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(pendingMessageText).then(tampilkanBerhasil).catch(salinManual);
  } else {
    salinManual();
  }
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
    captionEl.textContent = namaArea;
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
};

window.testWAGagal = function() {
  TampilkanWAFallback('', 'Halo Café Acala, saya ingin reservasi:\nNama: Budi Santoso\nTelepon: 0812-3456-7890\nArea: Outdoor\nTanggal/Waktu: Minggu, 15 Nov 2026, 19:00\nJumlah: 4 orang');
  pendingMessageText = document.getElementById('waMessagePreviewText').textContent;
};
window.tutupModalWAGagal = tutupModalWAGagal;

window.bukaModalFormKosong = bukaModalFormKosong;
window.bukaModalKonfirmasiWA = bukaModalKonfirmasiWA;
window.bukaModalFotoBesar = bukaModalFotoBesar;
window.bukaModalAturan = bukaModalAturan;
window.ekspansiAturan = ekspansiAturan;