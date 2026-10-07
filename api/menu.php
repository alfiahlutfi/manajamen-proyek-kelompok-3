<?php

header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

$sql = "SELECT
            menu.id,
            menu.category_id,
            menu.nama,
            menu.slug,
            menu.deskripsi,
            menu.harga,
            menu.gambar,
            menu.label,
            menu.urutan,
            menu.status,
            menu.created_at,
            menu.updated_at,
            menu_category.nama AS category_nama,
            menu_category.slug AS category_slug
        FROM menu
        INNER JOIN menu_category
            ON menu.category_id = menu_category.id
        WHERE menu.status = 'aktif'
          AND menu_category.status = 'aktif'
        ORDER BY menu_category.urutan ASC,
                 menu.urutan ASC,
                 menu.id ASC";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data menu'
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