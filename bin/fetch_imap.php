<?php
// bin/fetch_imap.php - Script CLI para leer buzón IMAP y acoplar a SICODI
require_once __DIR__ . '/../app/core/Database.php';

echo "SICODI IMAP Fetcher Inicializando...\n";

$imap_server = "{imap.institucion.gov:993/imap/ssl}INBOX";
$imap_user = "sicodi@institucion.gov";
$imap_pass = "password_acceso_sicodi";

if (!function_exists('imap_open')) {
    echo "[!] Dependencia php-imap no instalada. Usando simulador offline...\n";
    // MOCK: Fingimos leer 1 correo si no hay conexión real.
    $emails = [
        ['subject' => 'OFICIO MULTIPLE 001/2026', 'from' => 'sistemas@institucion.gov', 'body' => 'Solicitud de alta de usuario']
    ];
} else {
    $inbox = @imap_open($imap_server, $imap_user, $imap_pass) or die('No se pudo conectar a IMAP: ' . imap_last_error());
    $emails_raw = imap_search($inbox, 'UNSEEN');
    $emails = [];
    if ($emails_raw) {
        foreach ($emails_raw as $email_number) {
            $overview = imap_fetch_overview($inbox, $email_number, 0);
            $message = imap_fetchbody($inbox, $email_number, 1);
            $emails[] = [
                'subject' => $overview[0]->subject,
                'from' => $overview[0]->from,
                'body' => $message
            ];
            // Marcar leido
            // imap_setflag_full($inbox, $email_number, "\\Seen");
        }
    }
    imap_close($inbox);
}

// Inserción en Base de Datos MOCK / REAL
$db = \App\Core\Database::getInstance();
foreach ($emails as $email) {
    try {
        $stmt = $db->prepare('INSERT INTO mail_messages (usuario_id, from_email, to_email, subject, body, status, created_at) VALUES (1, :from, :to, :subj, :body, "RECEIVED", NOW())');
        $stmt->execute([
            ':from' => $email['from'],
            ':to'   => 'Buzón Central SICODI',
            ':subj' => $email['subject'],
            ':body' => substr($email['body'], 0, 500)
        ]);
        echo "[+] Correo ingerido: " . $email['subject'] . "\n";
    } catch (\Exception $e) {
        echo "[-] Error insertando correo: " . $e->getMessage() . "\n";
    }
}

echo "Proceso finalizado.\n";
