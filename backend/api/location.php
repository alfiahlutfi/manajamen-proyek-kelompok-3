<?php
// GET /api/location.php
// Card 3.1 - API lokasi cafe (alamat, tautan Google Maps, URL embed peta). Publik, tanpa login.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();
simulate_error('Lokasi cafe gagal dimuat', 'LOC-5001');

try {
    $stmt = db()->query(
        'SELECT alamat, link_maps, maps_embed_url
           FROM cafe
          ORDER BY id
          LIMIT 1'
    );
    $row = $stmt->fetch();

    if (!$row) {
        respond(404, false, 'Data lokasi cafe belum tersedia', null, 'LOC-4041');
    }

    respond(200, true, 'Lokasi cafe berhasil diambil', $row);

} catch (PDOException $e) {
    error_log('[location.php] ' . $e->getMessage());
    respond(500, false, 'Lokasi cafe gagal dimuat', null, 'LOC-5002');
}
