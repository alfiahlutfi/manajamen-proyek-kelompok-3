<?php
// GET /api/gallery.php
// Mode yang didukung:
//   (tanpa parameter)  -> daftar foto galeri untuk halaman Galeri (card 10.1.1).
//   ?id={id}           -> detail satu foto galeri: id, foto, judul (card 10.2.1).
// Publik, tanpa login. Hanya foto berstatus aktif yang dikirim.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

/**
 * Card 10.1.1 - Daftar foto galeri.
 * Baris tabel `gallery` berstatus aktif, diurutkan menurut kolom `urutan`.
 * Data yang dikirim hanya id dan foto (path relatif).
 */
function kirim_daftar_galeri(): void
{
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
}

/**
 * Card 10.2.1 - Detail foto galeri berdasarkan ID foto.
 * GET /api/gallery.php?id={id}
 * Hanya foto berstatus aktif (sama dengan syarat daftar galeri di card 10.1.1).
 */
function kirim_detail_galeri(): void
{
    simulate_error('Detail foto galeri gagal dimuat', 'GAL-5003');

    $id = $_GET['id'];
    if (!is_string($id) || !ctype_digit($id) || (int) $id < 1) {
        respond(400, false, 'Parameter id tidak valid', null, 'GAL-4001');
    }

    try {
        $stmt = db()->prepare(
            'SELECT id, foto, judul, deskripsi
               FROM gallery
              WHERE id = :id AND status = \'aktif\'
              LIMIT 1'
        );
        $stmt->execute([':id' => (int) $id]);
        $r = $stmt->fetch();

        if (!$r) {
            respond(404, false, 'Foto galeri tidak ditemukan', null, 'GAL-4041');
        }

        respond(200, true, 'Detail foto galeri berhasil diambil', [
            'id'    => (int) $r['id'],
            'foto'  => $r['foto'],    // path relatif, contoh: uploads/gallery/suasana1.png
            'judul' => $r['judul'],   // judul atau nama kegiatan foto
            'deskripsi' => $r['deskripsi'],
        ]);

    } catch (PDOException $e) {
        error_log('[gallery.php] ' . $e->getMessage());
        respond(500, false, 'Detail foto galeri gagal dimuat', null, 'GAL-5004');
    }
}

only_get();

if (isset($_GET['id'])) {
    kirim_detail_galeri();
}

kirim_daftar_galeri();