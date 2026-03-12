<?php
namespace App\Repositories;

use PDO;

class FirmaRepository extends BaseRepository
{
    protected string $table = 'firmas';

    public function getByDocumento(int $documentoId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT f.*, u.full_name as firmante_nombre
                 FROM firmas f JOIN users u ON f.user_id = u.id
                 WHERE f.documento_id = ?
                 ORDER BY f.firmado_at DESC'
            );
            $stmt->execute([$documentoId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) { return []; }
    }

    public function tieneFiremaValida(int $documentoId): bool
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT COUNT(*) FROM firmas WHERE documento_id = ? AND estado = "VALIDA" AND expira_at > NOW()'
            );
            $stmt->execute([$documentoId]);
            return (int)$stmt->fetchColumn() > 0;
        } catch (\Exception $e) { return false; }
    }
}
