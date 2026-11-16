<?php
// api/admin/kategori
//   GET                         -> semua kategori (aktif dan nonaktif) beserta status
//   POST   {nama}               -> tambah kategori (status awal: aktif; slug dan urutan dibuat BE)
//   PUT    ?id= {nama}          -> ubah nama kategori
//   PUT    ?id= {status}        -> ubah status kategori: "aktif" atau "nonaktif"
//                                  (body berisi nama ATAU status saja, tidak keduanya)
//   DELETE ?id=                 -> hapus kategori (ditolak jika masih punya menu, aktif maupun nonaktif)
// Card 14.2.1 [BE] API Kategori dan Daftar Pilihan Label. Wajib sesi admin (card 13.1.1).
//
// Kategori nonaktif: tidak muncul di API publik, menu di dalamnya tidak tampil kepada pelanggan
// (daftar menu, detail, menu pilihan beranda), dan data menu TIDAK diubah: saat kategori
// diaktifkan lagi menunya tampil lagi apa adanya.
// Slug dibuat saat kategori dibuat dan TIDAK berubah saat nama diubah, karena slug dikirim
// oleh API publik (menu_category.php) dan bisa dipakai FE sebagai kunci.

require_once __DIR__ . '/../../config/response.php';
require_once __DIR__ . '/../../config/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/menu_helper.php';

admin_prepare(['GET', 'POST', 'PUT', 'DELETE']);
admin_require_auth();

$method = $_SERVER['REQUEST_METHOD'];

// ---------------------------------------------------------------------------
// GET: semua kategori, urut sama dengan API publik (urutan, id)
// ---------------------------------------------------------------------------
if ($method === 'GET') {
    simulate_error('Gagal memuat daftar kategori', 'KTG-5003');
    try {
        $rows = $pdo->query(
            'SELECT c.id, c.nama, c.status, COUNT(m.id) AS jumlah_menu
               FROM menu_category c
               LEFT JOIN menu m ON m.category_id = c.id
              GROUP BY c.id, c.nama, c.status, c.urutan
              ORDER BY c.urutan, c.id'
        )->fetchAll();
        $data = array_map('bentuk_kategori', $rows);
        respond(200, true, $data ? 'Daftar kategori berhasil diambil' : 'Belum ada kategori', $data);
    } catch (Throwable $e) {
        error_log('[KTG-5003] admin/kategori GET: ' . $e->getMessage());
        respond(500, false, 'Gagal memuat daftar kategori', null, 'KTG-5003');
    }
}

// ---------------------------------------------------------------------------
// DELETE: hapus kategori
// ---------------------------------------------------------------------------
if ($method === 'DELETE') {
    simulate_error('Kategori gagal dihapus', 'KTG-5006');

    $id = parse_id($_GET['id'] ?? null);
    if ($id === null) {
        respond(400, false, 'Parameter id tidak valid', null, 'KTG-4002');
    }

    try {
        if (ambil_kategori($pdo, $id) === null) {
            respond(404, false, 'Kategori tidak ditemukan', null, 'KTG-4041');
        }

        // Masih punya menu (aktif maupun nonaktif) -> ditolak
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM menu WHERE category_id = :id');
        $stmt->execute([':id' => $id]);
        $dipakai = (int) $stmt->fetchColumn();
        if ($dipakai > 0) {
            respond(409, false, 'Kategori masih dipakai oleh menu dan tidak dapat dihapus', ['jumlah_menu' => $dipakai], 'KTG-4092');
        }

        try {
            $stmt = $pdo->prepare('DELETE FROM menu_category WHERE id = :id');
            $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            // Menu baru ditambahkan di antara pengecekan dan penghapusan: foreign key menolaknya
            if (adalah_fk_dipakai($e)) {
                respond(409, false, 'Kategori masih dipakai oleh menu dan tidak dapat dihapus', null, 'KTG-4092');
            }
            throw $e;
        }

        respond(200, true, 'Kategori berhasil dihapus', ['id' => $id]);
    } catch (Throwable $e) {
        error_log('[KTG-5006] admin/kategori DELETE: ' . $e->getMessage());
        respond(500, false, 'Kategori gagal dihapus', null, 'KTG-5006');
    }
}

// PUT dengan field "status" = ubah status; selain itu = ubah nama. Kode simulasi error mengikuti jenisnya.
$ubahStatus = false;
if ($method === 'PUT') {
    $intip = admin_read_json_body();
    $ubahStatus = $intip !== null && property_exists($intip, 'status');
}
if ($ubahStatus) {
    simulate_error('Status kategori gagal diubah', 'KTG-5005');
} else {
    simulate_error('Kategori gagal disimpan', 'KTG-5004');
}

