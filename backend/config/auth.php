<?php
// backend/config/auth.php
// Fungsi pembantu autentikasi admin (session + cookie).
// Dipakai semua endpoint di backend/api/admin/. Wajib di-require SETELAH response.php.

// Masa berlaku sesi (idle timeout) dalam detik.
const ADMIN_SESSION_LIFETIME = 1800;

// Hash dummy supaya waktu respons tetap mirip walau username tidak ditemukan
// (mencegah user enumeration lewat selisih waktu). Bukan password asli siapa pun.
const ADMIN_DUMMY_HASH = '$2y$10$kiKL7vwZLzTLOj5TxmYAgezKcj7HGS.m1mp.Ilvwgr1Vt/njCZNEm';

// Origin FE yang boleh memanggil API admin dari domain/port berbeda
const ADMIN_ALLOWED_ORIGINS = [
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://acalacafe.ifree.page', // <-- Tambahkan domain hosting Anda di sini
];

/**
 * Persiapan awal SETIAP endpoint admin: header no-cache, CORS khusus admin,
 * preflight OPTIONS (204), dan cek method (405 SYS-4050).
 *
 * response.php mengirim "Access-Control-Allow-Origin: *" dan hanya mengizinkan GET.
 * Itu tidak cocok untuk API admin (butuh POST dan cookie), jadi di sini di-override
 * khusus untuk endpoint admin. Endpoint publik tidak terpengaruh.
 */
function admin_prepare(array $allowedMethods): void
{
    // Jangan di-cache, supaya tombol back setelah logout tidak menampilkan data lama.
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, ADMIN_ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);   // ganti "*" dari response.php
        header('Access-Control-Allow-Credentials: true');    // izinkan cookie sesi
        header('Vary: Origin');
    } else {
        header_remove('Access-Control-Allow-Origin');        // buang "*" (tidak boleh dipakai dengan cookie)
    }
    header('Access-Control-Allow-Methods: ' . implode(', ', array_merge($allowedMethods, ['OPTIONS'])));
    header('Access-Control-Allow-Headers: Content-Type');

    $method = $_SERVER['REQUEST_METHOD'] ?? '';

    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if (!in_array($method, $allowedMethods, true)) {
        header('Allow: ' . implode(', ', $allowedMethods));
        respond(405, false, 'Method tidak diizinkan', null, 'SYS-4050');
    }
}

/**
 * Baca body JSON. Mengembalikan stdClass kalau body adalah objek JSON valid,
 * selain itu null (kosong, bukan JSON, atau JSON bukan objek).
 */
function admin_read_json_body(): ?stdClass
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return null;
    }
    $decoded = json_decode($raw);
    if (json_last_error() !== JSON_ERROR_NONE || !($decoded instanceof stdClass)) {
        return null;
    }
    return $decoded;
}

function admin_session_start(): void
{
    if (session_status() !== PHP_SESSION_NONE) {
        return;
    }

    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string) ADMIN_SESSION_LIFETIME);

    session_set_cookie_params([
        'lifetime' => 0,        // cookie sesi: hilang saat browser ditutup
        'path'     => '/',
        'secure'   => $https,
        'httponly' => true,     // tidak bisa dibaca JavaScript
        'samesite' => 'Lax',
    ]);
    session_start();
}

/** Hapus data sesi di server + cookie di browser. */
function admin_destroy_session(): bool
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires'  => time() - 42000,
            'path'     => $p['path'],
            'domain'   => $p['domain'],
            'secure'   => $p['secure'],
            'httponly' => $p['httponly'],
            'samesite' => $p['samesite'] ?: 'Lax',
        ]);
    }
    return session_destroy();
}

/**
 * Kembalikan ['id' => int, 'username' => string] kalau sesi admin valid, selain itu null.
 * Sesi yang idle lebih lama dari ADMIN_SESSION_LIFETIME dianggap berakhir.
 */
function admin_current(): ?array
{
    // Tanpa cookie sesi tidak perlu membuat sesi baru (hindari sesi kosong tiap request).
    if (empty($_COOKIE[session_name()])) {
        return null;
    }

    admin_session_start();

    if (empty($_SESSION['admin_id']) || empty($_SESSION['admin_username'])) {
        // Cookie tidak dikenal / sesi kosong: bersihkan, jangan sisakan sesi kosong.
        admin_destroy_session();
        return null;
    }

    $last = (int) ($_SESSION['last_activity'] ?? 0);
    if ($last === 0 || (time() - $last) > ADMIN_SESSION_LIFETIME) {
        admin_destroy_session();
        return null;
    }

    $_SESSION['last_activity'] = time();

    return [
        'id'       => (int) $_SESSION['admin_id'],
        'username' => (string) $_SESSION['admin_username'],
    ];
}

/**
 * Pakai di SEMUA endpoint admin (termasuk card 14 & 15).
 * Tanpa sesi valid -> 401 ADM-4012.
 */
function admin_require_auth(): array
{
    $admin = admin_current();
    if ($admin === null) {
        respond(401, false, 'Sesi tidak valid. Silakan login kembali', null, 'ADM-4012');
    }
    return $admin;
}