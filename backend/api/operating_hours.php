<?php
// GET /api/operating_hours.php
// Card 2.1 - API jam operasional cafe (hari + jam buka/tutup, 7 hari). Publik, tanpa login.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();
simulate_error('Jam operasional gagal dimuat', 'OPH-5001');

try {
    $stmt = db()->query(
        'SELECT cafe_id, hari, is_closed, jam_buka, jam_tutup
           FROM operating_hours
          WHERE cafe_id = (SELECT id FROM cafe ORDER BY id LIMIT 1)
          ORDER BY urutan'
    );
    $rows = $stmt->fetchAll();

    if (!$rows) {
        respond(404, false, 'Data jam operasional belum tersedia', null, 'OPH-4041');
    }

    // Rapikan: is_closed jadi true/false, jam "11:00:00" jadi "11:00"
    $data = array_map(static function (array $r): array {
        $closed = (bool) $r['is_closed'];
        return [
            'cafe_id'   => $r['cafe_id'], 
            'hari'      => $r['hari'],
            'is_closed' => $closed,
            'jam_buka'  => (!$closed && $r['jam_buka'])  ? substr($r['jam_buka'], 0, 5)  : null,
            'jam_tutup' => (!$closed && $r['jam_tutup']) ? substr($r['jam_tutup'], 0, 5) : null,
        ];
    }, $rows);

    respond(200, true, 'Jam operasional berhasil diambil', $data);

} catch (PDOException $e) {
    error_log('[operating_hours.php] ' . $e->getMessage());
    respond(500, false, 'Jam operasional gagal dimuat', null, 'OPH-5002');
}
