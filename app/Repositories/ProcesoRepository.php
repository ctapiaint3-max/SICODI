<?php
namespace App\Repositories;

use PDO;

class ProcesoRepository extends BaseRepository
{
    protected string $table = 'procesos';

    public function getTareas(int $procesoId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT t.*, u.full_name as asignado_nombre
                 FROM tareas t
                 LEFT JOIN users u ON t.assigned_to = u.id
                 WHERE t.proceso_id = ?
                 ORDER BY t.created_at ASC'
            );
            $stmt->execute([$procesoId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) { return []; }
    }
}
