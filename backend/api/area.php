<?php
// GET /api/area.php
// Card 12.2.1 - API data area reservasi: foto dan nama area untuk halaman Reservasi,
// sekaligus sumber pilihan area pada form reservasi (card 12.4). Publik, tanpa login.
//
// Data = baris tabel `area` berstatus aktif, diurutkan menurut kolom `urutan`.
// Hanya id, nama, satu foto, dan urutan per area. Deskripsi, lantai, dan jenis sengaja tidak dikirim.
// Card 12.4.1: field urutan (urutan tampil tetap) ditambahkan untuk galeri dan pop-up foto;
// field id, nama, dan foto tidak berubah. Foto yang sama dipakai untuk galeri dan tampilan besar.
// id di sini sama dengan id_area pada data aturan reservasi (card 12.3.1).

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();

// Error code 'ARE-5001' untuk simulasi error
simulate_error('Data area reservasi gagal dimuat', 'ARE-5001');

try {
    $stmt = db()->query(
        'SELECT id, nama_area, foto, urutan
           FROM area
          WHERE status = \'aktif\'
          ORDER BY urutan, id'
    );

    $folderBackend = dirname(__DIR__);   // folder backend, tempat folder uploads/

    $data = array_map(static function (array $r) use ($folderBackend): array {
        // Foto area belum ada: kirim null, FE yang menampilkan gambar placeholder
        $foto = ($r['foto'] === null || trim($r['foto']) === '') ? null : $r['foto'];

        // Path ada di database tetapi berkasnya tidak ada di server: anggap foto tidak tersedia (null)
        if ($foto !== null && !is_file($folderBackend . '/' . $foto)) {
            $foto = null;
        }

        return [
            'id'     => (int) $r['id'],
            'nama'   => $r['nama_area'],
            'foto'   => $foto,   // path relatif, contoh: uploads/area/indoor-tertutup-lantai1.png (null = tidak tersedia)
            'urutan' => (int) $r['urutan'],   // card 12.4.1: urutan tampil tetap (naik), untuk galeri dan tombol > dan <
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