<?php
// api/admin/menu   (menu TIDAK pernah dihapus; hanya dinonaktifkan)
//   GET                      -> daftar menu (card 14.3.1): q, category_id, label, status, sort, page
//   GET   ?id={id}           -> detail satu menu
//   POST  (multipart/form-data)        -> tambah menu
//   POST  ?id={id} (multipart/form-data) -> ubah menu (pakai POST karena PHP tidak membaca multipart pada PUT)
//   PUT   ?id={id}  {"status": "aktif" | "nonaktif"} -> ubah status menu
//
// Card 14.3.1 dan 14.4.1 [BE]. Wajib sesi admin (card 13.1.1).
//
// Field tambah/ubah (form): nama, harga, deskripsi, category_id, label (opsional), foto (file PNG).
//   - Tambah : foto wajib, kategori harus aktif, status awal aktif, slug dan urutan dibuat BE.
//   - Ubah   : foto opsional (tidak dikirim = foto lama tetap), kategori saat ini boleh nonaktif tetapi
//              kategori nonaktif lain ditolak. label: TIDAK dikirim = tidak diubah, dikirim kosong = dikosongkan.
//   - Foto   : PNG sungguhan, maks 2 MB, berlatar transparan; area kosong dipangkas dan foto dikecilkan
//              jika melebihi ukuran maksimum (card 14.5.1, lihat config/foto_menu.php).
//   - Menu pilihan beranda (card 14.6.1): menu yang dinonaktifkan, atau yang labelnya diubah/dicabut, otomatis
//     dikeluarkan dari menu pilihan (dalam transaksi yang sama) dan TIDAK kembali otomatis.

require_once __DIR__ . '/../../config/response.php';
require_once __DIR__ . '/../../config/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/menu_helper.php';
require_once __DIR__ . '/../../config/foto_menu.php';

const MENU_PER_HALAMAN = 10;   // jumlah menu per halaman daftar (tetap)
const MENU_CARI_MAX    = 100;  // sesuai kolom menu.nama varchar(100)

admin_prepare(['GET', 'POST', 'PUT']);
admin_require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$modeId = array_key_exists('id', $_GET);   // ada parameter id (walau kosong) = mode detail/ubah/ubah status

/** ID dari query: bulat >= 1, selain itu 400. */
function id_menu_dari_query(): int
{
    $id = parse_id($_GET['id'] ?? null);
    if ($id === null) {
        respond(400, false, 'Parameter id tidak valid', null, 'MNU-4011');
    }
    return $id;
}

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

// ===========================================================================
// GET ?id= : detail menu
// ===========================================================================
if ($method === 'GET' && $modeId) {
    simulate_error('Gagal memuat detail menu', 'MNU-5009');
    $id = id_menu_dari_query();

    try {
        $menu = ambil_menu($pdo, $id);
        if ($menu === null) {
            respond(404, false, 'Menu tidak ditemukan', null, 'MNU-4043');
        }
        respond(200, true, 'Detail menu berhasil diambil', $menu);
    } catch (Throwable $e) {
        error_log('[MNU-5009] admin/menu GET detail: ' . $e->getMessage());
        respond(500, false, 'Gagal memuat detail menu', null, 'MNU-5009');
    }
}

// ===========================================================================
// GET : daftar menu
// ===========================================================================
if ($method === 'GET') {
    simulate_error('Gagal memuat daftar menu', 'MNU-5008');

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
            $where[]             = 'm.category_id = :kategori';
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
        $sqlWhere  = $where ? ' WHERE ' . implode(' AND ', $where) : '';
        $adaFilter = (bool) $where;

        // --- total untuk navigasi halaman
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM menu m' . $sqlWhere);
        $stmt->execute($params);
        $total        = (int) $stmt->fetchColumn();
        $totalHalaman = (int) ceil($total / MENU_PER_HALAMAN);

        // --- isi halaman. Urutan waktu dibuat; id sebagai penentu kedua karena banyak menu
        // punya waktu dibuat yang sama (urutan jadi tetap dan halaman tidak saling tumpang tindih).
        $arah   = $sort === 'terbaru' ? 'DESC' : 'ASC';
        $offset = ($page - 1) * MENU_PER_HALAMAN;
        $stmt = $pdo->prepare(
            SQL_SELECT_MENU . $sqlWhere .
            " ORDER BY m.created_at {$arah}, m.id {$arah}" .
            ' LIMIT ' . MENU_PER_HALAMAN . ' OFFSET ' . (int) $offset
        );
        $stmt->execute($params);
        $items = array_map('bentuk_menu', $stmt->fetchAll());

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
}

