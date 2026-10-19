/* =========================================================
   TAMPILAN MEMUAT (skeleton dari assets/home.svg)
   Tampil saat: buka pertama kali, buka dari link luar, atau REFRESH.
   Dilewati hanya saat berpindah dari halaman lain di situs ini
   (misalnya balik dari menu.html) atau tombol Back/Forward.
   ========================================================= */
"use strict";

// Skeleton minimal tampil selama ini (ms), supaya tidak berkedip
const WAKTU_MINIMUM_MS = 1200;
// Batas maksimal skeleton tampil (ms), jaga-jaga kalau selesaiMemuat() tidak pernah dipanggil
const BATAS_WAKTU_MS = 4000;

const waktuMulai = performance.now();
let timerLoading = null;
let sedangMenunggu = false;
let sudahSelesai = false;

function lewatiSkeleton() {
  try {
    const nav = performance.getEntriesByType("navigation")[0];
    const tipe = nav ? nav.type : "navigate";

    if (tipe === "reload") return false;        // refresh -> tampilkan skeleton
    if (tipe === "back_forward") return true;   // tombol Back/Forward -> lewati

    // Klik link dari halaman lain di situs ini -> lewati
    if (document.referrer) {
      return new URL(document.referrer).origin === location.origin;
    }
    return false;                               // buka baru / ketik URL -> tampilkan
  } catch (e) {
    return false;
  }
}

const lewati = lewatiSkeleton();

function hilangkanSkeleton() {
  sudahSelesai = true;
  clearTimeout(timerLoading);
  if (document.body) document.body.classList.remove("loading");
}

// pakaiMinimum = true -> pastikan skeleton sudah tampil minimal WAKTU_MINIMUM_MS
function matikanLoading(pakaiMinimum) {
  if (sudahSelesai || sedangMenunggu) return;

  const sisa = pakaiMinimum
    ? WAKTU_MINIMUM_MS - (performance.now() - waktuMulai)
    : 0;

  if (sisa > 0) {
    sedangMenunggu = true;
    setTimeout(() => {
      sedangMenunggu = false;
      hilangkanSkeleton();
    }, sisa);
    return;
  }

  hilangkanSkeleton();
}

// DIDEFINISIKAN DI LEVEL ATAS supaya selalu tersedia saat Acala.ready() memanggilnya.
window.selesaiMemuat = function () {
  matikanLoading(!lewati);
};

document.addEventListener("DOMContentLoaded", () => {
  const skeleton = document.getElementById("skeleton");

  if (!skeleton || lewati) {
    matikanLoading(false);
    return;
  }

  // Body sudah punya class "loading" dari HTML.
  // Pengaman: matikan paksa kalau selesaiMemuat() tidak pernah dipanggil.
  if (!sudahSelesai) {
    timerLoading = setTimeout(() => matikanLoading(false), BATAS_WAKTU_MS);
  }
});