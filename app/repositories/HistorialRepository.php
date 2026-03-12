<?php

namespace App\Repositories;

class HistorialRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct();
        $this->table = 'expediente_historial';
    }

    public function getHistoryForExpediente(int $expedienteId): array
    {
        $stmt = $this->db->prepare("
            SELECT h.*, u.full_name as user_name
            FROM {$this->table} h
            JOIN users u ON h.user_id = u.id
            WHERE h.expediente_id = :expediente_id
            ORDER BY h.created_at DESC
        ");
        $stmt->execute(['expediente_id' => $expedienteId]);
        return $stmt->fetchAll();
    }
}
