/**
 * Logika Halaman Reservasi Café Ácala & Eatery
 * Sesuai Spesifikasi Card 12.2.1 (Data Area, 1 Baris = 1 Area = 1 Foto, textContent aman, Error 500)
 */

const NOMOR_WA_CAFE = '6281234567890'; 

let jamOperasionalData = {
  0: { buka: "13:00", tutup: "22:00", tutupStatus: false },
  1: { buka: "13:00", tutup: "22:00", tutupStatus: false },
  2: { buka: "13:00", tutup: "22:00", tutupStatus: false },
  3: { buka: "13:00", tutup: "22:00", tutupStatus: false },
  4: { buka: "13:00", tutup: "22:00", tutupStatus: false },
  5: { buka: "13:00", tutup: "23:00", tutupStatus: false },
  6: { buka: "13:00", tutup: "23:00", tutupStatus: false }
};

let areaListGlobal = [];
let pendingWhatsAppUrl = '';
let pendingMessageText = '';

document.addEventListener('DOMContentLoaded', () => {
  InisialisasiFloatingWA();
  MuatDataAreaReservasi();
  MuatDataJamOperasional();
  SetMinTanggalHariIni();

  const inputTanggal = document.getElementById('tanggal');
  inputTanggal.addEventListener('change', HandlePerubahanTanggal);
});

function InisialisasiFloatingWA() {
  const waBtn = document.getElementById('floating-wa-btn');
  if (waBtn) {
    waBtn.href = `https://wa.me/${NOMOR_WA_CAFE}?text=` + encodeURIComponent('Halo Admin Café Ácala, saya ingin bertanya seputar reservasi meja.');
  }
}

function SetMinTanggalHariIni() {
  const inputTanggal = document.getElementById('tanggal');
  const todayStr = new Date().toISOString().split('T')[0];
  inputTanggal.min = todayStr;
}

/**
 * Mengambil Data Area dari API (Card 12.2.1)
 */
