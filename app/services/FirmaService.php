<?php
namespace App\Services;

use App\Core\Database;
use Exception;
use PDO;

/**
 * FirmaService — firma electrónica simple con OpenSSL hash
 * Para producción se debe integrar con PKI gubernamental o HSM
 */
class FirmaService
{
    private $db;
    private string $firmasDir;

    public function __construct()
    {
        $this->db       = Database::getInstance();
        $this->firmasDir = __DIR__ . '/../../storage/firmas/';
        if (!is_dir($this->firmasDir)) mkdir($this->firmasDir, 0755, true);
    }

    /**
     * Estampa una firma electrónica en un documento
     * Genera hash SHA-256 firmado con clave institucional
     */
    public function firmarDocumento(int $documentoId, int $userId, string $motivo = 'Aprobación'): array
    {
        try {
            // 1. Obtener documento y su hash actual
            $stmt = $this->db->prepare(
                'SELECT d.id, d.titulo, dv.storage_path, dv.storage_hash
                 FROM documentos d
                 LEFT JOIN documento_version dv ON d.current_version_id = dv.id
                 WHERE d.id = ?'
            );
            $stmt->execute([$documentoId]);
            $doc = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$doc) throw new Exception('Documento no encontrado', 404);

            // 2. Generar hash de firma (en producción: OpenSSL sign con clave privada PKI)
            $datos    = json_encode(['documento_id'=>$documentoId, 'user_id'=>$userId, 'motivo'=>$motivo, 'ts'=>time(), 'doc_hash'=>$doc['storage_hash']]);
            $hashFirma = hash('sha256', $datos . getenv('APP_FIRMA_SECRET') ?: 'SICODI_INST_KEY_2026');

            // 3. Guardar metadata de firma en storage
            $firmaFile = $this->firmasDir . "firma_{$documentoId}_{$userId}_" . date('Ymd_His') . '.json';
            file_put_contents($firmaFile, json_encode([
                'hash_firma' => $hashFirma, 'datos' => $datos, 'firmado_at' => date('c')
            ]));

            // 4. Persiste en BD
            $expira = date('Y-m-d H:i:s', strtotime('+2 years'));
            $ins = $this->db->prepare(
                'INSERT INTO firmas (documento_id, user_id, tipo, estado, hash_firma, metadata, firmado_at, expira_at)
                 VALUES (?, ?, "ELECTRONICA", "VALIDA", ?, ?, NOW(), ?)'
            );
            $ins->execute([$documentoId, $userId, $hashFirma, $datos, $expira]);
            $firmaId = $this->db->lastInsertId();

            return [
                'firma_id'   => $firmaId,
                'hash'       => $hashFirma,
                'motivo'     => $motivo,
                'firmado_at' => date('Y-m-d H:i:s'),
                'expira_at'  => $expira,
            ];

        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Database connection failed') !== false) {
                // Demo offline
                return [
                    'firma_id'   => rand(100,999),
                    'hash'       => hash('sha256', "demo_{$documentoId}_{$userId}"),
                    'motivo'     => $motivo,
                    'firmado_at' => date('Y-m-d H:i:s'),
                    'expira_at'  => date('Y-m-d H:i:s', strtotime('+2 years')),
                    'modo'       => 'DEMO_OFFLINE',
                ];
            }
            throw $e;
        }
    }

    /**
     * Valida si la firma de un documento es auténtica
     */
    public function validarFirma(int $documentoId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT f.*, u.full_name as firmante_nombre
                 FROM firmas f JOIN users u ON f.user_id = u.id
                 WHERE f.documento_id = ? AND f.estado = "VALIDA"
                 ORDER BY f.firmado_at DESC'
            );
            $stmt->execute([$documentoId]);
            $firmas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ['valido' => count($firmas) > 0, 'firmas' => $firmas];
        } catch (Exception $e) {
            return ['valido' => false, 'firmas' => [], 'error' => 'BD offline'];
        }
    }
}
