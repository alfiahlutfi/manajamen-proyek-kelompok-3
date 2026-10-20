<?php
// GET /api/carousel.php
// Card 6.1 - Event pilihan untuk carousel di beranda (maksimal 3). Publik, tanpa login.
//
// Pemilihan event oleh admin = tabel `carousel` (id_event, urutan, status):
// baris carousel berstatus aktif + event berstatus aktif, diurutkan menurut `urutan`.
// Detail satu event diambil lewat GET /api/event.php?id={id}.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

const MAX_EVENT_PILIHAN = 3;

only_get();
simulate_error('Event pilihan gagal dimuat');

try {
    $stmt = db()->query(
        'SELECT e.id, e.nama, e.foto, e.deskripsi, e.tanggal
           FROM carousel c
           JOIN event e ON e.id = c.id_event
          WHERE c.status = \'aktif\'
            AND e.status = \'aktif\'
          ORDER BY c.urutan, c.id
          LIMIT ' . MAX_EVENT_PILIHAN
    );

    $data = array_map(static function (array $r): array {
        return [
            'id'        => (int) $r['id'],   // id event, dipakai untuk memanggil detail
            'nama'      => $r['nama'],
            'foto'      => $r['foto'],       // path relatif, contoh: uploads/event/open-mic.png
            'deskripsi' => $r['deskripsi'],
            'tanggal'   => $r['tanggal'],    // format YYYY-MM-DD, FE yang memformat tampilannya
        ];
    }, $stmt->fetchAll());

    // Belum ada event pilihan: bukan error, FE yang memutuskan tampilannya
    if (!$data) {
        respond(200, true, 'Belum ada event pilihan', []);
    }

    respond(200, true, 'Event pilihan berhasil diambil', $data);

} catch (PDOException $e) {
    error_log('[carousel.php] ' . $e->getMessage());
    respond(500, false, 'Event pilihan gagal dimuat');
}