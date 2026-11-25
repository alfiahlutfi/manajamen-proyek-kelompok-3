<?php
// GET api/admin/menu_berlabel?label={best_seller|new|signature}
// Daftar menu AKTIF berlabel tertentu pada kategori AKTIF dari semua kategori, urut menurut kolom urutan lalu id.
// Dipakai tab Menu Pilihan Beranda: setelah admin memilih label, FE menampilkan menu ini untuk dipilih.
// Setiap menu membawa terpilih = true jika sedang tersimpan sebagai menu pilihan beranda.
// (Menu pada kategori nonaktif tidak termasuk di sini; penanda kategori nonaktif ada pada api/admin/menu_pilihan.)
// Card 14.6.1 [BE] API Menu Pilihan Beranda. Wajib sesi admin (card 13.1.1).

require_once __DIR__ . '/../../config/response.php';
require_once __DIR__ . '/../../config/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/menu_helper.php';

admin_prepare(['GET']);
admin_require_auth();
simulate_error('Gagal memuat menu berlabel', 'MNU-5013');

try {
    $label = $_GET['label'] ?? null;
    if (!is_string($label) || $label === '') {
        respond_error_field(400, 'MNU-4016', 'Label menu pilihan tidak valid', ['label' => 'Label wajib dipilih']);
    }
    if (!in_array($label, daftar_enum_label($pdo), true)) {
        respond_error_field(400, 'MNU-4016', 'Label menu pilihan tidak valid', ['label' => 'Label tidak dikenal']);
    }

    $stmt = $pdo->prepare(
        'SELECT m.id, m.foto, m.nama, m.deskripsi, m.harga,
                m.category_id, c.nama AS kategori, c.status AS kategori_status,
                m.label, m.status, m.created_at,
                (p.menu_id IS NOT NULL) AS terpilih
           FROM menu m
           JOIN menu_category c ON c.id = m.category_id AND c.status = \'aktif\'
           LEFT JOIN menu_pilihan p ON p.menu_id = m.id
          WHERE m.status = \'aktif\'
            AND m.label = :label
          ORDER BY m.urutan, m.id'
    );
    $stmt->execute([':label' => $label]);

    $menu = array_map(static function (array $r): array {
        $item             = bentuk_menu_pilihan($r);
        $item['terpilih'] = (int) $r['terpilih'] === 1;
        return $item;
    }, $stmt->fetchAll());

    respond(
        200,
        true,
        $menu ? 'Menu berlabel berhasil diambil' : 'Belum ada menu aktif dengan label ini',
        ['label' => $label, 'menu' => $menu]
    );
} catch (Throwable $e) {
    error_log('[MNU-5013] admin/menu_berlabel: ' . $e->getMessage());
    respond(500, false, 'Gagal memuat menu berlabel', null, 'MNU-5013');
}