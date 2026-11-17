<?php
// GET api/admin/menu
// Daftar menu untuk admin (terpisah dari API publik api/menu.php).
// Menu AKTIF dan NONAKTIF ikut tampil, beserta status kategorinya, supaya FE bisa memberi penanda
// pada menu yang kategorinya nonaktif.
//
// Parameter query (semuanya opsional, boleh dipakai bersamaan; nilai kosong dianggap tidak dikirim):
//   q            kata kunci nama menu (mengandung kata itu, tanpa membedakan huruf besar/kecil), maks 100 karakter
//   category_id  filter kategori (ID kategori)
//   label        filter label: salah satu nilai enum kolom menu.label (lihat api/admin/label_pilihan)
//   status       filter status menu: aktif | nonaktif
//   sort         urutan waktu dibuat: terbaru (bawaan) | terlama
//   page         nomor halaman, mulai dari 1 (bawaan 1). Satu halaman = 10 menu (tetap)
//   simulate_error=1  memicu respons 500 (hanya aktif jika APP_DEBUG = true)
//
// Card 14.3.1 [BE] API Daftar Menu Admin. Wajib sesi admin (card 13.1.1).

require_once __DIR__ . '/../../config/response.php';
require_once __DIR__ . '/../../config/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/menu_helper.php';

const MENU_PER_HALAMAN = 10;   // jumlah menu per halaman (tetap)
const MENU_CARI_MAX    = 100;  // sesuai kolom menu.nama varchar(100)

admin_prepare(['GET']);
admin_require_auth();
simulate_error('Gagal memuat daftar menu', 'MNU-5008');

/** Ambil parameter query berupa string; kosong/tidak ada -> null; bukan string (mis. q[]=x) -> 400. */
function param_teks(string $nama): ?string
{
    if (!isset($_GET[$nama])) {
        return null;
    }
    if (!is_string($_GET[$nama])) {
        respond_error_field(400, 'MNU-4005', 'Parameter daftar menu tidak valid', [$nama => "Parameter {$nama} tidak valid"]);
    }
    return $_GET[$nama] === '' ? null : $_GET[$nama];
}

try {
    $errors = [];

    // --- pencarian nama
    $q = param_teks('q');
    if ($q !== null) {
        $q = teks_satu_baris($q);
        if (mb_strlen($q) > MENU_CARI_MAX) {
            $errors['q'] = 'Kata kunci maksimal ' . MENU_CARI_MAX . ' karakter';
        }
        if ($q === '') {
            $q = null;   // hanya spasi: dianggap tanpa pencarian
        }
    }

    // --- filter kategori
    $kategori = null;
    $mentah = param_teks('category_id');
    if ($mentah !== null) {
        $kategori = parse_id($mentah);
        if ($kategori === null) {
            $errors['category_id'] = 'category_id harus berupa angka lebih dari 0';
        }
    }

    // --- filter label (nilai harus ada di enum database)
    $label = param_teks('label');
    if ($label !== null && !in_array($label, daftar_enum_label($pdo), true)) {
        $errors['label'] = 'Label tidak dikenal';
        $label = null;
    }

    // --- filter status menu
    $status = param_teks('status');
    if ($status !== null && $status !== 'aktif' && $status !== 'nonaktif') {
        $errors['status'] = 'Status harus aktif atau nonaktif';
        $status = null;
    }

    // --- urutan waktu dibuat
    $sort = param_teks('sort') ?? 'terbaru';
    if ($sort !== 'terbaru' && $sort !== 'terlama') {
        $errors['sort'] = 'Sort harus terbaru atau terlama';
        $sort = 'terbaru';
    }

    // --- halaman
    $page = 1;
    $mentah = param_teks('page');
    if ($mentah !== null) {
        $page = parse_id($mentah);
        if ($page === null) {
            $errors['page'] = 'page harus berupa angka lebih dari 0';
            $page = 1;
        }
    }

    if ($errors) {
        respond_error_field(400, 'MNU-4005', 'Parameter daftar menu tidak valid', $errors);
    }

    // --- susun kondisi (semua nilai lewat prepared statement)
    $where  = [];
    $params = [];
    if ($q !== null) {
        $where[]      = "m.nama LIKE :q ESCAPE '\\\\'";
        $params[':q'] = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q) . '%';
    }
    if ($kategori !== null) {
        $where[]        = 'm.category_id = :kategori';
        $params[':kategori'] = $kategori;
    }
    if ($label !== null) {
        $where[]          = 'm.label = :label';
        $params[':label'] = $label;
    }
    if ($status !== null) {
        $where[]           = 'm.status = :status';
        $params[':status'] = $status;
    }
    $sqlWhere   = $where ? ' WHERE ' . implode(' AND ', $where) : '';
    $adaFilter  = (bool) $where;

    // --- total untuk navigasi halaman
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM menu m' . $sqlWhere);
    $stmt->execute($params);
    $total      = (int) $stmt->fetchColumn();
    $totalHalaman = (int) ceil($total / MENU_PER_HALAMAN);

    // --- isi halaman. Urutan waktu dibuat; id sebagai penentu kedua karena banyak menu
    // punya waktu dibuat yang sama (urutan jadi tetap dan halaman tidak saling tumpang tindih).
    $arah   = $sort === 'terbaru' ? 'DESC' : 'ASC';
    $offset = ($page - 1) * MENU_PER_HALAMAN;
    $stmt = $pdo->prepare(
        'SELECT m.id, m.foto, m.nama, m.deskripsi, m.harga,
                m.category_id, c.nama AS kategori, c.status AS kategori_status,
                m.label, m.status, m.created_at
           FROM menu m
           JOIN menu_category c ON c.id = m.category_id' .
        $sqlWhere .
        " ORDER BY m.created_at {$arah}, m.id {$arah}" .
        ' LIMIT ' . MENU_PER_HALAMAN . ' OFFSET ' . (int) $offset
    );
    $stmt->execute($params);

    $items = array_map(static function (array $r): array {
        return [
            'id'              => (int) $r['id'],
            'foto'            => $r['foto'],                // path relatif, contoh: uploads/menu/nama-file.png (boleh null)
            'nama'            => $r['nama'],
            'deskripsi'       => $r['deskripsi'],           // boleh null
            'harga'           => (int) $r['harga'],         // bilangan bulat dalam Rupiah; format tampilan oleh FE
            'category_id'     => (int) $r['category_id'],
            'kategori'        => $r['kategori'],            // nama kategori
            'kategori_status' => $r['kategori_status'],     // aktif | nonaktif
            'label'           => $r['label'],               // nilai enum (best_seller | new | signature) atau null
            'status'          => $r['status'],              // aktif | nonaktif
            'created_at'      => $r['created_at'],          // waktu dibuat (waktu server), format YYYY-MM-DD HH:MM:SS
        ];
    }, $stmt->fetchAll());

    // Daftar kosong adalah 200 (bukan error). Pesan membedakan "belum ada menu" dari "tidak ditemukan".
    if ($total === 0) {
        $pesan = $adaFilter ? 'Menu tidak ditemukan' : 'Belum ada menu';
    } else {
        $pesan = 'Daftar menu berhasil diambil';
    }

    respond(200, true, $pesan, [
        'items'      => $items,
        'pagination' => [
            'page'        => $page,
            'per_page'    => MENU_PER_HALAMAN,
            'total_items' => $total,
            'total_pages' => $totalHalaman,
        ],
    ]);
} catch (Throwable $e) {
    error_log('[MNU-5008] admin/menu GET: ' . $e->getMessage());
    respond(500, false, 'Gagal memuat daftar menu', null, 'MNU-5008');
}