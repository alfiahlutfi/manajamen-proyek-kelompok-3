<?php
// GET /api/menu.php
// Mode yang didukung:
//   ?featured=1         -> menu pilihan untuk beranda (card 4.1).
//     Opsional: &label=best_seller | signature | new   (menyaring menu pilihan berdasarkan label)
//   ?category_id={id}   -> daftar menu berdasarkan kategori untuk halaman Menu (card 9.1.1).
// Jika featured=1 dan category_id dikirim bersamaan, mode featured yang dipakai.
// Mode lain (mis. daftar semua menu tanpa kategori) dikerjakan di card terpisah:
// tambahkan di bawah blok yang sudah ada, jangan mengubah blok card sebelumnya.

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
    simulate_error('Menu pilihan gagal dimuat', 'MNU-5001');

    $label = $_GET['label'] ?? '';
    if ($label !== '' && !in_array($label, LABEL_MENU, true)) {
        respond(400, false, 'Label tidak valid. Gunakan best_seller, signature, atau new', null, 'MNU-4001');
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
        respond(500, false, 'Menu pilihan gagal dimuat', null, 'MNU-5002');
    }
}

/**
 * Card 9.1.1 - Daftar menu berdasarkan kategori (halaman Menu).
 * GET /api/menu.php?category_id={id}
 * Menu berstatus aktif pada kategori aktif tersebut, diurutkan sesuai kolom urutan.
 * Berbeda dengan menu pilihan, kolom label boleh kosong (null).
 */
function kirim_menu_per_kategori(): void
{
    simulate_error('Daftar menu gagal dimuat', 'MNU-5003');

    $id = $_GET['category_id'];
    if (!is_string($id) || !ctype_digit($id) || (int) $id < 1) {
        respond(400, false, 'Parameter category_id tidak valid', null, 'MNU-4003');
    }

    try {
        $stmt = db()->prepare(
            'SELECT id
               FROM menu_category
              WHERE id = :id AND status = \'aktif\'
              LIMIT 1'
        );
        $stmt->execute([':id' => (int) $id]);

        if (!$stmt->fetch()) {
            respond(404, false, 'Kategori menu tidak ditemukan', null, 'MNU-4041');
        }

        $stmt = db()->prepare(
            'SELECT id, label, foto, nama, harga
               FROM menu
              WHERE category_id = :id
                AND status = \'aktif\'
              ORDER BY urutan, id'
        );
        $stmt->execute([':id' => (int) $id]);

        $data = array_map(static function (array $r): array {
            return [
                'id'    => (int) $r['id'],
                'label' => $r['label'],   // best_seller | signature | new | null
                'foto'  => $r['foto'],    // path relatif, contoh: uploads/menu/nama-file.png
                'nama'  => $r['nama'],
                'harga' => (int) $r['harga'],
            ];
        }, $stmt->fetchAll());

        // Kategori valid tetapi belum punya menu: bukan error, FE yang memutuskan tampilannya
        if (!$data) {
            respond(200, true, 'Belum ada menu pada kategori ini', []);
        }

        respond(200, true, 'Daftar menu berhasil diambil', $data);

    } catch (PDOException $e) {
        error_log('[menu.php] ' . $e->getMessage());
        respond(500, false, 'Daftar menu gagal dimuat', null, 'MNU-5004');
    }
}

only_get();

if (($_GET['featured'] ?? '') === '1') {
    kirim_menu_pilihan();
}

if (isset($_GET['category_id'])) {
    kirim_menu_per_kategori();
}

// Mode lain belum tersedia
respond(400, false, 'Parameter tidak dikenali. Gunakan ?featured=1 atau ?category_id={id}', null, 'MNU-4002');