<?php
// GET /api/cafe.php
// Card 1.1 - API profil cafe (foto, judul deskripsi, deskripsi). Publik, tanpa login.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();

// 1. PERBAIKAN: Ditambah parameter kedua untuk error code
simulate_error('Profil cafe gagal dimuat', 'CAF-5001');

try {
    $stmt = db()->query(
        'SELECT id, foto, judul_deskripsi, deskripsi
           FROM cafe
          ORDER BY id
          LIMIT 1'
    );
    $row = $stmt->fetch();

    if (!$row) {
        // 2. PERBAIKAN: Ditambah null dan kode error 'CAF-4041'
        respond(404, false, 'Data profil cafe belum tersedia', null, 'CAF-4041');
    }

    // foto sengaja dikirim sebagai path relatif
    respond(200, true, 'Profil cafe berhasil diambil', $row);

} catch (PDOException $e) {
    error_log('[cafe.php] ' . $e->getMessage());
    // 3. PERBAIKAN: Ditambah null dan kode error 'CAF-5002'
    respond(500, false, 'Profil cafe gagal dimuat', null, 'CAF-5002');
}    
