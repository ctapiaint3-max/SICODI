<?php

namespace App\Repositories;

class TareaRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct();
        $this->table = 'tareas';
    }

    public function findPendingByUser(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT t.*, e.codigo as expediente_codigo, e.asunto 
            FROM {$this->table} t
            JOIN expedientes e ON t.expediente_id = e.id
            WHERE t.assigned_to = :user_id AND t.estado = 'PENDIENTE'
            ORDER BY t.prioridad ASC, t.created_at ASC
        ");
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll();
    }
}
