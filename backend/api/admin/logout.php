<?php
// POST api/admin/logout
// Card 13.2.1 [BE] API Logout Admin

require_once __DIR__ . '/../../config/response.php';
require_once __DIR__ . '/../../config/auth.php';

admin_prepare(['POST']);

try {
    // Tanpa sesi valid / sesi sudah berakhir -> 401 ADM-4012
    admin_require_auth();

    // Simulasi "logout gagal" (hanya aktif jika APP_DEBUG = true).
    // Dijalankan setelah cek sesi, jadi sesi TIDAK diakhiri (admin tetap login).
    simulate_error('Logout gagal diproses', 'ADM-5003');

    // Hapus data sesi di server + cookie di browser
    if (!admin_destroy_session()) {
        throw new RuntimeException('session_destroy gagal');
    }

    respond(200, true, 'Logout berhasil', null);
} catch (Throwable $e) {
    error_log('[ADM-5003] logout: ' . $e->getMessage());
    respond(500, false, 'Logout gagal diproses', null, 'ADM-5003');
}