// ===========================================================================
// PUT ?id= : ubah status menu (aktif / nonaktif). Data dan foto tidak dihapus.
// ===========================================================================
if ($method === 'PUT') {
    simulate_error('Status menu gagal diubah', 'MNU-5011');

    if (!$modeId) {
        respond(400, false, 'Parameter id tidak valid', null, 'MNU-4011');
    }
    $id = id_menu_dari_query();

    $body = admin_read_json_body();
    if ($body === null) {
        respond(400, false, 'Format request tidak valid', null, 'MNU-4012');
    }

    $status = $body->status ?? null;
    if ($status !== 'aktif' && $status !== 'nonaktif') {
        respond_error_field(400, 'MNU-4013', 'Status menu tidak valid', ['status' => 'Status harus aktif atau nonaktif']);
    }

    try {
        if (ambil_menu($pdo, $id) === null) {
            respond(404, false, 'Menu tidak ditemukan', null, 'MNU-4043');
        }

        $pdo->beginTransaction();
        $stmt = $pdo->prepare('UPDATE menu SET status = :status WHERE id = :id');
        $stmt->execute([':status' => $status, ':id' => $id]);
        if ($status === 'nonaktif') {
            keluarkan_dari_menu_pilihan($pdo, $id);   // card 14.6.1: tidak kembali otomatis saat diaktifkan
        }
        $pdo->commit();

        respond(
            200,
            true,
            $status === 'aktif' ? 'Menu berhasil diaktifkan' : 'Menu berhasil dinonaktifkan',
            ambil_menu($pdo, $id)
        );
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('[MNU-5011] admin/menu PUT status: ' . $e->getMessage());
        respond(500, false, 'Status menu gagal diubah', null, 'MNU-5011');
    }
}

// ===========================================================================
// POST : tambah menu (tanpa id) atau ubah menu (dengan ?id=)
// ===========================================================================
simulate_error('Menu gagal disimpan', 'MNU-5010');
foto_cek_batas_post();

$ubah = $modeId;
$id   = $ubah ? id_menu_dari_query() : null;

