<?php

header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

$sql = "SELECT * FROM menu_category
        WHERE status = 'aktif'
        ORDER BY urutan ASC, id ASC";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil kategori menu'
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