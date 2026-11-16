<?php
// GET api/admin/label_pilihan
// Daftar pilihan label menu, dibaca dari definisi kolom enum `menu.label` di database
// (urutan sesuai definisi kolom, tidak ada daftar nilai yang ditulis di kode).
// BE hanya mengirim nilai aslinya (contoh: best_seller); teks tampilan dipetakan FE.
// Sengaja TIDAK ada API tambah, ubah, atau hapus label: menambah pilihan label baru
// adalah perubahan database oleh developer.
// Card 14.2.1 [BE] API Kategori dan Daftar Pilihan Label. Wajib sesi admin (card 13.1.1).

require_once __DIR__ . '/../../config/response.php';
require_once __DIR__ . '/../../config/auth.php';
require_once __DIR__ . '/../../config/database.php';

admin_prepare(['GET']);
admin_require_auth();
simulate_error('Gagal memuat daftar pilihan label', 'MNU-5007');

try {
    $row = $pdo->query("SHOW COLUMNS FROM `menu` LIKE 'label'")->fetch();
    $tipe = $row['Type'] ?? '';

    // Contoh nilai: enum('best_seller','new','signature')
    if (!preg_match('/^enum\((.*)\)$/is', $tipe, $m)) {
        throw new RuntimeException('kolom menu.label bukan enum: ' . $tipe);
    }
    preg_match_all("/'((?:[^']|'')*)'/", $m[1], $cocok);
    $nilai = array_map(static function (string $v): string {
        return str_replace("''", "'", $v);
    }, $cocok[1]);

    if (!$nilai) {
        throw new RuntimeException('enum label kosong');
    }

    respond(200, true, 'Daftar pilihan label berhasil diambil', array_values($nilai));
} catch (Throwable $e) {
    error_log('[MNU-5007] admin/label_pilihan: ' . $e->getMessage());
    respond(500, false, 'Gagal memuat daftar pilihan label', null, 'MNU-5007');
}