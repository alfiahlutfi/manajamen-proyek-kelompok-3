<?php
// backend/config/foto_menu.php
// Penyimpanan foto menu (card 14.4.1, tahap awal): foto diterima dan disimpan APA ADANYA,
// tanpa dipangkas atau diubah ukurannya. Pemeriksaan transparansi serta perapian foto
// (pangkas area kosong, kecilkan ukuran) disambungkan oleh card 14.5.1 pada fungsi di file ini.
//
// Pemeriksaan minimum yang tetap dilakukan sejak sekarang demi keamanan (berkas yang
// diunggah tidak boleh sembarang isi): isi berkas harus benar-benar PNG (bukan dari nama
// atau ekstensi) dan ukurannya maksimal 2 MB. Di folder uploads/ disarankan ada .htaccess
// yang menonaktifkan eksekusi PHP.

const FOTO_FOLDER    = 'uploads/menu';       // relatif terhadap folder backend/
const FOTO_MAKS_BYTE = 2 * 1024 * 1024;      // 2 MB

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
 * Periksa berkas unggahan: PNG sungguhan dan maksimal 2 MB.
 * Mengembalikan path berkas sementara; jika tidak sesuai, langsung mengirim respons gagal.
 * (Card 14.5.1 menambahkan pemeriksaan transparansi dan perapian di sini.)
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

/**
 * Pindahkan foto yang sudah diperiksa ke folder foto menu dengan nama acak.
 * Mengembalikan path relatif untuk database, contoh: uploads/menu/cafe-latte-3fa91c2e.png
 */
function foto_simpan(string $tmp, string $namaMenu): string
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
    if (!move_uploaded_file($tmp, $dir . '/' . $file)) {
        throw new RuntimeException('foto gagal dipindahkan ke folder tujuan');
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