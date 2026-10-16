<?php
// GET /api/cafe.php
// Card 1.1 - API profil cafe (foto, judul deskripsi, deskripsi). Publik, tanpa login.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();
simulate_error('Profil cafe gagal dimuat');

try {
    $stmt = db()->query(
        'SELECT id, foto, judul_deskripsi, deskripsi
           FROM cafe
          ORDER BY id
          LIMIT 1'
    );
    $row = $stmt->fetch();

    if (!$row) {
        respond(404, false, 'Data profil cafe belum tersedia');
    }

    // foto sengaja dikirim sebagai path relatif (contoh: uploads/cafe/gambar-about.png),
    // sama persis dengan isi database. FE yang menambahkan alamat backend di depannya.

    respond(200, true, 'Profil cafe berhasil diambil', $row);

} catch (PDOException $e) {
    error_log('[cafe.php] ' . $e->getMessage());
    respond(500, false, 'Profil cafe gagal dimuat');
}