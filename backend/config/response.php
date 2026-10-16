<?php
// backend/config/response.php
// Fungsi pembantu yang dipakai semua endpoint di backend/api/ agar format JSON seragam.

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// true  = ?simulate_error=1 aktif (untuk SQA saat pengujian)
// false = dimatikan (ubah ke false sebelum rilis / produksi)
const APP_DEBUG = true;

/**
 * Kirim response JSON lalu hentikan script.
 * Format selalu: { success, message, data }
 */
function respond(int $status, bool $success, string $message, $data = null): void
{
    http_response_code($status);
    echo json_encode(
        ['success' => $success, 'message' => $message, 'data' => $data],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

/**
 * Hanya izinkan method GET. Method lain -> 405.
 * Request OPTIONS (preflight CORS dari browser) dijawab 204.
 */
function only_get(): void
{
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if ($method !== 'GET') {
        header('Allow: GET');
        respond(405, false, 'Method tidak diizinkan');
    }
}

/**
 * Cara SQA mensimulasikan error: tambahkan ?simulate_error=1 pada URL.
 * Hanya aktif jika APP_DEBUG = true.
 */
function simulate_error(string $message): void
{
    if (APP_DEBUG && ($_GET['simulate_error'] ?? '') === '1') {
        respond(500, false, $message);
    }
}

/**
 * URL dasar folder backend/ (contoh: http://localhost/manajemenProyek/manajamen-proyek-kelompok-3/backend).
 * Dipakai untuk mengubah path gambar di database menjadi URL lengkap.
 * Dipanggil dari file di backend/api/, sehingga dirname dua kali = folder backend.
 */
function base_url(): string
{
    $https  = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $scheme = $https ? 'https' : 'http';

    return $scheme . '://' . $_SERVER['HTTP_HOST'] . dirname(dirname($_SERVER['SCRIPT_NAME']));
}