$id = null;
if ($method === 'PUT') {
    $id = parse_id($_GET['id'] ?? null);
    if ($id === null) {
        respond(400, false, 'Parameter id tidak valid', null, 'KTG-4002');
    }
}

$body = admin_read_json_body();
if ($body === null) {
    respond(400, false, 'Format request tidak valid', null, 'KTG-4003');
}

// ---------------------------------------------------------------------------
// PUT {status}: ubah status aktif / nonaktif
// ---------------------------------------------------------------------------
if ($ubahStatus) {
    if (property_exists($body, 'nama')) {
        respond(400, false, 'Kirim nama atau status saja, tidak keduanya', null, 'KTG-4003');
    }

    $status = $body->status;
    if ($status !== 'aktif' && $status !== 'nonaktif') {
        respond_error_field(400, 'KTG-4004', 'Status kategori tidak valid',
            ['status' => 'Status harus aktif atau nonaktif']);
    }

    try {
        if (ambil_kategori($pdo, $id) === null) {
            respond(404, false, 'Kategori tidak ditemukan', null, 'KTG-4041');
        }

        $stmt = $pdo->prepare('UPDATE menu_category SET status = :status WHERE id = :id');
        $stmt->execute([':status' => $status, ':id' => $id]);

        respond(
            200,
            true,
            $status === 'aktif' ? 'Kategori berhasil diaktifkan' : 'Kategori berhasil dinonaktifkan',
            ambil_kategori($pdo, $id)
        );
    } catch (Throwable $e) {
        error_log('[KTG-5005] admin/kategori PUT status: ' . $e->getMessage());
        respond(500, false, 'Status kategori gagal diubah', null, 'KTG-5005');
    }
}

// ---------------------------------------------------------------------------
// POST {nama} (tambah) dan PUT {nama} (ubah nama)
// ---------------------------------------------------------------------------

$nama = teks_satu_baris($body->nama ?? null);
if ($nama === '') {
    respond_error_field(400, 'KTG-4001', 'Nama kategori tidak valid', ['nama' => 'Nama kategori wajib diisi']);
}
if (mb_strlen($nama) > KATEGORI_NAMA_MAX) {
    respond_error_field(400, 'KTG-4001', 'Nama kategori tidak valid',
        ['nama' => 'Nama kategori maksimal ' . KATEGORI_NAMA_MAX . ' karakter']);
}

try {
    if ($method === 'PUT' && ambil_kategori($pdo, $id) === null) {
        respond(404, false, 'Kategori tidak ditemukan', null, 'KTG-4041');
    }

    // Nama harus unik di antara SEMUA kategori (aktif dan nonaktif), tanpa membedakan huruf besar/kecil.
    // Saat ubah nama, kategori itu sendiri dikecualikan (boleh menyimpan nama yang sama / ganti huruf).
    $sql    = 'SELECT 1 FROM menu_category WHERE nama = :nama' . ($id !== null ? ' AND id <> :id' : '') . ' LIMIT 1';
    $params = [':nama' => $nama];
    if ($id !== null) {
        $params[':id'] = $id;
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    if ($stmt->fetch()) {
        respond_error_field(409, 'KTG-4091', 'Nama kategori sudah ada', ['nama' => 'Nama kategori sudah ada']);
    }

    try {
        if ($method === 'POST') {
            $slug   = slug_unik($pdo, 'menu_category', slugify($nama));
            $urutan = (int) $pdo->query('SELECT COALESCE(MAX(urutan), 0) + 1 FROM menu_category')->fetchColumn();
            $stmt = $pdo->prepare(
                'INSERT INTO menu_category (nama, slug, urutan, status) VALUES (:nama, :slug, :urutan, \'aktif\')'
            );
            $stmt->execute([':nama' => $nama, ':slug' => $slug, ':urutan' => $urutan]);
            $id = (int) $pdo->lastInsertId();
        } else {
            $stmt = $pdo->prepare('UPDATE menu_category SET nama = :nama WHERE id = :id');
            $stmt->execute([':nama' => $nama, ':id' => $id]);
        }
    } catch (PDOException $e) {
        if (adalah_duplikat($e)) {   // dua permintaan bersamaan dengan nama sama / slug bentrok
            respond_error_field(409, 'KTG-4091', 'Nama kategori sudah ada', ['nama' => 'Nama kategori sudah ada']);
        }
        throw $e;
    }

    respond(
        $method === 'POST' ? 201 : 200,
        true,
        $method === 'POST' ? 'Kategori berhasil ditambahkan' : 'Kategori berhasil diperbarui',
        ambil_kategori($pdo, $id)
    );
} catch (Throwable $e) {
    error_log('[KTG-5004] admin/kategori ' . $method . ': ' . $e->getMessage());
    respond(500, false, 'Kategori gagal disimpan', null, 'KTG-5004');
}