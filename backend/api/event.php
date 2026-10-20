<?php
// GET /api/event.php?id={id}
// Card 6.1 - Detail satu event berdasarkan ID (dari carousel beranda). Publik, tanpa login.
// Daftar semua event untuk halaman Event dikerjakan di card terpisah:
// tambahkan di bawah blok "id", jangan mengubah blok card 6.1.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();
simulate_error('Detail event gagal dimuat');

$id = $_GET['id'] ?? '';

if ($id === '') {
    respond(400, false, 'Parameter id wajib diisi');
}
if (!ctype_digit((string) $id) || (int) $id < 1) {
    respond(400, false, 'Parameter id tidak valid');
}

try {
    $stmt = db()->prepare(
        'SELECT id, nama, foto, deskripsi, tanggal, waktu, lokasi
           FROM event
          WHERE id = :id AND status = \'aktif\'
          LIMIT 1'
    );
    $stmt->execute([':id' => (int) $id]);
    $r = $stmt->fetch();

    if (!$r) {
        respond(404, false, 'Event tidak ditemukan');
    }

    respond(200, true, 'Detail event berhasil diambil', [
        'id'        => (int) $r['id'],
        'nama'      => $r['nama'],
        'foto'      => $r['foto'],       // path relatif, contoh: uploads/event/open-mic.png
        'deskripsi' => $r['deskripsi'],
        'tanggal'   => $r['tanggal'],    // YYYY-MM-DD
        'waktu'     => $r['waktu'],      // HH:MM:SS
        'lokasi'    => $r['lokasi'],
    ]);

} catch (PDOException $e) {
    error_log('[event.php] ' . $e->getMessage());
    respond(500, false, 'Detail event gagal dimuat');
}