/* js/states.js
   Urutan script: api.js -> states.js -> beranda.js
*/
(() => {
  "use strict";

  const MIN_SKELETON = 1000;

  // Batas waktu request data API. 30 detik memberi ruang untuk koneksi 3G.
  const API_TIMEOUT = 30000;

  // Batas waktu pemuatan foto/media dibuat terpisah dari request API.
  const MEDIA_TIMEOUT = 30000;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const isOffline = () => !navigator.onLine;

  /* ---------- HALAMAN TIDAK ADA KONEKSI ----------
     Layar offline dikelola js/offline.js (aktif di semua halaman). */
  const showOffline = () => { if (window.AcalaOffline) window.AcalaOffline.tampil(); };

  /* ---------- AMBIL DATA API ---------- */

  async function getJSON(url) {
    if (isOffline()) {
      showOffline();
      throw new Error("Tidak ada koneksi internet.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && data.success === false) {
        throw new Error(data.message || "Gagal mengambil data.");
      }

      return data;
    } catch (error) {
      if (isOffline()) {
        showOffline();
      }

      if (error && error.name === "AbortError") {
        console.error("Request API melewati batas waktu 30 detik:", url);
      }

      // Error diteruskan agar section() dapat menampilkan
      // tampilan gagal pada bagian yang bermasalah.
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- CACHE DATA YANG BERHASIL ---------- */

  const once = (fn) => {
    let promise;

    return () => {
      if (!promise) {
        promise = Promise.resolve()
          .then(fn)
          .catch((error) => {
            promise = null;
            throw error;
          });
      }

      return promise;
    };
  };

  /* ---------- TAMPILAN GAGAL MEMUAT PER BAGIAN ---------- */

  function failedBlock(message = "Gagal Memuat Data") {
    const block = document.createElement("div");

    block.className = "block-failed";
    block.setAttribute("role", "alert");

    // Menggunakan assets/muat.svg saat gagal memuat section data
    block.innerHTML = `
      <div class="failed-illustration-wrap">
        <img 
          src="assets/placeholder.png" 
          alt="Gagal Memuat Data" 
          class="failed-illustration-img"
        >
      </div>

      <p class="failed-title">${message}</p>

      <p class="failed-description">
        Data belum dapat ditampilkan. Silakan coba lagi.
      </p>

      <button type="button" class="btn-retry">
        Muat Ulang
      </button>
    `;

    return block;
  }

  /* ---------- LOADING DAN RETRY SETIAP SECTION ---------- */

  function section(box, { loader, h = 200, render }) {
    let requestNumber = 0;

    async function run() {
      const currentRequest = ++requestNumber;

      box.setAttribute("aria-busy", "true");
      box.innerHTML = `
        <div
          class="skel"
          style="height:${h}px"
          aria-label="Memuat data"
        ></div>
      `;

      const startedAt = Date.now();

      try {
        const data = await loader();

        // Skeleton dipertahankan minimal sesuai MIN_SKELETON.
        const remaining = MIN_SKELETON - (Date.now() - startedAt);

        if (remaining > 0) {
          await sleep(remaining);
        }

        if (currentRequest !== requestNumber) return;

        if (isOffline()) {
          showOffline();
          throw new Error("Tidak ada koneksi internet.");
        }

        box.innerHTML = "";
        render(box, data);
      } catch (error) {
        if (currentRequest !== requestNumber) return;

        if (isOffline()) {
          showOffline();
          box.innerHTML = "";
          return;
        }

        console.error("Gagal memuat bagian halaman:", error);

        const failed = failedBlock();
        box.replaceChildren(failed);

        failed.querySelector(".btn-retry").addEventListener("click", () => {
          run();
        });
      } finally {
        if (currentRequest === requestNumber) {
          box.setAttribute("aria-busy", "false");
        }
      }
    }

    return run();
  }

  /* ---------- FOTO / IFRAME ---------- */

  function media(el, source) {
    const host = el && el.parentElement;

    if (!host) {
      return Promise.resolve();
    }

    // Sumber statis kosong = datanya belum ada, bukan gagal memuat
    if (typeof source !== "function" && (!source || !String(source).trim())) {
      host.classList.add("tanpa-foto");
      return Promise.resolve();
    }

    host.classList.add("media-host");

    let overlay = null;
    let attempt = 0;

    function setOverlay(type, html = "") {
      if (!overlay) {
        overlay = document.createElement("div");
        host.appendChild(overlay);
      }

      overlay.className = `media-state media-state--${type}`;
      overlay.innerHTML = html;
    }

    function removeOverlay() {
      if (overlay) overlay.remove();
      overlay = null;
    }

    // Cek status file. 404/410 = file memang tidak ada (belum diunggah),
    // jadi bukan gangguan jaringan dan tidak perlu tombol Muat Ulang.
    async function fileTidakAda(url) {
      if (/^(data|blob):/.test(url)) return false;
      try {
        const res = await fetch(url, { method: "HEAD", cache: "no-store" });
        return res.status === 404 || res.status === 410;
      } catch (e) {
        return false; // jaringan putus / diblokir: tetap dianggap gagal
      }
    }

    function tampilkanKosong() {
      removeOverlay();
      el.onload = null;
      el.onerror = null;
      el.removeAttribute("src");
      el.classList.remove("media-hidden");
      host.classList.add("tanpa-foto");
    }

    function showFailed() {
      el.classList.add("media-hidden");

      setOverlay("failed", `
        <div class="media-state__content">
          <img src="assets/muat.svg" alt="" class="media-state__img">
          <p>Gagal Memuat Foto</p>
          <button type="button" class="btn-retry">Muat Ulang</button>
        </div>
      `);

      overlay.querySelector(".btn-retry").addEventListener("click", retry);
    }

    async function retry() {
      attempt++;
      await tryLoad();   // skeleton hanya di foto yang bersangkutan, bukan seluruh halaman
    }

    async function tryLoad() {
      const startedAt = Date.now();
      let timer;
      let success = false;
      let urlDicoba = "";

      // Foto disembunyikan sampai benar-benar berhasil dimuat
      el.classList.add("media-hidden");
      setOverlay("loading");

      try {
        const src = typeof source === "function" ? await source() : source;

        if (!src) {
          throw new Error("Sumber media tidak tersedia.");
        }

        const srcText = String(src);

        await new Promise((resolve, reject) => {
          const cleanup = () => {
            clearTimeout(timer);
            el.onload = null;
            el.onerror = null;
          };

          el.onload = () => { cleanup(); resolve(); };
          el.onerror = () => { cleanup(); reject(new Error("Media gagal dimuat.")); };

          timer = setTimeout(() => {
            cleanup();
            reject(new Error("Waktu memuat media habis."));
          }, MEDIA_TIMEOUT);

          // Saat Muat Ulang, tambahkan parameter agar browser benar-benar
          // meminta ulang (bukan memakai hasil gagal dari cache).
          const url =
            attempt > 0 && !/^(data|blob):/.test(srcText)
              ? srcText + (srcText.includes("?") ? "&" : "?") + "retry=" + attempt
              : srcText;

          urlDicoba = url;
          el.src = url;
        });

        success = true;
      } catch (error) {
        console.error("Gagal memuat media:", error, urlDicoba);
      }

      let tidakAda = false;
      if (!success && urlDicoba && !isOffline()) {
        tidakAda = await fileTidakAda(urlDicoba);
      }

      // Setelah Muat Ulang, skeleton tampil minimal beberapa detik
      // (baik hasilnya berhasil maupun gagal lagi).
      if (attempt > 0) {
        const remaining = MIN_SKELETON - (Date.now() - startedAt);
        if (remaining > 0) await sleep(remaining);
      }

      if (tidakAda) {
        tampilkanKosong();
        return;
      }

      if (success) {
        removeOverlay();
        el.classList.remove("media-hidden");
        return;
      }

      if (isOffline()) {
        showOffline();
      }

      showFailed();
    }

    return tryLoad();
  }

  window.Acala = {
    getJSON,
    once,
    section,
    media,
    showOffline
  };
})();