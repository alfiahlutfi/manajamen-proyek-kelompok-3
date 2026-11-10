/**
 * Logika Halaman Reservasi Café Ácala & Eatery
 */

const NOMOR_WA_CAFE = '6281234567890'; 

let jamOperasionalData = {}; 
let areaListGlobal = [];
let aturanListGlobal = [];
let indeksFotoAktif = 0;
let pendingWhatsAppUrl = '';
let pendingMessageText = '';

document.addEventListener('DOMContentLoaded', () => {
  InisialisasiFloatingWA();
  MuatDataAreaReservasi();
  MuatDataJamOperasional();
  MuatDataAturanReservasi();
  SetMinTanggalHariIni();

  const inputTanggal = document.getElementById('tanggal');
  if (inputTanggal) {
    inputTanggal.addEventListener('change', HandlePerubahanTanggal);
  }

  const formEl = document.getElementById('formReservasiAcala');
  if (formEl) {
    formEl.addEventListener('submit', HandleSubmitReservasi);
  }
});

function InisialisasiFloatingWA() {
  const waBtn = document.getElementById('floating-wa-btn');
  if (waBtn) {
    waBtn.href = `https://wa.me/${NOMOR_WA_CAFE}?text=` + encodeURIComponent('Halo Admin Café Ácala, saya ingin bertanya seputar reservasi meja.');
  }
}

function SetMinTanggalHariIni() {
  const inputTanggal = document.getElementById('tanggal');
  if (inputTanggal) {
    const todayStr = new Date().toISOString().split('T')[0];
    inputTanggal.min = todayStr;
  }
}

/**
 * Mengambil Data Area & Menampilkan Card Slider Interaktif
 */
async function MuatDataAreaReservasi() {
  const skeleton = document.getElementById('areaSkeleton');
  const container = document.getElementById('dynamicAreaCards');
  const selectArea = document.getElementById('areaSelect');

  try {
    const response = await fetchData("/area");
    
    let dataArea = [];
    if (Array.isArray(response)) {
      dataArea = response;
    } else if (response && Array.isArray(response.data)) {
      dataArea = response.data;
    } else if (response && typeof response === 'object') {
      dataArea = Object.values(response).find(val => Array.isArray(val)) || [];
    }

    if (skeleton) skeleton.style.display = 'none';

    if (!dataArea || dataArea.length === 0) {
      if (container) {
        container.innerHTML = '<p class="text-center text-muted w-100">Belum ada area reservasi.</p>';
        container.style.display = 'flex';
      }
      if (selectArea) {
        selectArea.innerHTML = '<option value="">-- Belum ada area --</option>';
        selectArea.disabled = true;
      }
      return;
    }

    areaListGlobal = dataArea;
    indeksFotoAktif = 0;
    
    if (container) {
      container.style.display = 'block';
      renderCardGaleriSlider(container);
    }

    if (selectArea) {
      selectArea.innerHTML = '<option value="">-- Pilih Area Reservasi --</option>' + 
        dataArea.map(a => `<option value="${esc(a.nama)}">${esc(a.nama)}</option>`).join('');
      selectArea.disabled = false;
    }

  } catch (error) {
    console.error("Gagal memuat area:", error);
    if (skeleton) skeleton.style.display = 'none';
    if (container) {
      container.innerHTML = `
        <div class="p-4 text-center text-danger bg-light rounded-4 w-100">
          <p class="fw-bold mb-1">Gagal memuat data area reservasi.</p>
        </div>
      `;
      container.style.display = 'flex';
    }
  }
}

