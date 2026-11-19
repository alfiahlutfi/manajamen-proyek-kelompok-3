/* =========================================================
   SKELETON HALAMAN PENUH (navbar + isi + footer)
   Dipakai SAMA di semua halaman (Beranda, Menu, Event, Gallery, Reservasi).

   Cara kerja:
   - <body class="skel-aktif"> + <div id="skel-halaman"> di HTML = skeleton tampil.
     Navbar, isi <main>, dan footer asli disembunyikan (lihat style.css), tetapi
     tetap ikut dihitung ukurannya sehingga JS halaman bisa mengisinya di belakang layar.
   - Data siap        -> AcalaSkeleton.sembunyi()
   - Pemuatan gagal   -> AcalaSkeleton.gagal("pesan", fungsiMuatUlang):
                         skeleton tetap tampil, pesan + tombol "Muat ulang" muncul di atasnya.
   ========================================================= */
"use strict";

(function () {
  // Pengaman: kalau skrip halaman tidak pernah memanggil sembunyi()/gagal(), skeleton dilepas otomatis (ms)
  const BATAS_WAKTU_MS = 15000;
  let timer = null;

  function aktif() {
    return document.body.classList.contains("skel-aktif");
  }

  function hapusPesan() {
    document.querySelectorAll(".skel-toast").forEach(el => el.remove());
  }

  function mulaiPengaman() {
    clearTimeout(timer);
    timer = setTimeout(sembunyi, BATAS_WAKTU_MS);
  }

  // Tampilkan skeleton (pemuatan awal atau muat ulang)
  function tampil() {
    hapusPesan();
    document.body.classList.add("skel-aktif");
    mulaiPengaman();
  }

  // Lepas skeleton: navbar, isi, dan footer asli tampil
  function sembunyi() {
    clearTimeout(timer);
    hapusPesan();
    document.body.classList.remove("skel-aktif");
  }

  // Pemuatan gagal: skeleton dipertahankan (tanpa batas waktu)
  function tahan() {
    clearTimeout(timer);
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

  if (aktif()) mulaiPengaman();
})();