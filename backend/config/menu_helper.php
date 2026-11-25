<?php
// backend/config/menu_helper.php
// Fungsi pembantu umum untuk API admin pengelolaan menu (card 14).
// Di-require SETELAH response.php dan auth.php.

const KATEGORI_NAMA_MAX = 100;   // sesuai kolom menu_category.nama varchar(100)

/** Ubah nilai query/JSON menjadi ID bulat >= 1, selain itu null. */
function parse_id($value): ?int
{
    if (is_int($value)) {
        return ($value >= 1 && $value <= 2147483647) ? $value : null;
    }
    if (!is_string($value) || !preg_match('/^[1-9][0-9]{0,9}$/', $value)) {
        return null;
    }
    $n = (int) $value;
    return $n <= 2147483647 ? $n : null;
}

/** Teks satu baris: buang karakter kontrol, rapikan spasi berlebih, trim. Bukan string -> ''. */
function teks_satu_baris($value): string
{
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')) {
        return '';
    }
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
    return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
}

/** "Milk Based Coffe" -> "milk-based-coffe". Hasil kosong -> "item". */
function slugify(string $teks, string $pemisah = '-', int $maks = 90): string
{
    $s = mb_strtolower($teks, 'UTF-8');
    $s = preg_replace('/[^a-z0-9]+/', $pemisah, $s) ?? '';
    $s = trim($s, $pemisah);
    $s = trim(substr($s, 0, $maks), $pemisah);
    return $s !== '' ? $s : 'item';
}

/** Slug yang belum dipakai pada $tabel (kolom slug). Tabrakan diberi akhiran -2, -3, ... */
function slug_unik(PDO $pdo, string $tabel, string $dasar): string
{
    $stmt = $pdo->prepare("SELECT 1 FROM `{$tabel}` WHERE slug = :slug LIMIT 1");
    $slug = $dasar;
    for ($i = 2; ; $i++) {
        $stmt->execute([':slug' => $slug]);
        if (!$stmt->fetch()) {
            return $slug;
        }
        $slug = $dasar . '-' . $i;
    }
}

/** Kirim respons gagal dengan daftar field bermasalah di data.errors (FE menandai field). */
function respond_error_field(int $status, string $kode, string $pesan, array $errors): void
{
    respond($status, false, $pesan, ['errors' => $errors], $kode);
}

/** PDOException karena pelanggaran foreign key saat DELETE (data masih dipakai). */
function adalah_fk_dipakai(PDOException $e): bool
{
    return isset($e->errorInfo[1]) && (int) $e->errorInfo[1] === 1451;
}

/** PDOException karena nilai ganda pada unique key. */
function adalah_duplikat(PDOException $e): bool
{
    return isset($e->errorInfo[1]) && (int) $e->errorInfo[1] === 1062;
}

/** Satu kategori dalam bentuk respons. jumlah_menu = semua menu (aktif dan nonaktif). */
function bentuk_kategori(array $r): array
{
    return [
        'id'          => (int) $r['id'],
        'nama'        => $r['nama'],
        'status'      => $r['status'],            // aktif | nonaktif
        'jumlah_menu' => (int) $r['jumlah_menu'],
    ];
}

function ambil_kategori(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT c.id, c.nama, c.status, COUNT(m.id) AS jumlah_menu
           FROM menu_category c
           LEFT JOIN menu m ON m.category_id = c.id
          WHERE c.id = :id
          GROUP BY c.id, c.nama, c.status'
    );
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();
    return $r ? bentuk_kategori($r) : null;
}

/**
 * Nilai-nilai enum kolom menu.label, dibaca dari definisi kolom di database (urutan sesuai definisi).
 * Tidak ada daftar nilai yang ditulis di kode. Melempar RuntimeException jika kolom bukan enum.
 */
function daftar_enum_label(PDO $pdo): array
{
    $row  = $pdo->query("SHOW COLUMNS FROM `menu` LIKE 'label'")->fetch();
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
    return array_values($nilai);
}

// ---------------------------------------------------------------------------
// Menu (card 14.3.1 dan 14.4.1)
// ---------------------------------------------------------------------------
const MENU_NAMA_MAX      = 100;         // sesuai kolom menu.nama varchar(100)
const MENU_DESKRIPSI_MAX = 1000;        // batas panjang deskripsi (kolom text, dibatasi agar wajar)
const MENU_HARGA_MAX     = 2147483647;  // batas kolom int

/** Teks panjang (deskripsi): buang karakter NUL, trim, baris baru dipertahankan. Bukan string -> ''. */
function teks_panjang($value): string
{
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')) {
        return '';
    }
    return trim(str_replace("\0", '', $value));
}

/** Kolom yang dikirim ke FE untuk satu menu (dipakai daftar, detail, tambah, ubah, ubah status). */
const SQL_SELECT_MENU =
    'SELECT m.id, m.foto, m.nama, m.deskripsi, m.harga,
            m.category_id, c.nama AS kategori, c.status AS kategori_status,
            m.label, m.status, m.created_at
       FROM menu m
       JOIN menu_category c ON c.id = m.category_id';

function bentuk_menu(array $r): array
{
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
}

/** Satu menu dalam bentuk respons, atau null jika tidak ada. */
function ambil_menu(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(SQL_SELECT_MENU . ' WHERE m.id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $r = $stmt->fetch();
    return $r ? bentuk_menu($r) : null;
}

// ---------------------------------------------------------------------------
// Menu pilihan beranda (card 14.6.1)
// ---------------------------------------------------------------------------
const MENU_PILIHAN_MIN = 1;   // minimal menu pada satu penyimpanan
const MENU_PILIHAN_MAX = 4;   // maksimal menu pada satu penyimpanan

/** Satu menu dalam bentuk respons + penanda kategori nonaktif (dipakai API admin menu pilihan). */
function bentuk_menu_pilihan(array $r): array
{
    $menu = bentuk_menu($r);
    $menu['kategori_nonaktif'] = $menu['kategori_status'] === 'nonaktif';
    return $menu;
}

/**
 * Pengaturan menu pilihan beranda: label terpilih (null jika belum pernah disimpan) dan menu terpilih,
 * urut menurut kolom urutan lalu id (BUKAN urutan pemilihan admin). Menu pada kategori nonaktif tetap
 * ikut (hanya disembunyikan dari pelanggan) dan ditandai kategori_nonaktif = true.
 */
function ambil_pengaturan_menu_pilihan(PDO $pdo): array
{
    $label = $pdo->query('SELECT label FROM menu_pilihan_pengaturan WHERE id = 1')->fetchColumn();
    $rows  = $pdo->query(
        SQL_SELECT_MENU . ' JOIN menu_pilihan p ON p.menu_id = m.id ORDER BY m.urutan, m.id'
    )->fetchAll();

    return [
        'label' => ($label === false || $label === '') ? null : $label,
        'menu'  => array_map('bentuk_menu_pilihan', $rows),
    ];
}

/**
 * Keluarkan satu menu dari menu pilihan beranda. Dipanggil api/admin/menu.php saat menu dinonaktifkan
 * atau labelnya diubah/dicabut. Menu TIDAK kembali otomatis saat diaktifkan atau diberi label lagi.
 * Pakai di dalam transaksi yang sama dengan perubahan menu agar keduanya berhasil atau gagal bersama.
 */
function keluarkan_dari_menu_pilihan(PDO $pdo, int $menuId): void
{
    $stmt = $pdo->prepare('DELETE FROM menu_pilihan WHERE menu_id = :id');
    $stmt->execute([':id' => $menuId]);
}