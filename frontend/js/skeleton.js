/* =========================================================
   SKELETON HALAMAN PENUH (navbar + isi + footer)
   Dipakai SAMA di semua halaman (Beranda, Menu, Event, Gallery, Reservasi).

   Skeleton TIDAK tampil di awal. Halaman asli langsung terlihat (tanpa jeda kosong).
   Skeleton baru muncul kalau memang ada gangguan:
   - pemuatan data lambat (belum selesai setelah LAMBAT_MS), atau
   - pemuatan gagal (jaringan putus / API error).
   Kalau data siap sebelum LAMBAT_MS (jaringan lancar), skeleton tidak pernah tampil.

   Cara pakai di HTML: cukup sediakan <div id="skel-halaman"> + muat skeleton.js
   (body TIDAK perlu diberi class apa pun).
   - Data siap        -> AcalaSkeleton.sembunyi()
   - Pemuatan gagal   -> AcalaSkeleton.gagal("pesan", fungsiMuatUlang):
                         skeleton langsung tampil, pesan + tombol "Muat ulang" di atasnya.
   ========================================================= */
"use strict";

(function () {
  // Pemuatan dianggap lambat bila belum selesai setelah sekian ms; baru saat itu skeleton muncul
  const LAMBAT_MS = 500;
  // Pengaman: kalau skrip halaman tidak pernah memanggil sembunyi()/gagal(), skeleton dilepas otomatis (ms)
  const BATAS_WAKTU_MS = 15000;
  let timerLambat = null;
  let timerBatas = null;
  let menunggu = false;   // true selama menghitung LAMBAT_MS (skeleton belum tampil)

  const kelas = () => document.body.classList;

  // true selama menunggu data atau saat skeleton tampil
  function aktif() {
    return menunggu || kelas().contains("skel-aktif");
  }

  function hapusPesan() {
    document.querySelectorAll(".skel-toast").forEach(el => el.remove());
  }

  function mulaiPengaman() {
    clearTimeout(timerBatas);
    timerBatas = setTimeout(sembunyi, BATAS_WAKTU_MS);
  }

  // Pemuatan lambat atau gagal -> skeleton tampil
  function munculkan() {
    clearTimeout(timerLambat);
    menunggu = false;
    kelas().add("skel-aktif");
  }

  // Mulai pemuatan (awal atau muat ulang). Halaman asli tetap terlihat; skeleton baru muncul
  // kalau melewati LAMBAT_MS. Kalau skeleton sudah tampil (mis. muat ulang setelah gagal), dibiarkan.
  function tampil() {
    hapusPesan();
    if (!aktif()) {
      menunggu = true;
      clearTimeout(timerLambat);
      timerLambat = setTimeout(munculkan, LAMBAT_MS);
    }
    mulaiPengaman();
  }

  // Data siap: batalkan hitungan / lepas skeleton, halaman asli tampil
  function sembunyi() {
    clearTimeout(timerLambat);
    clearTimeout(timerBatas);
    menunggu = false;
    hapusPesan();
    kelas().remove("skel-aktif");
  }

  // Pemuatan gagal: skeleton langsung tampil dan dipertahankan (tanpa batas waktu)
  function tahan() {
    clearTimeout(timerBatas);
    munculkan();
  }

  // Pemuatan gagal + pesan di atas skeleton. onUlang dipanggil saat "Muat ulang" ditekan.
  function gagal(teks, onUlang) {
    tahan();
    hapusPesan();
    const toast = document.createElement("div");
    toast.className = "skel-toast";
    toast.setAttribute("role", "alert");
    const span = document.createElement("span");
    span.textContent = teks;
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.textContent = "Muat ulang";
    tombol.addEventListener("click", () => {
      tombol.disabled = true;
      if (typeof onUlang === "function") onUlang();
    });
    toast.append(span, tombol);
    document.body.appendChild(toast);
  }

  window.AcalaSkeleton = { tampil, sembunyi, tahan, gagal, aktif };

  // Mulai menghitung sejak skrip ini dimuat (halaman yang punya #skel-halaman)
  if (document.getElementById("skel-halaman")) tampil();
})();