<?php

header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

$sql = "SELECT * FROM operating_hours
        ORDER BY cafe_id ASC, urutan ASC";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data operating hours'
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