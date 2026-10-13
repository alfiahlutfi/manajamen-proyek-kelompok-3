<?php

header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

$sql = "SELECT
            c.id,
            c.id_event,
            c.urutan,

            e.nama,
            e.slug,
            e.deskripsi,
            e.gambar,
            e.tanggal,
            e.waktu,
            e.lokasi

        FROM `carousel` c

        INNER JOIN `event` e
            ON c.id_event = e.id

        WHERE c.status = 'aktif'
          AND e.status = 'aktif'

        ORDER BY c.urutan ASC, c.id ASC";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data carousel'
    ]);

    $conn->close();
    exit;
}

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $data
]);

$conn->close();