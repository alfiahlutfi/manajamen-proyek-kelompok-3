<?php
// GET /api/reservation.php
// Card 5.1 - API deskripsi layanan reservasi (foto, judul, deskripsi). Publik, tanpa login.
// Dipakai FE di beranda (bagian "Reservasi"); tombol "Reservasi" hanya link ke reservasi.html di sisi FE.
// Bukan API untuk mengirim/membuat reservasi (itu card terpisah).

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();
simulate_error('Deskripsi reservasi gagal dimuat', 'RES-5001');

try {
    $stmt = db()->query(
        'SELECT foto_reservasi    AS foto,
                judul_reservasi     AS judul,
                deskripsi_reservasi AS deskripsi
           FROM cafe
          ORDER BY id
          LIMIT 1'
    );
    $row = $stmt->fetch();

    if (!$row) {
        respond(404, false, 'Data deskripsi reservasi belum tersedia', null, 'RES-4041');
    }

    // foto dikirim sebagai path relatif (contoh: uploads/cafe/gambar-reservasi.jpg),
    // sama persis dengan isi database. FE yang menambahkan alamat backend di depannya.

    respond(200, true, 'Deskripsi reservasi berhasil diambil', $row);

} catch (PDOException $e) {
    error_log('[reservation.php] ' . $e->getMessage());
    respond(500, false, 'Deskripsi reservasi gagal dimuat', null, 'RES-5002');
}
