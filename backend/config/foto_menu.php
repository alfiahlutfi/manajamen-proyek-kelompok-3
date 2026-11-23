<?php
// backend/config/foto_menu.php
// Pemeriksaan, perapian, dan penyimpanan foto menu (card 14.4.1 dan 14.5.1).
//
// Aturan foto:
//   1. Harus PNG sungguhan (dinilai dari isi berkas), maksimal 2 MB, dimensi wajar.
//   2. Harus berlatar transparan: foto tanpa alpha channel, atau yang hampir seluruh pikselnya buram, ditolak.
//   3. Area kosong di sekeliling objek DIPANGKAS sampai tepi gambar rapat dengan objek. Piksel semi-transparan
//      (tepi halus, bagian objek yang tembus pandang seperti gelas) tetap dipertahankan.
//   4. Jika lebih besar dari ukuran maksimum, foto DIKECILKAN dengan perbandingan tetap. Foto tidak pernah diperbesar.
//   5. BE tidak menghapus latar belakang, tidak menaruh objek di kanvas tetap, dan tidak menulis posisi atau
//      bayangan ke file. Ukuran tampil, bingkai, posisi, dan bayangan diatur FE lewat CSS.
//   6. Foto yang sudah ada tidak diolah ulang. Hasil selalu disimpan ulang oleh GD, sehingga metadata dan
//      isi tambahan di dalam berkas PNG asli tidak ikut tersimpan.
// Di folder uploads/ disarankan ada .htaccess yang menonaktifkan eksekusi PHP.

const FOTO_FOLDER    = 'uploads/menu';       // relatif terhadap folder backend/
const FOTO_MAKS_BYTE = 2 * 1024 * 1024;      // 2 MB (berkas yang diunggah)

// Ukuran maksimum hasil foto, dari desain UI/UX (Frame 57): foto tampil 112,11 x 193,28 px,
// dibulatkan ke 112 x 193. Foto hasil pangkas yang melebihi salah satunya dikecilkan dengan
// perbandingan tetap (tidak pernah diperbesar).
// Ukuran bingkai berubah? Cukup ganti dua angka ini (hanya berlaku untuk foto yang diunggah sesudahnya).
const FOTO_MAKS_LEBAR  = 112;                // piksel
const FOTO_MAKS_TINGGI = 193;                // piksel

// Batas pengaman terhadap foto raksasa (memori GD sekitar lebar x tinggi x 4 byte)
const FOTO_BATAS_SISI   = 6000;              // piksel per sisi
const FOTO_BATAS_PIKSEL = 8000000;           // total piksel

// Cara mengenali foto "tidak transparan" dan batas pangkas (skala alpha GD: 0 = buram, 127 = bening)
//  - piksel dianggap transparan jika kurang dari 50% buram (alpha GD >= 64)
//  - foto "tidak transparan" jika piksel transparan kurang dari 0,1% dari seluruh piksel. Ini mencakup PNG tanpa
//    alpha channel dan PNG yang seluruh pikselnya buram.
//  - piksel menjadi bagian objek (tidak ikut dipangkas) jika minimal sekitar 2% buram (alpha GD <= 124)
const FOTO_ALPHA_TRANSPARAN   = 64;
const FOTO_MIN_TRANSPARAN     = 0.001;
const FOTO_ALPHA_MAKS_OBJEK   = 124;

// Foto bersama (placeholder) yang dipakai banyak menu: tidak boleh dihapus dari disk
const FOTO_DILINDUNGI = ['uploads/menu/sample.png'];

/** Ukuran dari nilai php.ini seperti "8M" menjadi byte. */
function foto_ukuran_ini(string $nilai): int
{
    $nilai = trim($nilai);
    if ($nilai === '') {
        return 0;
    }
    $angka = (int) $nilai;
    switch (strtolower(substr($nilai, -1))) {
        case 'g': $angka *= 1024; // no break
        case 'm': $angka *= 1024; // no break
        case 'k': $angka *= 1024;
    }
    return $angka;
}

/**
 * Request multipart lebih besar dari post_max_size membuat PHP mengosongkan $_POST dan $_FILES.
 * Pada kasus itu jawab sebagai foto terlalu besar, bukan "data kosong".
 */
function foto_cek_batas_post(): void
{
    $panjang = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    $batas   = foto_ukuran_ini((string) ini_get('post_max_size'));
    if ($batas > 0 && $panjang > $batas && !$_POST && !$_FILES) {
        respond(400, false, 'Ukuran foto maksimal 2 MB', null, 'MNU-4007');
    }
}

