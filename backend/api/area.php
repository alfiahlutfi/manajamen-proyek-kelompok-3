<?php
// GET /api/area.php
// Card 12.2.1 - API data area reservasi: foto dan nama area untuk halaman Reservasi,
// sekaligus sumber pilihan area pada form reservasi (card 12.4). Publik, tanpa login.
//
// Data = baris tabel `area` berstatus aktif, diurutkan menurut kolom `urutan`.
// Hanya id, nama, dan satu foto per area. Deskripsi, lantai, dan jenis sengaja tidak dikirim.
// id di sini sama dengan id_area pada data aturan reservasi (card 12.3.1).

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();

// Error code 'ARE-5001' untuk simulasi error
simulate_error('Data area reservasi gagal dimuat', 'ARE-5001');

try {
    $stmt = db()->query(
        'SELECT id, nama_area, foto
           FROM area
          WHERE status = \'aktif\'
          ORDER BY urutan, id'
    );

    $data = array_map(static function (array $r): array {
        // Foto area belum ada: kirim null, FE yang menampilkan gambar placeholder
        $foto = ($r['foto'] === null || trim($r['foto']) === '') ? null : $r['foto'];

        return [
            'id'   => (int) $r['id'],
            'nama' => $r['nama_area'],
            'foto' => $foto,   // path relatif, contoh: uploads/gallery/area-indoor1.png (boleh null)
        ];
    }, $stmt->fetchAll());

    // Belum ada area: bukan error, FE yang memutuskan tampilannya
    if (!$data) {
        respond(200, true, 'Belum ada area reservasi', []);
    }

    respond(200, true, 'Area reservasi berhasil diambil', $data);

} catch (PDOException $e) {
    error_log('[area.php] ' . $e->getMessage());
    respond(500, false, 'Data area reservasi gagal dimuat', null, 'ARE-5002');
}