function renderCardGaleriSlider(containerEl) {
  const area = areaListGlobal[indeksFotoAktif];
  if (!area) return;

  let fotoMarkup = area.foto 
    ? `<img src="${urlGambar(area.foto)}" alt="${esc(area.nama)}" class="foto-utama" onclick="bukaModalFotoBesar(${indeksFotoAktif})" title="Klik untuk memperbesar foto">`
    : `<div class="foto-placeholder" style="width:100%; height:100%; cursor:pointer;" onclick="bukaModalFotoBesar(${indeksFotoAktif})">Foto area tidak tersedia</div>`;

  containerEl.innerHTML = `
    <article class="res-card light p-3 shadow-sm" style="height:100%; display:flex; flex-direction:column; justify-content:space-between; background:#EFEFEF; border-radius:16px;">
      
      <div>
        <div class="d-flex justify-content-between align-items-center mb-1">
          <h3 class="nama-area-teks mb-0" style="color:#2d5f2e; font-weight:700; font-size:18px;">${esc(area.nama)}</h3>
          <span style="font-size:10.5px; font-weight:600; letter-spacing:1px; color:#4A5568; background:#E2E8F0; padding:2px 8px; border-radius:20px;">${indeksFotoAktif + 1} / ${areaListGlobal.length}</span>
        </div>
        <div class="subtitle mb-2" style="font-size:10px; font-weight:600; letter-spacing:1.5px; color:#718096; text-transform:uppercase;">AREA RESERVASI CAFÉ ÁCALA</div>
      </div>

      <div class="position-relative d-flex align-items-center justify-content-center my-1">
        <button type="button" class="btn btn-dark position-absolute start-0 z-3 px-2 py-1 fs-6 fw-bold shadow" onclick="geserCardGaleri(-1)">❮</button>
        
        <div class="res-card-media-slider">
          ${fotoMarkup}
        </div>

        <button type="button" class="btn btn-dark position-absolute end-0 z-3 px-2 py-1 fs-6 fw-bold shadow" onclick="geserCardGaleri(1)">❯</button>
      </div>

      <div class="mt-2 text-center">
        <button type="button" class="btn-pilih-reservasi w-100 py-2" onclick="PilihAreaDariCard('${area.id}')" style="font-size:12px;">PILIH AREA INI</button>
      </div>

    </article>
  `;
}

function geserCardGaleri(arah) {
  indeksFotoAktif += arah;
  if (indeksFotoAktif < 0) {
    indeksFotoAktif = areaListGlobal.length - 1; 
  } else if (indeksFotoAktif >= areaListGlobal.length) {
    indeksFotoAktif = 0; 
  }
  const container = document.getElementById('dynamicAreaCards');
  if (container) {
    renderCardGaleriSlider(container);
  }
}

/**
 * Logika Pop-up Foto Besar & Navigasi (Next / Prev)
 */
function bukaModalFotoBesar(index) {
  indeksFotoAktif = index;
  updateKontenModalFoto();
  const modal = document.getElementById('modalFotoBesar');
  if (modal) modal.classList.add('aktif');
}

function tutupModalFotoBesar() {
  const modal = document.getElementById('modalFotoBesar');
  if (modal) modal.classList.remove('aktif');
}

function geserFotoModal(arah) {
  indeksFotoAktif += arah;
  if (indeksFotoAktif < 0) {
    indeksFotoAktif = areaListGlobal.length - 1; 
  } else if (indeksFotoAktif >= areaListGlobal.length) {
    indeksFotoAktif = 0; 
  }
  updateKontenModalFoto();
  
  const container = document.getElementById('dynamicAreaCards');
  if (container) {
    renderCardGaleriSlider(container);
  }
}

function updateKontenModalFoto() {
  const area = areaListGlobal[indeksFotoAktif];
  if (!area) return;

  const titleEl = document.getElementById('modalFotoTitle');
  const imgEl = document.getElementById('modalFotoImg');
  const placeholderEl = document.getElementById('modalFotoPlaceholder');

  if (titleEl) {
    titleEl.textContent = `${area.nama} (${indeksFotoAktif + 1} dari ${areaListGlobal.length})`;
  }

  if (area.foto) {
    imgEl.src = urlGambar(area.foto);
    imgEl.style.display = 'block';
    if (placeholderEl) placeholderEl.style.display = 'none';
  } else {
    imgEl.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.style.display = 'flex';
      placeholderEl.textContent = `Foto ${area.nama} tidak tersedia`;
    }
  }
}