try {
    // Menu yang diubah harus ada (dicek lebih dulu agar 404 tidak tertutup 400)
    $lama = null;
    if ($ubah) {
        $stmt = $pdo->prepare('SELECT id, category_id, foto, label FROM menu WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $lama = $stmt->fetch();
        if (!$lama) {
            respond(404, false, 'Menu tidak ditemukan', null, 'MNU-4043');
        }
    }

    // ---- baca dan validasi field -------------------------------------------------
    $errors = [];

    $nama = teks_satu_baris($_POST['nama'] ?? null);
    if ($nama === '') {
        $errors['nama'] = 'Nama menu wajib diisi';
    } elseif (mb_strlen($nama) > MENU_NAMA_MAX) {
        $errors['nama'] = 'Nama menu maksimal ' . MENU_NAMA_MAX . ' karakter';
    }

    $hargaRaw = is_string($_POST['harga'] ?? null) ? trim($_POST['harga']) : '';
    $harga    = null;
    if ($hargaRaw === '') {
        $errors['harga'] = 'Harga wajib diisi';
    } elseif (!preg_match('/^[1-9][0-9]{0,9}$/', $hargaRaw) || (int) $hargaRaw > MENU_HARGA_MAX) {
        $errors['harga'] = 'Harga harus berupa bilangan bulat lebih dari 0';
    } else {
        $harga = (int) $hargaRaw;
    }

    $deskripsi = teks_panjang($_POST['deskripsi'] ?? null);
    if ($deskripsi === '') {
        $errors['deskripsi'] = 'Deskripsi wajib diisi';
    } elseif (mb_strlen($deskripsi) > MENU_DESKRIPSI_MAX) {
        $errors['deskripsi'] = 'Deskripsi maksimal ' . MENU_DESKRIPSI_MAX . ' karakter';
    }

    // Kategori: wajib, harus ada, dan aktif. Saat ubah, kategori SAAT INI boleh nonaktif.
    $kategoriId       = null;
    $kategoriNonaktif = false;
    $catRaw = $_POST['category_id'] ?? '';
    if ($catRaw === '' || $catRaw === null) {
        $errors['category_id'] = 'Kategori wajib dipilih';
    } else {
        $kategoriId = parse_id($catRaw);
        if ($kategoriId === null) {
            $errors['category_id'] = 'Kategori tidak valid';
        } else {
            $stmt = $pdo->prepare('SELECT status FROM menu_category WHERE id = :id');
            $stmt->execute([':id' => $kategoriId]);
            $statusKategori = $stmt->fetchColumn();
            if ($statusKategori === false) {
                $errors['category_id'] = 'Kategori tidak ditemukan';
            } elseif ($statusKategori !== 'aktif' && !($ubah && $kategoriId === (int) $lama['category_id'])) {
                $errors['category_id'] = 'Kategori nonaktif tidak dapat dipilih';
                $kategoriNonaktif = true;
            }
        }
    }

    // Label: opsional, harus salah satu nilai enum.
    //  - tambah: tidak dikirim / kosong -> tanpa label
    //  - ubah  : tidak dikirim -> TIDAK diubah; dikirim kosong -> dikosongkan; dikirim nilai -> diganti
    $labelDikirim = array_key_exists('label', $_POST);
    $labelBaru    = null;
    if ($labelDikirim) {
        $labelRaw = $_POST['label'];
        if (!is_string($labelRaw)) {
            $errors['label'] = 'Label tidak valid';
        } elseif ($labelRaw !== '') {
            if (in_array($labelRaw, daftar_enum_label($pdo), true)) {
                $labelBaru = $labelRaw;
            } else {
                $errors['label'] = 'Label tidak dikenal';
            }
        }
    }

    // Foto: wajib saat tambah
    if (!$ubah && !foto_dikirim()) {
        $errors['foto'] = 'Foto wajib diunggah';
    }

    if ($errors) {
        $kunci = array_keys($errors);
        if ($kunci === ['label']) {
            respond_error_field(400, 'MNU-4009', 'Label tidak valid', $errors);
        }
        if ($kunci === ['category_id'] && $kategoriNonaktif) {
            respond_error_field(400, 'MNU-4010', 'Kategori nonaktif tidak dapat dipilih', $errors);
        }
        respond_error_field(400, 'MNU-4008', 'Data menu tidak lengkap atau tidak valid', $errors);
    }

    // ---- foto (hanya jika dikirim): periksa dan rapikan --------------------------
    $pathBaru = null;
    if (foto_dikirim()) {
        $tmp      = foto_periksa_upload($_FILES['foto']);   // PNG sungguhan, maks 2 MB, dimensi wajar
        $biner    = foto_rapikan($tmp);                      // latar transparan, pangkas area kosong, kecilkan (card 14.5.1)
        $pathBaru = foto_simpan($biner, $nama);
    }

    try {
        if (!$ubah) {
            // ---- TAMBAH -----------------------------------------------------------
            $pdo->beginTransaction();
            $urutan = (int) $pdo->query('SELECT COALESCE(MAX(urutan), 0) + 1 FROM menu FOR UPDATE')->fetchColumn();

            $baru = 0;
            for ($coba = 1; ; $coba++) {
                $slug = slug_unik($pdo, 'menu', slugify($nama));
                try {
                    $stmt = $pdo->prepare(
                        'INSERT INTO menu (category_id, nama, slug, deskripsi, harga, foto, label, urutan, status)
                         VALUES (:c, :nama, :slug, :deskripsi, :harga, :foto, :label, :urutan, \'aktif\')'
                    );
                    $stmt->execute([
                        ':c' => $kategoriId, ':nama' => $nama, ':slug' => $slug, ':deskripsi' => $deskripsi,
                        ':harga' => $harga, ':foto' => $pathBaru, ':label' => $labelBaru, ':urutan' => $urutan,
                    ]);
                    $baru = (int) $pdo->lastInsertId();
                    break;
                } catch (PDOException $e) {
                    // dua permintaan bersamaan menghasilkan slug yang sama: coba lagi dengan akhiran baru
                    if (!adalah_duplikat($e) || $coba >= 3) {
                        throw $e;
                    }
                }
            }
            $pdo->commit();
            $idHasil = $baru;
        } else {
            // ---- UBAH -------------------------------------------------------------
            $set    = ['category_id = :c', 'nama = :nama', 'deskripsi = :deskripsi', 'harga = :harga'];
            $params = [':c' => $kategoriId, ':nama' => $nama, ':deskripsi' => $deskripsi, ':harga' => $harga, ':id' => $id];
            if ($labelDikirim) {                // tidak dikirim = tidak diubah
                $set[]            = 'label = :label';
                $params[':label'] = $labelBaru; // null = dikosongkan
            }
            if ($pathBaru !== null) {           // tidak dikirim = foto lama tetap
                $set[]           = 'foto = :foto';
                $params[':foto'] = $pathBaru;
            }
            $pdo->beginTransaction();
            $stmt = $pdo->prepare('UPDATE menu SET ' . implode(', ', $set) . ' WHERE id = :id');
            $stmt->execute($params);
            // card 14.6.1: label diubah atau dicabut -> menu keluar dari menu pilihan beranda
            if ($labelDikirim && $labelBaru !== $lama['label']) {
                keluarkan_dari_menu_pilihan($pdo, $id);
            }
            $pdo->commit();
            $idHasil = $id;
        }
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        foto_hapus_file($pathBaru);   // gagal menyimpan data: jangan sisakan foto yatim
        throw $e;
    }

    // Foto lama dihapus setelah perubahan berhasil, kecuali dipakai menu lain atau foto bersama
    if ($ubah && $pathBaru !== null) {
        foto_bersihkan($pdo, $lama['foto'], $id);
    }

    respond(
        $ubah ? 200 : 201,
        true,
        $ubah ? 'Menu berhasil diperbarui' : 'Menu berhasil ditambahkan',
        ambil_menu($pdo, $idHasil)
    );
} catch (Throwable $e) {
    error_log('[MNU-5010] admin/menu POST: ' . $e->getMessage());
    respond(500, false, 'Menu gagal disimpan', null, 'MNU-5010');
}