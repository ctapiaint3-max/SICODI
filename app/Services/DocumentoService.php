<?php

namespace App\Services;

use App\Core\Database;
use Exception;
use PDO;

class DocumentoService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getDocumentos()
    {
        try {
            // Traer documentos con su metadata y path
            $stmt = $this->db->prepare('
                SELECT d.id, d.titulo, d.tipo, d.clasificacion, d.estado, dv.storage_path, dv.storage_hash, d.created_at
                FROM documentos d
                LEFT JOIN documento_version dv ON d.current_version_id = dv.id
                ORDER BY d.created_at DESC
            ');
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (\Exception $e) {
            // Fallback demo offline
            return [
                ['id' => 1, 'titulo' => 'Oficio-2026-001.pdf', 'tipo' => 'Oficio', 'clasificacion' => 'Interno', 'estado' => 'ACTIVO', 'storage_path' => null, 'storage_hash' => null, 'created_at' => '2026-03-01 08:00:00'],
                ['id' => 2, 'titulo' => 'Circular-Institucional-003.pdf', 'tipo' => 'Circular', 'clasificacion' => 'General', 'estado' => 'ACTIVO', 'storage_path' => null, 'storage_hash' => null, 'created_at' => '2026-03-05 10:30:00'],
                ['id' => 3, 'titulo' => 'Contrato-Mantenimiento-NAS.docx', 'tipo' => 'Contrato', 'clasificacion' => 'Reservado', 'estado' => 'ACTIVO', 'storage_path' => null, 'storage_hash' => null, 'created_at' => '2026-02-20 14:15:00'],
            ];
        }
    }

    public function saveFisico(array $file, int $userId): array
    {
        // 1. Validar y generar UUID
        $uuid = bin2hex(random_bytes(16)); // UUID simplificado
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = $uuid . '.' . $ext;
        
        // Directorio NSA (storage_path real)
        $storageDir = __DIR__ . '/../../storage/documentos/';
        if (!is_dir($storageDir)) {
             mkdir($storageDir, 0755, true);
        }

        $destino = $storageDir . $filename;
        $relativePath = '/storage/documentos/' . $filename;

        // 2. Mover archivo fisico
        if (!move_uploaded_file($file['tmp_name'], $destino)) {
            throw new Exception('Error al mover el archivo al NAS físico.');
        }

        // 3. Generar Hash SHA-256 para integridad
        $hash = hash_file('sha256', $destino);
        $size = filesize($destino);
        $mime = mime_content_type($destino);

        $this->db->beginTransaction();
        try {
            // Guardar Documento padre
            $stmt = $this->db->prepare('INSERT INTO documentos (titulo, tipo, clasificacion, estado, created_by, created_at) VALUES (:titulo, :tipo, :clasificacion, :estado, :created_by, NOW())');
            $stmt->execute([
                ':titulo' => $file['name'],
                ':tipo' => 'Archivo Adjunto', // Podria venir de Form
                ':clasificacion' => 'General',
                ':estado' => 'ACTIVO',
                ':created_by' => $userId
            ]);
            $docId = $this->db->lastInsertId();

            // Guardar Version
            $stmtV = $this->db->prepare('INSERT INTO documento_version (documento_id, version_num, storage_path, storage_hash, file_size, mime_type, created_by, created_at) VALUES (:doc_id, 1, :path, :hash, :size, :mime, :created_by, NOW())');
            $stmtV->execute([
                ':doc_id' => $docId,
                ':path' => $relativePath,
                ':hash' => $hash,
                ':size' => $size,
                ':mime' => $mime,
                ':created_by' => $userId
            ]);
            $versionId = $this->db->lastInsertId();

            // Link parent
            $stmtU = $this->db->prepare('UPDATE documentos SET current_version_id = :v_id WHERE id = :d_id');
            $stmtU->execute([':v_id' => $versionId, ':d_id' => $docId]);

            $this->db->commit();

            return [
                'documento_id' => $docId,
                'path' => $relativePath,
                'hash' => $hash,
                'size' => $size
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            // Borrar físico para no ensuciar el NAS si falló la BDD
            @unlink($destino);
            throw $e;
        }
    }
}
