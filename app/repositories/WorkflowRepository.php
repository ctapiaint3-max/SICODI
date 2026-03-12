<?php
namespace App\Repositories;

use App\Core\Database;
use PDO;

class WorkflowRepository extends BaseRepository
{
    protected string $table = 'procesos';

    public function getByExpediente(int $expedienteId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT p.*, u.full_name as creador_nombre
                 FROM procesos p
                 LEFT JOIN users u ON p.created_by = u.id
                 WHERE p.expediente_id = ?
                 ORDER BY p.created_at DESC'
            );
            $stmt->execute([$expedienteId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) { return []; }
    }

    public function getActivo(int $expedienteId): ?array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT * FROM procesos WHERE expediente_id = ? AND estado IN ("INICIADO","EN_PROCESO") LIMIT 1'
            );
            $stmt->execute([$expedienteId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (\Exception $e) { return null; }
    }
}
