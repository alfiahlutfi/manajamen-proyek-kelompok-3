<?php
// GET /api/gallery.php
// Card 10.1.1 - API daftar foto galeri untuk halaman Galeri. Publik, tanpa login.
//
// Foto yang dikirim = baris tabel `gallery` berstatus aktif, diurutkan menurut kolom `urutan`.
// Data yang dikirim hanya id dan foto (path relatif). Kolom judul dan deskripsi tersedia di tabel
// bila FE membutuhkannya (misalnya untuk teks alt), tinggal ditambahkan di SELECT dan array di bawah.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();

// Error code 'GAL-5001' untuk simulasi error
simulate_error('Foto galeri gagal dimuat', 'GAL-5001');

try {
    $stmt = db()->query(
        'SELECT id, foto
           FROM gallery
          WHERE status = \'aktif\'
          ORDER BY urutan, id'
    );

    $data = array_map(static function (array $r): array {
        return [
            'id'   => (int) $r['id'],
            'foto' => $r['foto'],   // path relatif, contoh: uploads/gallery/suasana1.png
        ];
    }, $stmt->fetchAll());

    // Belum ada foto galeri: bukan error, FE yang memutuskan tampilannya
    if (!$data) {
        respond(200, true, 'Belum ada foto galeri', []);
    }

    respond(200, true, 'Foto galeri berhasil diambil', $data);

} catch (PDOException $e) {
    error_log('[gallery.php] ' . $e->getMessage());
    respond(500, false, 'Foto galeri gagal dimuat', null, 'GAL-5002');
}