async function MuatDataAreaReservasi() {
  const skeleton = document.getElementById('areaSkeleton');
  const container = document.getElementById('dynamicAreaCards');
  const selectArea = document.getElementById('areaSelect');

  try {
    const response = await fetch('/api/area');
    
    if (!response.ok) {
      throw new Error('Data area reservasi gagal dimuat');
    }

    const result = await response.json();
    
    if (result && Array.isArray(result.data) && result.data.length === 0) {
      skeleton.style.display = 'none';
      container.innerHTML = '<p class="text-center text-muted">Belum ada area reservasi.</p>';
      container.style.display = 'block';
      selectArea.innerHTML = '<option value="">-- Belum ada area --</option>';
      selectArea.disabled = true;
      return;
    }

    const dataArea = result.data || result; 
    areaListGlobal = dataArea;
    
    skeleton.style.display = 'none';
    container.style.display = 'flex';

    // Render Kartu Area (1 Foto per Area)
    container.innerHTML = dataArea.map(area => {
      let fotoMarkup = area.foto 
        ? `<img src="${area.foto}" alt="Area Reservasi" class="foto-utama" onerror="this.outerHTML='<div class=\"foto-placeholder\">Foto area tidak tersedia</div>'">`
        : `<div class="foto-placeholder">Foto area tidak tersedia</div>`;

      return `
        <article class="res-card light">
          <div class="res-card-grid">
            <div class="res-card-media">
              ${fotoMarkup}
            </div>
            <div class="res-card-info">
              <h2 class="nama-area-teks"></h2>
              <div class="subtitle">AREA RESERVASI CAFÉ ÁCALA</div>
              <button type="button" class="btn-pilih-reservasi" onclick="PilihAreaDariCard('${area.id}')">PILIH AREA INI</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Keamanan Tampilan: Menerapkan textContent untuk nama area agar aman dari injeksi
    const judulCardElements = container.querySelectorAll('.nama-area-teks');
    dataArea.forEach((area, index) => {
      if (judulCardElements[index]) {
        judulCardElements[index].textContent = area.nama;
      }
    });

    // Render Dropdown Form
    selectArea.innerHTML = '<option value="">-- Pilih Area Reservasi --</option>' + 
      dataArea.map(a => `<option value="${a.nama}">${a.nama}</option>`).join('');
    selectArea.disabled = false;

  } catch (error) {
    console.error(error);
    skeleton.style.display = 'none';
    container.innerHTML = `
      <div class="p-4 text-center text-danger bg-light rounded-4">
        <p class="fw-bold mb-1">Gagal memuat data area reservasi.</p>
        <small class="text-muted">Terjadi kesalahan pada server. Silakan muat ulang halaman.</small>
      </div>
    `;
    container.style.display = 'block';
    selectArea.innerHTML = '<option value="">-- Gagal Memuat Area --</option>';
    selectArea.disabled = true;
  }
}

async function MuatDataJamOperasional() {
  try {
    // Opsional fetch jam operasional backend jika tersedia
  } catch (e) {
    console.warn("Menggunakan data jam operasional default.");
  }
}

function PilihAreaDariCard(idArea) {
  const areaDitemukan = areaListGlobal.find(a => a.id == idArea);
  if (areaDitemukan) {
    const selectArea = document.getElementById('areaSelect');
    selectArea.value = areaDitemukan.nama;
    document.querySelector('.form-reservasi-section').scrollIntoView({ behavior: 'smooth' });
  }
}

function HandlePerubahanTanggal(e) {
  const tglVal = e.target.value;
  const selectJam = document.getElementById('jam');
  const infoHari = document.getElementById('infoHari');

  if (!tglVal) {
    selectJam.innerHTML = '<option value="">-- Pilih tanggal terlebih dahulu --</option>';
    selectJam.disabled = true;
    infoHari.innerText = '';
    return;
  }

  const dateObj = new Date(tglVal + 'T00:00:00');
  const hariIndex = dateObj.getDay(); 
  const opsiHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const namaHari = opsiHari[hariIndex];

  infoHari.innerText = `Hari: ${namaHari}`;

  const jadwalHariIni = jamOperasionalData[hariIndex];

  if (jadwalHariIni && jadwalHariIni.tutupStatus) {
    selectJam.innerHTML = `<option value="">Kafe TUTUP pada hari ${namaHari}</option>`;
    selectJam.disabled = true;
    infoHari.innerHTML += ` <span class="text-danger fw-bold">(Hari Tutup)</span>`;
    return;
  }

  selectJam.disabled = false;
  let jamOptionsHtml = '<option value="">-- Pilih Jam Kedatangan --</option>';

  let jamBuka = 13;
  let jamTutup = 21;

  const isToday = tglVal === new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  for (let h = jamBuka; h <= jamTutup; h++) {
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

document.getElementById('formReservasiAcala').addEventListener('submit', function(event) {
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
});

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
  document.getElementById('pesanPeringatan').innerText = pesan;
  document.getElementById('modalPeringatan').classList.add('aktif');
}

function tutupModalPeringatan() {
  document.getElementById('modalPeringatan').classList.remove('aktif');
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

  document.getElementById('loadingBarContainer').style.display = 'none';
  document.getElementById('konfirmasiButtonWrapper').style.display = 'flex';
  document.getElementById('modalKonfirmasi').classList.add('aktif');
}

function tutupModalKonfirmasi() {
  document.getElementById('modalKonfirmasi').classList.remove('aktif');
}

function prosesKonfirmasiOK() {
  const loadingContainer = document.getElementById('loadingBarContainer');
  const progressBar = document.getElementById('progressBarFill');
  const btnWrapper = document.getElementById('konfirmasiButtonWrapper');

  btnWrapper.style.display = 'none';
  loadingContainer.style.display = 'block';
  progressBar.style.width = '0%';

  let width = 0;
  const interval = setInterval(() => {
    width += 10;
    progressBar.style.width = width + '%';
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
    document.getElementById('fallbackTextarea').value = pesanTeks;
    document.getElementById('linkManualWA').href = urlWA;
    document.getElementById('modalFallbackWA').classList.add('aktif');
  }
}

function salinPesanFallback() {
  const textarea = document.getElementById('fallbackTextarea');
  textarea.select();
  textarea.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(textarea.value).then(() => {
    alert('Pesan berhasil disalin! Silakan tempel (paste) ke chat WhatsApp Café Ácala.');
  }).catch(() => {
    alert('Gagal menyalin teks secara otomatis.');
  });
}

function tutupModalFallback() {
  document.getElementById('modalFallbackWA').classList.remove('aktif');
}