async function MuatDataJamOperasional() {
  try {
    const res = await fetchData("/operating-hours");
    if (res && Array.isArray(res)) {
      res.forEach((item, idx) => {
        jamOperasionalData[idx] = {
          buka: item.jam_buka ? item.jam_buka.substring(0, 5) : "13:00",
          tutup: item.jam_tutup ? item.jam_tutup.substring(0, 5) : "22:00",
          tutupStatus: item.is_closed
        };
      });
    }
  } catch (e) {
    jamOperasionalData = {
      0: { buka: "13:00", tutup: "22:00", tutupStatus: false },
      1: { buka: "13:00", tutup: "22:00", tutupStatus: false },
      2: { buka: "13:00", tutup: "22:00", tutupStatus: false },
      3: { buka: "13:00", tutup: "22:00", tutupStatus: false },
      4: { buka: "13:00", tutup: "22:00", tutupStatus: false },
      5: { buka: "13:00", tutup: "23:00", tutupStatus: false },
      6: { buka: "13:00", tutup: "23:00", tutupStatus: false }
    };
  }
}

async function MuatDataAturanReservasi() {
  const previewContainer = document.getElementById('rulesPreviewContainer');
  const modalBody = document.getElementById('modalAturanBody');

  try {
    const res = await fetchData("/reservation-rule?limit=4");
    let rules = [];
    if (Array.isArray(res)) {
      rules = res;
    } else if (res && Array.isArray(res.data)) {
      rules = res.data;
    }

    if (!rules || rules.length === 0) {
      if (previewContainer) previewContainer.innerHTML = '<p class="text-muted">Belum ada aturan reservasi.</p>';
      return;
    }

    aturanListGlobal = rules;

    if (previewContainer) {
      previewContainer.innerHTML = rules.map((r, i) => `
        <div class="mb-2 rules-item-list">
          <span class="fw-bold" style="color: #2d5f2e; font-size: 13px;">${i + 1}. ${esc(r.judul)}</span>
          <p class="mb-1 text-dark" style="font-size: 11.5px; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; opacity: 0.85;">${esc(r.isi)}</p>
        </div>
      `).join('');
    }

    if (modalBody) {
      const fullRes = await fetchData("/reservation-rule");
      let allRules = rules;
      if (Array.isArray(fullRes)) {
        allRules = fullRes;
      } else if (fullRes && Array.isArray(fullRes.data)) {
        allRules = fullRes.data;
      }

      modalBody.innerHTML = allRules.map((r, i) => `
        <div class="mb-3">
          <h5 class="text-warning fw-bold" style="font-size: 15px;">${i + 1}. ${esc(r.judul)}</h5>
          <p class="mb-0 text-white-50" style="font-size: 13.5px; font-weight: 500;">${esc(r.isi)}</p>
        </div>
      `).join('');
    }

  } catch (err) {
    console.error("Gagal memuat aturan reservasi:", err);
    if (previewContainer) {
      previewContainer.innerHTML = '<p class="text-danger small">Gagal memuat ringkasan aturan.</p>';
    }
  }
}

function bukaModalAturan() {
  const modal = document.getElementById('modalAturan');
  if (modal) modal.classList.add('aktif');
}

function tutupModalAturan() {
  const modal = document.getElementById('modalAturan');
  if (modal) modal.classList.remove('aktif');
}

