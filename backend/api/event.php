<?php
// GET /api/event.php?id={id}
// Card 6.1 - Detail satu event berdasarkan ID (dari carousel beranda). Publik, tanpa login.
//
// GET /api/event.php   (tanpa parameter id)
// Card 11.1 - Daftar semua event untuk halaman Event. Publik, tanpa login.
// Data: id (sama dengan id di API carousel), nama, foto, deskripsi, tanggal, waktu, lokasi, status event.
// Status event dihitung dari tanggal event, bukan dari kolom `status` di tabel (itu aktif/nonaktif).

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

const STATUS_EVENT_AKAN    = 'Akan Diselenggarakan';
const STATUS_EVENT_SELESAI = 'Sudah Selesai';

/**
 * Card 11.1 - Daftar event untuk halaman Event.
 * Event berstatus aktif. Status event: tanggal hari ini atau setelahnya = "Akan Diselenggarakan",
 * tanggal sebelum hari ini = "Sudah Selesai" (zona waktu Asia/Jakarta). Event tanpa tanggal: status null.
 * Urutan (kesepakatan dengan PM): yang akan diselenggarakan dulu, lalu yang sudah selesai;
 * di dalam tiap kelompok, tanggal yang paling awal tampil lebih dulu.
 */

function kirim_daftar_event(): void
{
    simulate_error('Daftar event gagal dimuat', 'EVE-5003');

    try {
        $stmt = db()->query(
            'SELECT id, nama, foto, deskripsi, tanggal, waktu, lokasi
               FROM event
              WHERE status = \'aktif\''
        );
        $rows = $stmt->fetchAll();

        $hari_ini = (new DateTime('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d');

        // 0 = akan diselenggarakan, 1 = sudah selesai, 2 = tanpa tanggal
        $kelompok = static function (array $r) use ($hari_ini): int {
            if ($r['tanggal'] === null) {
                return 2;
            }
            return $r['tanggal'] >= $hari_ini ? 0 : 1;
        };

        usort($rows, static function (array $a, array $b) use ($kelompok): int {
            $ka = $kelompok($a);
            $kb = $kelompok($b);
            if ($ka !== $kb) {
                return $ka <=> $kb;
            }
            if ($ka === 2) {
                return (int) $a['id'] <=> (int) $b['id'];
            }
            // kelompok 0 dan 1: tanggal paling awal dulu, tanggal sama diurutkan menurut id
            return [$a['tanggal'], (int) $a['id']] <=> [$b['tanggal'], (int) $b['id']];
        });

        $data = array_map(static function (array $r) use ($kelompok): array {
            $k = $kelompok($r);
            return [
                'id'        => (int) $r['id'],   // sama dengan id event di API carousel
                'nama'      => $r['nama'],
                'foto'      => $r['foto'],       // path relatif, contoh: uploads/event/open-mic.png
                'deskripsi' => $r['deskripsi'],  // deskripsi utuh, tidak dipotong
                'tanggal'   => $r['tanggal'],    // YYYY-MM-DD, bisa null
                'waktu'     => $r['waktu'],      // HH:MM:SS, bisa null
                'lokasi'    => $r['lokasi'],     // bisa null
                'status'    => $k === 0 ? STATUS_EVENT_AKAN : ($k === 1 ? STATUS_EVENT_SELESAI : null),
            ];
        }, $rows);

        // Belum ada event: bukan error, FE yang memutuskan tampilannya
        if (!$data) {
            respond(200, true, 'Belum ada event', []);
        }

        respond(200, true, 'Daftar event berhasil diambil', $data);

    } catch (PDOException $e) {
        error_log('[event.php] ' . $e->getMessage());
        respond(500, false, 'Daftar event gagal dimuat', null, 'EVE-5004');
    }
}

only_get();

// Card 11.1: tanpa parameter id = daftar event
if (!isset($_GET['id'])) {
    kirim_daftar_event();
}

// Card 6.1: detail event
simulate_error('Detail event gagal dimuat', 'EVE-5001');

$id = $_GET['id'] ?? '';

if ($id === '') {
    respond(400, false, 'Parameter id wajib diisi', null, 'EVE-4001');
}
if (!is_string($id) || !ctype_digit($id) || (int) $id < 1) {
    respond(400, false, 'Parameter id tidak valid', null, 'EVE-4002');
}

try {
    $stmt = db()->prepare(
        'SELECT id, nama, foto, deskripsi, tanggal, waktu, lokasi
           FROM event
          WHERE id = :id AND status = \'aktif\'
          LIMIT 1'
    );
    $stmt->execute([':id' => (int) $id]);
    $r = $stmt->fetch();

    if (!$r) {
        respond(404, false, 'Event tidak ditemukan', null, 'EVE-4041');
    }

    respond(200, true, 'Detail event berhasil diambil', [
        'id'        => (int) $r['id'],
        'nama'      => $r['nama'],
        'foto'      => $r['foto'],       // path relatif, contoh: uploads/event/open-mic.png
        'deskripsi' => $r['deskripsi'],
        'tanggal'   => $r['tanggal'],    // YYYY-MM-DD
        'waktu'     => $r['waktu'],      // HH:MM:SS
        'lokasi'    => $r['lokasi'],
    ]);

} catch (PDOException $e) {
    error_log('[event.php] ' . $e->getMessage());
    respond(500, false, 'Detail event gagal dimuat', null, 'EVE-5002');
}