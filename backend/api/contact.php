<?php
// GET /api/contact.php
// Card 8.1 - API kontak cafe untuk footer (nomor telepon, email, URL WhatsApp, URL Gmail,
// URL Instagram, URL TikTok). Publik, tanpa login.
//
// Sumber: tabel `cafe` (kolom whatsapp, email, instagram, tiktok).
// url_whatsapp dan url_gmail dibuat oleh API dari nomor dan email di database.

require_once __DIR__ . '/../config/response.php';
require_once __DIR__ . '/../config/database.php';

// Hanya terima tautan http/https (mencegah isi seperti "javascript:..." terbawa ke href di FE)
function url_http(?string $nilai): ?string
{
    $nilai = trim((string) $nilai);
    return preg_match('#^https?://#i', $nilai) ? $nilai : null;
}

// "+62 878 787 578 08" -> https://wa.me/6287878757808 ; awalan 0 diganti 62
function url_whatsapp(?string $nomor): ?string
{
    $digit = preg_replace('/\D+/', '', (string) $nomor);
    if ($digit === '') {
        return null;
    }
    if ($digit[0] === '0') {
        $digit = '62' . substr($digit, 1);
    }
    return 'https://wa.me/' . $digit;
}

only_get();
simulate_error('Data kontak gagal dimuat', 'CON-5001');

try {
    $stmt = db()->query(
        'SELECT whatsapp, email, instagram, tiktok
           FROM cafe
          ORDER BY id
          LIMIT 1'
    );
    $row = $stmt->fetch();

    if (!$row) {
        respond(404, false, 'Data kontak cafe belum tersedia', null, 'CON-4041');
    }

    $nomor = trim((string) $row['whatsapp']);
    $email = trim((string) $row['email']);
    $email = filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;

    respond(200, true, 'Data kontak berhasil diambil', [
        'nomor_telepon' => $nomor !== '' ? $nomor : null,
        'email'         => $email,
        'url_whatsapp'  => url_whatsapp($nomor),
        'url_gmail'     => $email
            ? 'https://mail.google.com/mail/?view=cm&fs=1&to=' . rawurlencode($email)
            : null,
        'url_instagram' => url_http($row['instagram']),
        'url_tiktok'    => url_http($row['tiktok']),
    ]);

} catch (PDOException $e) {
    error_log('[contact.php] ' . $e->getMessage());
    respond(500, false, 'Data kontak gagal dimuat', null, 'CON-5002');
}