function PilihAreaDariCard(idArea) {
  const areaDitemukan = areaListGlobal.find(a => a.id == idArea);
  if (areaDitemukan) {
    const selectArea = document.getElementById('areaSelect');
    if (selectArea) selectArea.value = areaDitemukan.nama;
    const formSection = document.querySelector('.form-reservasi-section');
    if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function HandlePerubahanTanggal(e) {
  const tglVal = e.target.value;
  const selectJam = document.getElementById('jam');
  const infoHari = document.getElementById('infoHari');

  if (!tglVal) {
    selectJam.innerHTML = '<option value="">-- Pilih tanggal terlebih dahulu --</option>';
    selectJam.disabled = true;
    if (infoHari) infoHari.innerText = '';
    return;
  }

  const dateObj = new Date(tglVal + 'T00:00:00');
  const hariIndex = dateObj.getDay(); 
  const opsiHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const namaHari = opsiHari[hariIndex];

  if (infoHari) infoHari.innerText = `Hari: ${namaHari}`;

  const jadwalHariIni = jamOperasionalData[hariIndex] || { buka: "13:00", tutup: "22:00", tutupStatus: false };

  if (jadwalHariIni.tutupStatus) {
    selectJam.innerHTML = `<option value="">Kafe TUTUP pada hari ${namaHari}</option>`;
    selectJam.disabled = true;
    if (infoHari) infoHari.innerHTML += ` <span class="text-danger fw-bold">(Hari Tutup)</span>`;
    return;
  }

  selectJam.disabled = false;
  let jamOptionsHtml = '<option value="">-- Pilih Jam Kedatangan --</option>';

  let jamBukaNum = parseInt(jadwalHariIni.buka.split(':')[0], 10);
  let jamTutupNum = parseInt(jadwalHariIni.tutup.split(':')[0], 10);

  const isToday = tglVal === new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  for (let h = jamBukaNum; h <= jamTutupNum; h++) {
    let waktuStr = `${h < 10 ? '0' + h : h}:00 WIB`;
    if (isToday && h <= currentHour) continue;
    jamOptionsHtml += `<option value="${waktuStr}">${waktuStr}</option>`;
  }

  selectJam.innerHTML = jamOptionsHtml;
  if (selectJam.options.length <= 1) {
    selectJam.innerHTML = '<option value="">Maaf, jam operasional hari ini sudah berakhir</option>';
    selectJam.disabled = true;
  }
}

function HandleSubmitReservasi(event) {
  event.preventDefault();

  const nama = document.getElementById('nama').value.trim();
  const whatsapp = document.getElementById('whatsapp').value.trim();
  const tanggal = document.getElementById('tanggal').value;
  const jam = document.getElementById('jam').value;
  const jumlah = document.getElementById('jumlah').value.trim();
  const area = document.getElementById('areaSelect').value;
  const catatan = document.getElementById('catatan').value.trim();

  ClearErrors();

  if (!nama && !whatsapp && !tanggal && !jam && !area) {
    TampilkanPeringatan("Formulir masih kosong. Silakan lengkapi data reservasi Anda terlebih dahulu.");
    return;
  }

  let isValid = true;

  if (!nama) {
    TampilkanErrorField('nama', 'Nama lengkap wajib diisi.');
    isValid = false;
  }

  const waRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  if (!whatsapp) {
    TampilkanErrorField('whatsapp', 'Nomor WhatsApp wajib diisi.');
    isValid = false;
  } else if (!waRegex.test(whatsapp.replace(/[\s-]/g, ''))) {
    TampilkanErrorField('whatsapp', 'Format nomor WhatsApp tidak valid (contoh: 081234567890).');
    isValid = false;
  }

  if (!tanggal) {
    TampilkanErrorField('tanggal', 'Tanggal kunjungan wajib dipilih.');
    isValid = false;
  } else {
    const tglInput = new Date(tanggal + 'T00:00:00');
    const tglHariIni = new Date();
    tglHariIni.setHours(0,0,0,0);
    if (tglInput < tglHariIni) {
      TampilkanErrorField('tanggal', 'Tanggal reservasi tidak boleh sebelum hari ini.');
      isValid = false;
    }
  }

  if (!jam) {
    TampilkanErrorField('jam', 'Waktu/jam kedatangan wajib dipilih.');
    isValid = false;
  }

  const jmlNum = parseInt(jumlah, 10);
  if (!jumlah || isNaN(jmlNum) || jmlNum < 1) {
    TampilkanErrorField('jumlah', 'Jumlah pengunjung minimal 1 orang.');
    isValid = false;
  }

  if (!area) {
    TampilkanErrorField('areaSelect', 'Silakan pilih area reservasi.');
    isValid = false;
  }

  if (!isValid) return;

  SimpanDanTampilkanKonfirmasi({ nama, whatsapp, tanggal, jam, jumlah: jmlNum, area, catatan });
}

function TampilkanErrorField(fieldId, pesan) {
  const el = document.getElementById(fieldId);
  const errEl = document.getElementById('error-' + fieldId);
  if (el) el.classList.add('is-invalid');
  if (errEl) {
    errEl.innerText = pesan;
    errEl.classList.add('aktif');
  }
}

function ClearErrors() {
  document.querySelectorAll('.form-control-acala').forEach(el => el.classList.remove('is-invalid'));
  document.querySelectorAll('.invalid-feedback-custom').forEach(el => {
    el.innerText = '';
    el.classList.remove('aktif');
  });
}

function TampilkanPeringatan(pesan) {
  const el = document.getElementById('pesanPeringatan');
  if (el) el.innerText = pesan;
  const modal = document.getElementById('modalPeringatan');
  if (modal) modal.classList.add('aktif');
}

function tutupModalPeringatan() {
  const modal = document.getElementById('modalPeringatan');
  if (modal) modal.classList.remove('aktif');
}

function SimpanDanTampilkanKonfirmasi(data) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const tglFormatted = new Date(data.tanggal + 'T00:00:00').toLocaleDateString('id-ID', options);

  pendingMessageText = `Halo Admin Café Ácala & Eatery, saya ingin melakukan reservasi meja dengan rincian berikut:

📌 *Area Meja:* ${data.area}
👤 *Nama Pemesan:* ${data.nama}
📞 *No. WhatsApp:* ${data.whatsapp}
📅 *Tanggal Kunjungan:* ${tglFormatted}
⏰ *Jam Kedatangan:* ${data.jam}
👥 *Jumlah Tamu:* ${data.jumlah} Orang
📝 *Catatan Khusus:* ${data.catatan || '-'}

Mohon dapat dikonfirmasi ketersediaan tempatnya. Terima kasih!`;

  pendingWhatsAppUrl = `https://wa.me/${NOMOR_WA_CAFE}?text=` + encodeURIComponent(pendingMessageText);

  const loadingContainer = document.getElementById('loadingBarContainer');
  const btnWrapper = document.getElementById('konfirmasiButtonWrapper');
  if (loadingContainer) loadingContainer.style.display = 'none';
  if (btnWrapper) btnWrapper.style.display = 'flex';

  const modal = document.getElementById('modalKonfirmasi');
  if (modal) modal.classList.add('aktif');
}

function tutupModalKonfirmasi() {
  const modal = document.getElementById('modalKonfirmasi');
  if (modal) modal.classList.remove('aktif');
}

function prosesKonfirmasiOK() {
  const loadingContainer = document.getElementById('loadingBarContainer');
  const progressBar = document.getElementById('progressBarFill');
  const btnWrapper = document.getElementById('konfirmasiButtonWrapper');

  if (btnWrapper) btnWrapper.style.display = 'none';
  if (loadingContainer) loadingContainer.style.display = 'block';
  if (progressBar) progressBar.style.width = '0%';

  let width = 0;
  const interval = setInterval(() => {
    width += 10;
    if (progressBar) progressBar.style.width = width + '%';
    if (width >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        tutupModalKonfirmasi();
        BukaWhatsAppAtauFallback(pendingWhatsAppUrl, pendingMessageText);
      }, 300);
    }
  }, 180);
}

function BukaWhatsAppAtauFallback(urlWA, pesanTeks) {
  const newWindow = window.open(urlWA, '_blank');

  if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
    const textarea = document.getElementById('fallbackTextarea');
    const linkManual = document.getElementById('linkManualWA');
    if (textarea) textarea.value = pesanTeks;
    if (linkManual) linkManual.href = urlWA;
    const fallbackModal = document.getElementById('modalFallbackWA');
    if (fallbackModal) fallbackModal.classList.add('aktif');
  }
}

function salinPesanFallback() {
  const textarea = document.getElementById('fallbackTextarea');
  if (!textarea) return;
  textarea.select();
  textarea.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(textarea.value).then(() => {
    alert('Pesan berhasil disalin! Silakan tempel (paste) ke chat WhatsApp Café Ácala.');
  }).catch(() => {
    alert('Gagal menyalin teks secara otomatis.');
  });
}

function tutupModalFallback() {
  const modal = document.getElementById('modalFallbackWA');
  if (modal) modal.classList.remove('aktif');
}

function urlGambar(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const BASE_ASSET = "../backend/"; 
  return path.startsWith("uploads/") ? BASE_ASSET + path : path;
}

function esc(str) {
  return str ? String(str) : '';
}