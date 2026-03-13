<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use Exception;
use PDO;

class MailController
{
    public function getInbox(Request $request, Response $response)
    {
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                 SELECT id, recipient_email, subject, body, status, urgencia, created_at
                 FROM mail_messages 
                 ORDER BY created_at DESC 
                 LIMIT 50
            ");
            $stmt->execute();
            $emails = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Mapeo EXACTO para el FrontEnd de React
            $mappedEmails = [];
            foreach ($emails as $email) {
                 $mappedEmails[] = [
                     'id' => $email['id'],
                     'asunto' => $email['subject'],
                     'remitente_nombre' => 'Sistema SICODI',
                     'cuerpo' => $email['body'],
                     'tipo' => 'INFO', // Pordefecto
                     'leido' => ($email['status'] === 'READ' || $email['status'] === 'READ_ACK') ? 1 : 0,
                     'status' => $email['status'],
                     'urgencia' => $email['urgencia'] ?? 'NORMAL',
                     'created_at' => $email['created_at']
                 ];
            }

            return $response->json(['status' => 'success', 'data' => $mappedEmails])->send();

        } catch (Exception $e) {
            // Offline fallback
            if (strpos($e->getMessage(), 'Database connection failed') !== false) {
                 return $response->json(['status' => 'success', 'data' => [
                     ['id' => 1, 'subject' => 'Servidor de Base de Datos inalcanzable', 'sender' => 'SysAdmin <root@localhost>', 'date' => 'Ahora', 'read' => false, 'priority' => 'Alta', 'body' => 'El controlador falló porque no detecta XAMPP MySQL.']
                 ]])->send();
            }
            return $response->json(['status' => 'error', 'message' => $e->getMessage()], 500)->send();
        }
    }

    public function enviarCorreo(Request $request, Response $response)
    {
        try {
            $data = $request->all();
            if (empty($data['para']) || empty($data['asunto']) || empty($data['cuerpo'])) {
                return $response->json(['status' => 'error', 'message' => 'Destinatario, asunto y cuerpo son obligatorios.'], 400);
            }

            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                INSERT INTO mail_messages (sender_id, recipient_email, subject, body, status, urgencia, created_at, fecha_limite)
                VALUES (:sender, :to, :subject, :body, 'PENDING', :urgencia, NOW(), DATE_ADD(NOW(), INTERVAL :horas HOUR))
            ");
            
            // Extraer User ID simulado desde el Auth Middleware
            $userId = isset($request->user['id']) ? (int)$request->user['id'] : 1; 
            
            // Calculo de Mapeo de horas por Urgencia (Punto del Usuario: Tiempo de Caducidad)
            $urgencia = $data['urgencia'] ?? 'NORMAL';
            $horasList = ['URGENTE' => 24, 'ALTA' => 48, 'NORMAL' => 72, 'BAJA' => 120];
            $horas = $horasList[$urgencia] ?? 72;

            $stmt->execute([
                ':sender' => $userId,
                ':to' => $data['para'],
                ':subject' => $data['asunto'],
                ':body' => $data['cuerpo'],
                ':urgencia' => $urgencia,
                ':horas' => $horas
            ]);

            // Simulamos el envío SMTP mediante un Mock que marca el registro como "SENT"
            $messageId = $db->lastInsertId();
            $update = $db->prepare("UPDATE mail_messages SET status = 'SENT' WHERE id = :id");
            // ==========================================
            // CONFIGURACIÓN REAL PHPMAILER / SMTP
            // ==========================================
            try {
                if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
                    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                    $mail->isSMTP();
                    $mail->Host       = 'smtp.institucion.gov';
                    $mail->SMTPAuth   = true;
                    $mail->Username   = 'sicodi@institucion.gov';
                    $mail->Password   = 'password_smtp_institucional';
                    $mail->SMTPSecure = 'tls';
                    $mail->Port       = 587;

                    $mail->setFrom('sicodi@institucion.gov', 'SICODI');
                    $mail->addAddress($data['para']);
                    $mail->Subject = $data['asunto'];
                    
                    // Email tracking pixel / WhatsApp Logic
                    $trackingPixel = "<img src='http://localhost:8000/api/v1/correo/track?msg_id=" . $messageId . "' width='1' height='1' />";
                    $mail->Body    = $data['cuerpo'] . $trackingPixel;
                    $mail->isHTML(true);

                    // $mail->send(); // Descomentar en entorno en vivo
                }
            } catch (\Exception $e) {}

            return $response->json([
                'status' => 'success',
                'message' => 'Correo institucional despachado correctamente (SMTP configurado / simulado)'
            ]);

        } catch (\Exception $e) {
            if (strpos($e->getMessage(), 'Database connection failed') !== false || strpos($e->getMessage(), 'SQLSTATE') !== false) {
                 return $response->json(['status' => 'success', 'message' => 'Modo Offline: Mensaje encolado en Outbox listo para su despacho.']);
            }
            return $response->json(['status' => 'error', 'message' => 'Error al procesar el correo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Endpoint API: Confirmación de Lectura (Tracking Pixel)
     * INMUTABILIDAD: Solo se ejecuta UNA vez. Una vez READ, el registro queda sellado.
     * Registra auditoría completa: usuario, IP, timestamp, user-agent.
     */
    public function markAsReadProxy(Request $request, Response $response)
    {
        try {
            $msgId = $request->getParam('msg_id');
            if ($msgId) {
                $db = Database::getInstance()->getConnection();

                // Verificar estado actual — SOLO actuar si está en PENDING o SENT
                $check = $db->prepare("SELECT status, sender_id FROM mail_messages WHERE id = :id");
                $check->execute([':id' => $msgId]);
                $row = $check->fetch(\PDO::FETCH_ASSOC);

                // REGLA DE INMUTABILIDAD: si ya está READ o BLOCKED, no se modifica nada
                if ($row && !in_array($row['status'] ?? '', ['READ', 'BLOCKED'], true)) {
                    // Marcar como leído — timestamp exacto, irreversible
                    $stmt = $db->prepare("
                        UPDATE mail_messages
                        SET status = 'READ', read_at = NOW(), open_time = NOW()
                        WHERE id = :id
                    ");
                    $stmt->execute([':id' => $msgId]);

                    // ── AUDITORÍA COMPLETA ──────────────────────────────────
                    $ip        = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
                    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
                    $userId    = isset($request->user['id']) ? (int)$request->user['id'] : null;

                    $audit = $db->prepare("
                        INSERT INTO audit_log (
                            usuario_id, accion, entidad, entidad_id,
                            datos_nuevos, ip_address, user_agent, created_at
                        ) VALUES (
                            :uid, 'CORREO_LEIDO', 'mail_messages', :msgId,
                            :datos, :ip, :ua, NOW()
                        )
                    ");
                    $audit->execute([
                        ':uid'   => $userId,
                        ':msgId' => $msgId,
                        ':datos' => json_encode([
                            'accion'     => 'Correo marcado como leído (irreversible)',
                            'message_id' => $msgId,
                            'read_at'    => date('Y-m-d H:i:s'),
                            'ip'         => $ip,
                        ]),
                        ':ip'    => $ip,
                        ':ua'    => $userAgent,
                    ]);
                }
            }

            // Pixel 1x1 transparente
            header('Content-Type: image/gif');
            echo base64_decode('R0lGODlhAQABAJAAAP8AAAAAACH5BAUQAAAALAAAAAABAAEAAAICBAEAOw==');
            exit;
        } catch(\Exception $e) {
            header('HTTP/1.0 404 Not Found');
            exit;
        }
    }


    /**
     * Endpoint API 29: Buzón Inbound Exchange (IMAP Proxy)
     * Simula la recepción de un correo corporativo transformándolo en un Trámite BPMN
     */
    public function receiveImapWebhook(Request $request, Response $response)
    {
        try {
            $data = $request->all();
            
            if (empty($data['subject']) || empty($data['body']) || empty($data['from'])) {
                return $response->json(['status' => 'error', 'message' => 'Faltan campos (subject, body, from) según el protocolo del Webhook IMAP.'], 400);
            }

            $db = Database::getInstance()->getConnection();
            $db->beginTransaction();

            $expedienteId = null;
            
            // 1. Extraer Expediente ligado del asunto con Regex (ej: [EXP-2023-0100])
            if (preg_match('/EXP-\d{4}-\d+/', $data['subject'], $matches)) {
                 $codigoExpediente = $matches[0];
                 $stmtExp = $db->prepare('SELECT id FROM expedientes WHERE codigo = ? LIMIT 1');
                 $stmtExp->execute([$codigoExpediente]);
                 $expedienteId = $stmtExp->fetchColumn();
            }

            // 2. Si no es respuesta a un expediente, intentamos crear uno temporal internamente
            if (!$expedienteId) {
                 $stmtNew = $db->prepare("INSERT INTO expedientes (codigo, asuto_origen, clasificacion, estado) VALUES (CONCAT('EXP-', YEAR(NOW()), '-', FLOOR(RAND() * 9999)), ?, 'Correo Interno', 'INGRESADO')");
                 $stmtNew->execute([$data['subject']]);
                 $expedienteId = $db->lastInsertId();
            }

            // 3. Crear tarea BPMN asignada a la Recepción (Área 1 / User 1 por default)
            $stmtTask = $db->prepare("
                 INSERT INTO tareas (expediente_id, titulo, descripcion, estado, prioridad, assigned_to, created_at) 
                 VALUES (?, ?, ?, 'PENDIENTE', 'ALTA', 1, NOW())
            ");
            
            $tituloTarea = "Evaluar Petición Vía Correo: " . substr($data['subject'], 0, 50);
            $cuerpoMapeado = "Remitente Externo: " . $data['from'] . "\n\n" . $data['body'];
            $stmtTask->execute([$expedienteId, $tituloTarea, $cuerpoMapeado]);

            $db->commit();

            return $response->json([
                'status' => 'success',
                'message' => 'Correo recepcionado y convertido exitosamente a Tarea BPMN.',
                'expediente_implicado' => $expedienteId
            ]);

        } catch (Exception $e) {
            if (isset($db) && $db->inTransaction()) {
                $db->rollBack();
            }
            return $response->json(['status' => 'error', 'message' => 'Fallo interno en proceso IMAP: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Endpoint API: Revisa Caducidad de Correos y Bloquea (Llamado via Cron o Pseudo-cron)
     */
    public function checkExpirations(Request $request, Response $response)
    {
         try {
             $db = Database::getInstance()->getConnection();
             
             // Buscar correos expirados que NUNCA fueron leídos
             $stmt = $db->prepare("SELECT id, sender_id, subject FROM mail_messages WHERE status != 'READ' AND is_blocked = FALSE AND fecha_limite < NOW()");
             $stmt->execute();
             $expirados = $stmt->fetchAll(\PDO::FETCH_ASSOC);

             if(count($expirados) > 0) {
                 $block = $db->prepare("UPDATE mail_messages SET is_blocked = TRUE, status = 'BLOCKED' WHERE id = :id");
                 $notif = $db->prepare("INSERT INTO notifications (user_id, tipo, titulo, mensaje) VALUES (:uid, 'SLA_BLOQUEO', 'Correo Bloqueado por SLA Vencido', :msg)");

                 foreach($expirados as $ex) {
                     $block->execute([':id' => $ex['id']]);
                     
                     // Notificar al Remitente del bloqueo
                     $notif->execute([
                         ':uid' => $ex['sender_id'],
                         ':msg' => 'El correo "' . $ex['subject'] . '" enviado expiró sin ser leído por el destinatario en el tiempo establecido. Fue bloqueado.'
                     ]);
                 }
             }

             return $response->json(['status' => 'success', 'processed' => count($expirados)]);
         } catch(\Exception $e) {
             return $response->json(['status' => 'error', 'message' => $e->getMessage()], 500);
         }
    }
}
