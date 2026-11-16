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