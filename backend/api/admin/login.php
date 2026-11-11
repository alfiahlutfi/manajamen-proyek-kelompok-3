<?php
// POST api/admin/login
// Card 13.1.1 [BE] API Login Admin

require_once __DIR__ . '/../../config/response.php';
require_once __DIR__ . '/../../config/auth.php';
require_once __DIR__ . '/../../config/database.php'; // SESUAIKAN: file koneksi DB yang dipakai endpoint lain (di sini diasumsikan menyediakan $pdo)

admin_prepare(['POST']);

// Simulasi error (hanya aktif jika APP_DEBUG = true)
simulate_error('Login gagal diproses', 'ADM-5001');

// 1. Body harus JSON objek yang valid
$body = admin_read_json_body();
if ($body === null) {
    respond(400, false, 'Format request tidak valid', null, 'ADM-4002');
}

// 2. Field wajib
$username = $body->username ?? null;
$password = $body->password ?? null;

if (
    !is_string($username) || !is_string($password)
    || trim($username) === '' || $password === ''
) {
    respond(400, false, 'Username dan password wajib diisi', null, 'ADM-4001');
}

$username = trim($username);

try {
    // 3. Cari akun. Username lebih dari 50 karakter pasti tidak ada -> dianggap salah.
    $admin = false;
    if (mb_strlen($username) <= 50) {
        $stmt = $pdo->prepare(
            'SELECT id, username, password_hash, status FROM admin WHERE username = :username LIMIT 1'
        );
        $stmt->execute([':username' => $username]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 4. Cocokkan password. Kalau akun tidak ada, tetap verifikasi hash dummy
    //    agar waktu respons tidak membocorkan keberadaan username.
    $hash  = $admin ? (string) $admin['password_hash'] : ADMIN_DUMMY_HASH;
    $valid = password_verify($password, $hash);

    if (!$admin || !$valid) {
        respond(401, false, 'Username atau password salah', null, 'ADM-4011');
    }

    // 5. Status akun baru diperiksa SETELAH password cocok
    //    (403 tidak membocorkan keberadaan username).
    if (strtolower((string) $admin['status']) !== 'aktif') {
        respond(403, false, 'Akun tidak aktif', null, 'ADM-4031');
    }

    // 6. Buat sesi. regenerate_id mencegah session fixation.
    admin_session_start();
    session_regenerate_id(true);
    $_SESSION['admin_id']       = (int) $admin['id'];
    $_SESSION['admin_username'] = (string) $admin['username'];
    $_SESSION['login_at']       = time();
    $_SESSION['last_activity']  = time();

    // 7. Response: password / hash TIDAK ikut dikirim
    respond(200, true, 'Login berhasil', [
        'id'       => (int) $admin['id'],
        'username' => (string) $admin['username'],
    ]);
} catch (Throwable $e) {
    error_log('[ADM-5002] login: ' . $e->getMessage());
    respond(500, false, 'Login gagal diproses', null, 'ADM-5002');
}