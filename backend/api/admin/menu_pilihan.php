<?php
// api/admin/menu_pilihan
//   GET                                      -> pengaturan menu pilihan beranda: label terpilih (null jika belum
//                                               pernah disimpan) dan menu terpilih, dengan penanda kategori nonaktif
//   PUT {"label": "...", "menu_ids": [1, 2]} -> simpan label dan menu pilihan BERSAMAAN dalam satu transaksi
//
// Card 14.6.1 [BE] API Menu Pilihan Beranda. Wajib sesi admin (card 13.1.1).
// Penyimpanan: tabel menu_pilihan_pengaturan (satu baris, id = 1, kolom label) dan menu_pilihan (satu baris
// per menu terpilih). Tabel menu_pilihan juga menjadi sumber data API publik menu.php?featured=1 (card 4).
//
// Aturan simpan (PUT):
//   - label harus salah satu nilai enum kolom menu.label (dibaca dari database, bukan ditulis di kode)
//   - menu_ids: minimal 1 dan maksimal 4, tanpa duplikat
//   - setiap menu: harus ada, berstatus aktif, berkategori aktif, dan berlabel sama dengan label yang dipilih
//   - mengganti label = menu pilihan lama DIGANTIKAN seluruhnya (bukan digabung)
//   - gagal di satu titik = tidak ada yang berubah (label dan menu pilihan lama tetap)
// Menu pada kategori nonaktif TIDAK dihapus dari penyimpanan, hanya disembunyikan oleh API publik.
// Menu yang dinonaktifkan atau labelnya diubah/dicabut dikeluarkan oleh api/admin/menu.php (card 14.4.1).

require_once __DIR__ . '/../../config/response.php';
require_once __DIR__ . '/../../config/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/menu_helper.php';

admin_prepare(['GET', 'PUT']);
admin_require_auth();

$method = $_SERVER['REQUEST_METHOD'];

/** Batalkan transaksi (jika ada), lalu kirim respons gagal yang menyebut menu_ids bermasalah. */
function tolak_menu_pilihan(PDO $pdo, int $status, string $kode, string $pesan, array $menuIds): void
{
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respond($status, false, $pesan, ['errors' => ['menu_ids' => $pesan], 'menu_ids' => array_values($menuIds)], $kode);
}

// ===========================================================================
// GET : ambil pengaturan
// ===========================================================================
if ($method === 'GET') {
    simulate_error('Gagal memuat menu pilihan beranda', 'MNU-5012');
    try {
        respond(200, true, 'Menu pilihan beranda berhasil diambil', ambil_pengaturan_menu_pilihan($pdo));
    } catch (Throwable $e) {
        error_log('[MNU-5012] admin/menu_pilihan GET: ' . $e->getMessage());
        respond(500, false, 'Gagal memuat menu pilihan beranda', null, 'MNU-5012');
    }
}

// ===========================================================================
// PUT : simpan label + menu pilihan
// ===========================================================================
simulate_error('Menu pilihan beranda gagal disimpan', 'MNU-5014');

$body = admin_read_json_body();
if ($body === null) {
    respond(400, false, 'Format request tidak valid', null, 'MNU-4022');
}

