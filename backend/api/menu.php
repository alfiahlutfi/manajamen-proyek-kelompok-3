<?php
// GET /api/menu.php
// Saat ini mendukung satu mode: ?featured=1  -> menu pilihan untuk beranda (card 4.1).
//   Opsional: &label=best_seller | signature | new   (menyaring menu pilihan berdasarkan label)
// Mode lain (daftar menu lengkap untuk halaman Menu) dikerjakan di card terpisah:
// tambahkan di bawah blok "featured", jangan mengubah blok card 4.1.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

const MAX_MENU_PILIHAN = 4;
const LABEL_MENU       = ['best_seller', 'signature', 'new'];

/**
 * Menu pilihan = menu berstatus aktif yang kolom label-nya terisi (diatur admin),
 * diurutkan sesuai kolom urutan, maksimal MAX_MENU_PILIHAN.
 */
function kirim_menu_pilihan(): void
{
    simulate_error('Menu pilihan gagal dimuat');

    $label = $_GET['label'] ?? '';
    if ($label !== '' && !in_array($label, LABEL_MENU, true)) {
        respond(400, false, 'Label tidak valid. Gunakan best_seller, signature, atau new');
    }

    $sql = 'SELECT id, label, foto, nama, harga
              FROM menu
             WHERE status = \'aktif\'
               AND label IS NOT NULL';
    $params = [];

    if ($label !== '') {
        $sql .= ' AND label = :label';
        $params[':label'] = $label;
    }

    $sql .= ' ORDER BY urutan, id LIMIT ' . MAX_MENU_PILIHAN;

    try {
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $data = array_map(static function (array $r): array {
            return [
                'id'    => (int) $r['id'],
                'label' => $r['label'],   // best_seller | signature | new
                'foto'  => $r['foto'],    // path relatif (kolom gambar), contoh: uploads/menu/nama-file.png
                'nama'  => $r['nama'],
                'harga' => (int) $r['harga'],
            ];
        }, $rows);

        // Belum ada menu berlabel: bukan error, FE yang memutuskan tampilannya
        if (!$data) {
            respond(200, true, 'Belum ada menu pilihan', []);
        }

        respond(200, true, 'Menu pilihan berhasil diambil', $data);

    } catch (PDOException $e) {
        error_log('[menu.php] ' . $e->getMessage());
        respond(500, false, 'Menu pilihan gagal dimuat');
    }
}

only_get();

if (($_GET['featured'] ?? '') === '1') {
    kirim_menu_pilihan();
}

// Mode lain belum tersedia
respond(400, false, 'Parameter tidak dikenali. Gunakan ?featured=1');