/** Ada berkas foto yang benar-benar dikirim? (UPLOAD_ERR_NO_FILE = tidak ada) */
function foto_dikirim(): bool
{
    return isset($_FILES['foto']) && is_array($_FILES['foto'])
        && ($_FILES['foto']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
}

/**
 * Periksa berkas unggahan: PNG sungguhan, maksimal 2 MB, dimensi wajar.
 * Mengembalikan path berkas sementara; jika tidak sesuai, langsung mengirim respons gagal.
 */
function foto_periksa_upload(array $berkas): string
{
    if (is_array($berkas['error'] ?? null) || is_array($berkas['tmp_name'] ?? null)) {
        respond(400, false, 'Foto tidak valid', null, 'MNU-4006');
    }

    $err = $berkas['error'] ?? UPLOAD_ERR_NO_FILE;
    if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
        respond(400, false, 'Ukuran foto maksimal 2 MB', null, 'MNU-4007');
    }
    if ($err === UPLOAD_ERR_PARTIAL) {
        respond(400, false, 'Foto gagal diunggah dengan sempurna, silakan coba lagi', null, 'MNU-4006');
    }
    if ($err !== UPLOAD_ERR_OK) {
        error_log('[foto_menu] kesalahan unggah kode ' . $err);
        respond(500, false, 'Menu gagal disimpan', null, 'MNU-5010');
    }

    $tmp = $berkas['tmp_name'] ?? '';
    if (!is_string($tmp) || $tmp === '' || !is_uploaded_file($tmp)) {
        respond(400, false, 'Foto tidak valid', null, 'MNU-4006');
    }

    // Format dinilai dari ISI berkas, bukan dari nama atau ekstensi
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $info  = @getimagesize($tmp);
    if ($finfo->file($tmp) !== 'image/png' || $info === false || $info[2] !== IMAGETYPE_PNG) {
        respond(400, false, 'Foto harus berformat PNG', null, 'MNU-4006');
    }

    if (filesize($tmp) > FOTO_MAKS_BYTE) {
        respond(400, false, 'Ukuran foto maksimal 2 MB', null, 'MNU-4007');
    }

    [$w, $h] = $info;
    if ($w < 1 || $h < 1 || $w > FOTO_BATAS_SISI || $h > FOTO_BATAS_SISI || ($w * $h) > FOTO_BATAS_PIKSEL) {
        respond(400, false, 'Dimensi foto terlalu besar', null, 'MNU-4015');
    }

    return $tmp;
}

/** Folder foto menu di disk (dibuat jika belum ada). */
function foto_folder_abs(): string
{
    $dir = dirname(__DIR__) . '/' . FOTO_FOLDER;
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('folder foto tidak dapat dibuat');
    }
    return $dir;
}

/** Pastikan memori cukup untuk membuka foto selama diproses; jika tidak, tolak (bukan crash). */
function foto_pastikan_memori(int $w, int $h): void
{
    $batas = foto_ukuran_ini((string) ini_get('memory_limit'));
    if ($batas < 0) {
        return;   // tanpa batas
    }
    $butuh = (int) ($w * $h * 4 * 2.5) + 16 * 1048576;   // foto asli + salinan sementara + cadangan
    $total = memory_get_usage() + $butuh;
    if ($total > $batas) {
        @ini_set('memory_limit', (string) $total);
        $batas = foto_ukuran_ini((string) ini_get('memory_limit'));
        if ($batas >= 0 && $total > $batas) {
            respond(400, false, 'Dimensi foto terlalu besar', null, 'MNU-4015');
        }
    }
}

/** Nilai alpha GD (0 buram .. 127 bening) pada satu piksel. */
function foto_alpha($img, int $x, int $y): int
{
    return (imagecolorat($img, $x, $y) >> 24) & 0x7F;
}