try {
    // ---- label -------------------------------------------------------------------
    $label = $body->label ?? null;
    if (!is_string($label) || $label === '') {
        respond_error_field(400, 'MNU-4016', 'Label menu pilihan tidak valid', ['label' => 'Label wajib dipilih']);
    }
    if (!in_array($label, daftar_enum_label($pdo), true)) {
        respond_error_field(400, 'MNU-4016', 'Label menu pilihan tidak valid', ['label' => 'Label tidak dikenal']);
    }

    // ---- menu_ids: tidak dikirim / null dianggap "belum memilih menu" --------------
    $mentah = $body->menu_ids ?? [];
    if (!is_array($mentah)) {
        respond_error_field(400, 'MNU-4019', 'Daftar menu pilihan tidak valid',
            ['menu_ids' => 'menu_ids harus berupa daftar ID menu']);
    }
    if (count($mentah) < MENU_PILIHAN_MIN) {
        respond_error_field(400, 'MNU-4017', 'Menu pilihan minimal ' . MENU_PILIHAN_MIN . ' menu',
            ['menu_ids' => 'Pilih minimal ' . MENU_PILIHAN_MIN . ' menu']);
    }
    if (count($mentah) > MENU_PILIHAN_MAX) {
        respond_error_field(400, 'MNU-4018', 'Menu pilihan maksimal ' . MENU_PILIHAN_MAX . ' menu',
            ['menu_ids' => 'Menu pilihan maksimal ' . MENU_PILIHAN_MAX . ' menu']);
    }

    $ids = [];
    foreach ($mentah as $nilai) {
        $id = parse_id($nilai);
        if ($id === null) {
            respond_error_field(400, 'MNU-4019', 'Daftar menu pilihan tidak valid',
                ['menu_ids' => 'Setiap ID menu harus berupa angka lebih dari 0']);
        }
        $ids[] = $id;
    }
    if (count(array_unique($ids)) !== count($ids)) {
        respond_error_field(400, 'MNU-4019', 'Daftar menu pilihan tidak valid',
            ['menu_ids' => 'Menu pilihan tidak boleh duplikat']);
    }

    // ---- transaksi: kunci baris pengaturan lalu baris menu, validasi, simpan -----------
    $pdo->beginTransaction();

    // Pastikan baris pengaturan ada, lalu kunci agar dua penyimpanan bersamaan berjalan bergantian.
    $pdo->exec('INSERT IGNORE INTO menu_pilihan_pengaturan (id, label) VALUES (1, NULL)');
    $pdo->query('SELECT id FROM menu_pilihan_pengaturan WHERE id = 1 FOR UPDATE')->fetchAll();

    // Kunci baris menu agar tidak bisa dinonaktifkan / diubah labelnya di tengah penyimpanan.
    $tanda = implode(',', array_fill(0, count($ids), '?'));
    $stmt  = $pdo->prepare(
        "SELECT m.id, m.status, m.label, c.status AS kategori_status
           FROM menu m
           JOIN menu_category c ON c.id = m.category_id
          WHERE m.id IN ({$tanda})
            FOR UPDATE"
    );
    $stmt->execute($ids);
    $ada = [];
    foreach ($stmt->fetchAll() as $r) {
        $ada[(int) $r['id']] = $r;
    }

    // 1) menu harus ada
    $hilang = array_values(array_diff($ids, array_keys($ada)));
    if ($hilang) {
        tolak_menu_pilihan($pdo, 404, 'MNU-4044', 'Menu tidak ditemukan', $hilang);
    }

    // 2) menu harus aktif dan berkategori aktif
    $nonaktif = [];
    foreach ($ids as $id) {
        if ($ada[$id]['status'] !== 'aktif' || $ada[$id]['kategori_status'] !== 'aktif') {
            $nonaktif[] = $id;
        }
    }
    if ($nonaktif) {
        tolak_menu_pilihan($pdo, 409, 'MNU-4021',
            'Menu nonaktif atau berkategori nonaktif tidak dapat dipilih', $nonaktif);
    }

    // 3) menu harus berlabel sama dengan label yang dipilih
    $beda = [];
    foreach ($ids as $id) {
        if ($ada[$id]['label'] !== $label) {
            $beda[] = $id;
        }
    }
    if ($beda) {
        tolak_menu_pilihan($pdo, 409, 'MNU-4020',
            'Menu harus berlabel sama dengan label yang dipilih', $beda);
    }

    // 4) simpan: menu pilihan lama digantikan seluruhnya, label ikut diperbarui
    $pdo->exec('DELETE FROM menu_pilihan');
    $stmt = $pdo->prepare('INSERT INTO menu_pilihan (menu_id) VALUES (:id)');
    foreach ($ids as $id) {
        $stmt->execute([':id' => $id]);
    }
    $stmt = $pdo->prepare('UPDATE menu_pilihan_pengaturan SET label = :label WHERE id = 1');
    $stmt->execute([':label' => $label]);

    $pdo->commit();

    respond(200, true, 'Menu pilihan beranda berhasil disimpan', ambil_pengaturan_menu_pilihan($pdo));
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[MNU-5014] admin/menu_pilihan PUT: ' . $e->getMessage());
    respond(500, false, 'Menu pilihan beranda gagal disimpan', null, 'MNU-5014');
}