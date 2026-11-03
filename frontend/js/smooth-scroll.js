/* js/smooth-scroll.js - Smooth scroll "inersia" (tanpa library)
   ----------------------------------------------------------------------------
   Browser biasanya menggeser halaman per "klik" roda mouse (loncat 100px sekian
   kali). Skrip ini membuat roda mouse hanya menentukan TUJUAN scroll, lalu halaman
   meluncur ke tujuan itu dengan interpolasi (lerp) di setiap frame, sehingga
   gerakannya mengalir dan berhenti perlahan. Ini prinsip yang sama dengan library
   Lenis yang banyak dipakai situs modern.

   - Hanya aktif untuk mouse/trackpad. Layar sentuh memakai scroll bawaan (sudah ber-inersia).
   - Mati otomatis bila perangkat memilih "kurangi gerakan".
   - Elemen dengan atribut data-lenis-prevent / data-scroll-prevent, popup galeri, dan
     area yang bisa discroll sendiri tetap memakai scroll bawaan.
   - Keyboard, drag scrollbar, dan link anchor tetap bekerja (posisi disinkronkan).
*/
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sentuh = window.matchMedia("(pointer: coarse)").matches;
  if (reduce || sentuh) return;

  var root = document.documentElement;
  var LERP = 0.1;                 // 0.05 = lebih licin/lambat, 0.2 = lebih responsif
  var target = window.scrollY;    // posisi tujuan
  var sekarang = target;          // posisi yang sedang digambar
  var berjalan = false;
  var terakhir = 0;

  function batas() { return Math.max(0, root.scrollHeight - window.innerHeight); }
  function jepit(n) { return Math.min(Math.max(n, 0), batas()); }

  // Elemen di dalam area yang punya scroll sendiri (mis. popup) tidak ikut dihaluskan.
  function bolehDihaluskan(el) {
    for (var n = el; n && n !== document.body && n.nodeType === 1; n = n.parentElement) {
      if (n.hasAttribute("data-lenis-prevent") || n.hasAttribute("data-scroll-prevent")) return false;
      if (n.classList && n.classList.contains("galeri-popup")) return false;
      var s = window.getComputedStyle(n);
      if ((s.overflowY === "auto" || s.overflowY === "scroll") && n.scrollHeight > n.clientHeight) return false;
    }
    return true;
  }

  function langkah(waktu) {
    var dt = Math.min(waktu - terakhir, 64);           // ms, dibatasi agar tidak loncat saat tab lambat
    terakhir = waktu;
    var faktor = 1 - Math.pow(1 - LERP, dt / 16.667);  // lerp tidak bergantung pada refresh rate layar
    sekarang += (target - sekarang) * faktor;

    if (Math.abs(target - sekarang) < 0.4) {
      sekarang = target;
      berjalan = false;
    }
    window.scrollTo(0, sekarang);
    if (berjalan) requestAnimationFrame(langkah);
    else root.classList.remove("smooth-jalan");
  }

  function mulai() {
    if (berjalan) return;
    berjalan = true;
    terakhir = performance.now();
    root.classList.add("smooth-jalan");
    requestAnimationFrame(langkah);
  }

  window.addEventListener("wheel", function (e) {
    if (e.ctrlKey || e.defaultPrevented) return;                       // pinch-zoom / sudah ditangani
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;               // gerak horizontal: biarkan
    if (document.body.classList.contains("popup-buka")) return;
    if (!bolehDihaluskan(e.target)) return;

    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 40;                                   // satuan baris
    else if (e.deltaMode === 2) dy *= window.innerHeight;              // satuan halaman

    e.preventDefault();
    if (!berjalan) sekarang = window.scrollY;
    target = jepit(target + dy);
    mulai();
  }, { passive: false });

  // Sinkronkan bila posisi berubah karena hal lain (keyboard, drag scrollbar, anchor, dll).
  window.addEventListener("scroll", function () {
    if (berjalan) return;
    target = sekarang = window.scrollY;
  }, { passive: true });

  window.addEventListener("resize", function () {
    target = jepit(target);
    if (!berjalan) sekarang = target = jepit(window.scrollY);
  });
})();