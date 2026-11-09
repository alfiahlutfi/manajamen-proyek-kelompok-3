<?php
// GET /api/reservation_rule.php
// Card 12.3.1 - API data aturan reservasi.
// Publik, tanpa login.
//
// ?limit=3       = mengambil 3 aturan pertama.
// Tanpa parameter = mengambil seluruh aturan aktif.
// ?id_area=1     = mengambil aturan umum + aturan khusus area 1.
// ?id_area=1&limit=3 = mengambil maksimal 3 aturan untuk area 1.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

only_get();

simulate_error('Aturan reservasi gagal dimuat', 'ATR-5001');

try {
    $pdo = db();

    // Validasi parameter limit
    $limit = null;

    if (isset($_GET['limit'])) {
        $limit = filter_var(
            $_GET['limit'],
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1, 'max_range' => 100]]
        );

        if ($limit === false) {
            respond(400, false, 'Parameter limit tidak valid', null, 'ATR-4001');
        }
    }

    // Validasi parameter id_area
    $idArea = null;

    if (isset($_GET['id_area'])) {
        $idArea = filter_var(
            $_GET['id_area'],
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );

        if ($idArea === false) {
            respond(400, false, 'Parameter id_area tidak valid', null, 'ATR-4002');
        }

        // Pastikan area tersedia dan berstatus aktif
        $checkArea = $pdo->prepare(
            "SELECT id FROM area WHERE id = :id AND status = 'aktif'"
        );
        $checkArea->bindValue(':id', $idArea, PDO::PARAM_INT);
        $checkArea->execute();

        if (!$checkArea->fetchColumn()) {
            respond(404, false, 'Area tidak ditemukan atau tidak aktif', null, 'ATR-4003');
        }
    }

    $sql = 'SELECT r.id, r.id_area, r.judul, r.isi
              FROM reservation_rule r
              LEFT JOIN area a ON a.id = r.id_area
             WHERE r.status = \'aktif\'
               AND (r.id_area IS NULL OR a.status = \'aktif\')';

    // Jika id_area dikirim, ambil aturan umum dan aturan khusus area tersebut
    if ($idArea !== null) {
        $sql .= ' AND (r.id_area IS NULL OR r.id_area = :id_area)';
    }

    $sql .= ' ORDER BY r.urutan, r.id';

    // Batasi jumlah data jika parameter limit dikirim
    if ($limit !== null) {
        $sql .= ' LIMIT ' . (int) $limit;
    }

    $stmt = $pdo->prepare($sql);

    if ($idArea !== null) {
        $stmt->bindValue(':id_area', $idArea, PDO::PARAM_INT);
    }

    $stmt->execute();

    $data = array_map(static function (array $r): array {
        return [
            'id'      => (int) $r['id'],
            'judul'   => $r['judul'],
            'isi'     => $r['isi'],
            'id_area' => $r['id_area'] === null
                ? null
                : (int) $r['id_area'],
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));

    if (!$data) {
        respond(200, true, 'Belum ada aturan reservasi', []);
    }

    respond(200, true, 'Aturan reservasi berhasil diambil', $data);

} catch (PDOException $e) {
    error_log('[reservation_rule.php] ' . $e->getMessage());
    respond(500, false, 'Aturan reservasi gagal dimuat', null, 'ATR-5002');
}