<?php
// GET api/admin/session
// Card 13.1.1 [BE] API Login Admin (pemeriksaan status autentikasi)
// Dipakai FE untuk membatasi halaman dashboard.

require_once __DIR__ . '/../../config/response.php';
require_once __DIR__ . '/../../config/auth.php';

admin_prepare(['GET']);

try {
    // Tanpa sesi valid -> 401 ADM-4012
    $admin = admin_require_auth();

    // Simulasi error (hanya aktif jika APP_DEBUG = true)
    simulate_error('Pemeriksaan sesi gagal diproses', 'ADM-5001');

    respond(200, true, 'Sesi valid', [
        'authenticated' => true,
        'admin'         => [
            'id'       => $admin['id'],
            'username' => $admin['username'],
        ],
    ]);
} catch (Throwable $e) {
    error_log('[ADM-5002] session: ' . $e->getMessage());
    respond(500, false, 'Pemeriksaan sesi gagal diproses', null, 'ADM-5002');
}