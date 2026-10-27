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
 * Format sekarang mendukung error_code untuk keperluan SQA/Testing.
 */
function respond(int $status, bool $success, string $message, $data = null, ?string $error_code = null): void
{
    http_response_code($status);
    
    // Menyusun response dasar
    $payload = [
        'success' => $success,
        'message' => $message
    ];

    // PERBAIKAN QA: Jika gagal dan ada error_code, sisipkan ke dalam JSON
    if (!$success && $error_code !== null) {
        $payload['error_code'] = $error_code;
    }

    // Properti data tetap disertakan sesuai struktur awal Anda
    $payload['data'] = $data;

    echo json_encode(
        $payload,
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
        // PERBAIKAN QA: Menambahkan error code global untuk method yang salah
        respond(405, false, 'Method tidak diizinkan', null, 'SYS-4050');
    }
}

/**
 * Cara SQA mensimulasikan error: tambahkan ?simulate_error=1 pada URL.
 * Hanya aktif jika APP_DEBUG = true.
 */
// PERBAIKAN QA: Menambahkan parameter $error_code agar simulasi error memiliki kode unik
function simulate_error(string $message, string $error_code): void
{
    if (APP_DEBUG && ($_GET['simulate_error'] ?? '') === '1') {
        respond(500, false, $message, null, $error_code);
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