/** Latar transparan? Minimal FOTO_MIN_TRANSPARAN dari seluruh piksel harus transparan. */
function foto_punya_latar_transparan($img, int $w, int $h): bool
{
    $perlu = max(1, (int) ceil($w * $h * FOTO_MIN_TRANSPARAN));
    $ketemu = 0;
    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            if (foto_alpha($img, $x, $y) >= FOTO_ALPHA_TRANSPARAN && ++$ketemu >= $perlu) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Kotak pembatas objek: piksel yang cukup buram (termasuk semi-transparan). Mengembalikan
 * [kiri, atas, lebar, tinggi], atau null jika tidak ada objek sama sekali.
 */
function foto_kotak_objek($img, int $w, int $h): ?array
{
    $atas = null;
    for ($y = 0; $y < $h && $atas === null; $y++) {
        for ($x = 0; $x < $w; $x++) {
            if (foto_alpha($img, $x, $y) <= FOTO_ALPHA_MAKS_OBJEK) { $atas = $y; break; }
        }
    }
    if ($atas === null) {
        return null;
    }

    $bawah = $atas;
    for ($y = $h - 1; $y > $atas; $y--) {
        for ($x = 0; $x < $w; $x++) {
            if (foto_alpha($img, $x, $y) <= FOTO_ALPHA_MAKS_OBJEK) { $bawah = $y; break 2; }
        }
    }

    $kiri = 0;
    for ($x = 0; $x < $w; $x++) {
        for ($y = $atas; $y <= $bawah; $y++) {
            if (foto_alpha($img, $x, $y) <= FOTO_ALPHA_MAKS_OBJEK) { $kiri = $x; break 2; }
        }
    }
    $kanan = $kiri;
    for ($x = $w - 1; $x > $kiri; $x--) {
        for ($y = $atas; $y <= $bawah; $y++) {
            if (foto_alpha($img, $x, $y) <= FOTO_ALPHA_MAKS_OBJEK) { $kanan = $x; break 2; }
        }
    }

    return [$kiri, $atas, $kanan - $kiri + 1, $bawah - $atas + 1];
}

/**
 * Periksa transparansi lalu rapikan: pangkas area kosong (piksel semi-transparan tetap ada), lalu kecilkan
 * dengan perbandingan tetap jika melebihi ukuran maksimum. Mengembalikan isi PNG hasil (string biner).
 * Jika foto tidak berlatar transparan / rusak / tidak berisi objek, langsung mengirim respons gagal.
 */
function foto_rapikan(string $tmp): string
{
    $info = @getimagesize($tmp);
    if ($info === false) {
        respond(400, false, 'Foto rusak atau tidak dapat dibaca', null, 'MNU-4015');
    }
    foto_pastikan_memori((int) $info[0], (int) $info[1]);

    $src = @imagecreatefrompng($tmp);
    if ($src === false) {
        respond(400, false, 'Foto rusak atau tidak dapat dibaca', null, 'MNU-4015');
    }
    imagepalettetotruecolor($src);
    imagealphablending($src, false);
    imagesavealpha($src, true);
    $w = imagesx($src);
    $h = imagesy($src);

    // 1. Latar harus transparan
    if (!foto_punya_latar_transparan($src, $w, $h)) {
        imagedestroy($src);
        respond(400, false, 'Foto harus berlatar transparan', null, 'MNU-4014');
    }

    // 2. Pangkas area kosong di sekeliling objek
    $kotak = foto_kotak_objek($src, $w, $h);
    if ($kotak === null) {
        imagedestroy($src);
        respond(400, false, 'Foto tidak berisi objek', null, 'MNU-4015');
    }
    [$kx, $ky, $kw, $kh] = $kotak;

    // 3. Kecilkan dengan perbandingan tetap jika melebihi ukuran maksimum (tidak pernah diperbesar)
    $skala = min(1.0, FOTO_MAKS_LEBAR / $kw, FOTO_MAKS_TINGGI / $kh);
    $nw = max(1, (int) round($kw * $skala));
    $nh = max(1, (int) round($kh * $skala));

    $hasil = imagecreatetruecolor($nw, $nh);
    imagealphablending($hasil, false);
    imagesavealpha($hasil, true);
    imagefill($hasil, 0, 0, imagecolorallocatealpha($hasil, 0, 0, 0, 127));
    if ($nw === $kw && $nh === $kh) {
        imagecopy($hasil, $src, 0, 0, $kx, $ky, $kw, $kh);                       // tanpa pengolahan ulang piksel
    } else {
        imagecopyresampled($hasil, $src, 0, 0, $kx, $ky, $nw, $nh, $kw, $kh);    // alpha ikut diinterpolasi
    }
    imagedestroy($src);

    ob_start();
    $ok    = imagepng($hasil, null, 9);
    $biner = (string) ob_get_clean();
    imagedestroy($hasil);

    if (!$ok || $biner === '') {
        throw new RuntimeException('imagepng gagal');
    }
    return $biner;
}

/**
 * Tulis foto hasil perapian ke folder foto menu dengan nama acak.
 * Mengembalikan path relatif untuk database, contoh: uploads/menu/cafe-latte-3fa91c2e.png
 */
function foto_simpan(string $biner, string $namaMenu): string
{
    $dir   = foto_folder_abs();
    $dasar = slugify($namaMenu, '-', 40);
    $file  = '';
    for ($i = 0; $i < 5; $i++) {
        $file = $dasar . '-' . bin2hex(random_bytes(4)) . '.png';
        if (!file_exists($dir . '/' . $file)) {
            break;
        }
    }
    if (file_put_contents($dir . '/' . $file, $biner, LOCK_EX) === false) {
        throw new RuntimeException('foto gagal ditulis ke folder tujuan');
    }
    @chmod($dir . '/' . $file, 0644);
    return FOTO_FOLDER . '/' . $file;
}

/** Hapus file fisik berdasarkan path relatif (aman: hanya di folder foto menu, bukan yang dilindungi). */
function foto_hapus_file(?string $path): void
{
    if ($path === null || $path === '' || in_array($path, FOTO_DILINDUNGI, true)) {
        return;
    }
    if (!preg_match('#^' . preg_quote(FOTO_FOLDER, '#') . '/[A-Za-z0-9._-]+\.png$#', $path)) {
        return;
    }
    $abs = dirname(__DIR__) . '/' . $path;
    if (is_file($abs)) {
        @unlink($abs);
    }
}

/**
 * Hapus foto lama hanya jika TIDAK dipakai menu lain. Beberapa menu memakai satu foto
 * bersama (contoh: uploads/menu/sample.png), jadi file tidak boleh dihapus sembarangan.
 */
function foto_bersihkan(PDO $pdo, ?string $path, int $kecualiMenuId): void
{
    if ($path === null || $path === '') {
        return;
    }
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM menu WHERE foto = :foto AND id <> :id');
    $stmt->execute([':foto' => $path, ':id' => $kecualiMenuId]);
    if ((int) $stmt->fetchColumn() === 0) {
        foto_hapus_file($path);
    }
}