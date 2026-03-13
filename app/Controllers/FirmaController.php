<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use Exception;

class FirmaController
{
    public function firmarDocumento(Request $request, Response $response)
    {
        // Simulamos User ID 1 (Admin) como quien firma.
        $userId = 1;

        $payload = json_decode(file_get_contents('php://input'), true);

        if (!$payload || empty($payload['documento_id']) || empty($payload['pin'])) {
            return $response->json([
                'status' => 'error',
                'message' => 'El documento ID y el PIN de firma son obligatorios.'
            ], 400);
        }

        $documentoId = $payload['documento_id'];
        $pin = $payload['pin']; // PIN temporal de validación

        if ($pin !== '123456') {
             return $response->json([
                'status' => 'error',
                'message' => 'El PIN ingresado es incorrecto o el certificado ha expirado.'
            ], 401);
        }

        try {
            $db = Database::getInstance();

            // Obtenemos el documento y la versión
            $stmt = $db->prepare('
                SELECT d.id, dv.id as version_id, dv.storage_hash 
                FROM documentos d
                JOIN documento_version dv ON d.current_version_id = dv.id
                WHERE d.id = :id
            ');
            $stmt->execute([':id' => $documentoId]);
            $docInfo = $stmt->fetch();

            if (!$docInfo) {
                return $response->json([
                    'status' => 'error',
                    'message' => 'Documento no encontrado o sin versión almacenada.'
                ], 404);
            }

            // Generar Firma Criptográfica base (Simulada para MVP)
            // Se firma el Hash original del documento + el secret del cert del usuario
            $firmaHash = hash_hmac('sha256', $docInfo['storage_hash'], 'SECRET_CERT_USER_1');

            // Guardar en la tabla Firmas
            $stmtFirma = $db->prepare('
                INSERT INTO firmas 
                (documento_version_id, user_id, hash_firma, hash_documento, ip_address, valido, fecha_firma) 
                VALUES (:doc_v_id, :user_id, :h_firma, :h_doc, :ip, 1, NOW())
            ');

            $stmtFirma->execute([
                ':doc_v_id' => $docInfo['version_id'],
                ':user_id' => $userId,
                ':h_firma' => $firmaHash,
                ':h_doc' => $docInfo['storage_hash'],
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            return $response->json([
                'status' => 'success',
                'message' => 'Documento firmado digitalmente con éxito',
                'data' => [
                    'firma' => $firmaHash,
                    'fecha' => date('Y-m-d H:i:s'),
                    'documento_id' => $documentoId
                ]
            ], 201);

        } catch (Exception $e) {
            // Manejador offline XAMPP para permitir desarrollo de NEXT
            if (strpos($e->getMessage(), 'Database connection failed') !== false) {
                 return $response->json([
                    'status' => 'success',
                    'message' => 'Documento firmado (Modo Offline DB Simulado)',
                    'data' => [
                        'firma' => 'f7a8b9cdef123456789simuladaoffline',
                        'fecha' => date('Y-m-d H:i:s'),
                        'documento_id' => $documentoId
                    ]
                 ], 201);
            }

            return $response->json([
                'status' => 'error',
                'message' => 'Fallo al firmar el documento: ' . $e->getMessage()
            ], 500);
        }
    }
}
