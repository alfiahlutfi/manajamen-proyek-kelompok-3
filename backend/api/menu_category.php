<?php
// GET /api/menu_category.php
// Card 9.1.1 - API daftar kategori menu untuk halaman Menu. Publik, tanpa login.
//
// Kategori yang dikirim = baris tabel `menu_category` berstatus aktif,
// diurutkan menurut kolom `urutan`. Daftar menu per kategori diambil lewat
// GET /api/menu.php?category_id={id}.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();
simulate_error('Daftar kategori menu gagal dimuat', 'KTG-5001');

try {
    $stmt = db()->query(
        'SELECT id, nama, slug
           FROM menu_category
          WHERE status = \'aktif\'
          ORDER BY urutan, id'
    );

    $data = array_map(static function (array $r): array {
        return [
            'id'   => (int) $r['id'],   // dipakai sebagai category_id di menu.php
            'nama' => $r['nama'],
            'slug' => $r['slug'],
        ];
    }, $stmt->fetchAll());

    // Belum ada kategori: bukan error, FE yang memutuskan tampilannya
    if (!$data) {
        respond(200, true, 'Belum ada kategori menu', []);
    }

    respond(200, true, 'Daftar kategori menu berhasil diambil', $data);

} catch (PDOException $e) {
    error_log('[menu_category.php] ' . $e->getMessage());
    respond(500, false, 'Daftar kategori menu gagal dimuat', null, 'KTG-5002');
}