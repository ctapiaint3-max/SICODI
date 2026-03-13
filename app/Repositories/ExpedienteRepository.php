<?php

namespace App\Repositories;

use PDO;

class ExpedienteRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct();
        $this->table = 'expedientes';
    }

    public function findByCodigo(string $codigo): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE codigo = :codigo");
        $stmt->execute(['codigo' => $codigo]);
        $result = $stmt->fetch();
        return $result ?: null;
    }
    
    public function countByAreaAndEstado(int $areaId, string $estado): int
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE area_id = :area_id AND estado = :estado");
        $stmt->execute(['area_id' => $areaId, 'estado' => $estado]);
        return (int)$stmt->fetchColumn();
    }

    public function findAllWithAbac(int $userAreaId, bool $isSuperAdmin, string $search = '', string $estado = '', int $limit = 50): array
    {
        $query = "
            SELECT e.id, e.codigo, e.estado, e.prioridad, e.asunto, e.descripcion,
                   e.fecha_apertura, e.fecha_cierre, e.created_at, e.updated_at,
                   u.full_name as creador_nombre, a.name as area_nombre
            FROM {$this->table} e
            LEFT JOIN users u ON e.created_by = u.id
            LEFT JOIN areas a ON e.area_id = a.id
            WHERE 1=1
        ";
        
        $params = [];
        
        // 2. Aplicar filtro ABAC (Aislamiento jerárquico por Área)
        if (!$isSuperAdmin) {
            $query .= " AND e.area_id = :abac_area ";
            $params[':abac_area'] = $userAreaId;
        }

        if ($search !== '') {
            $query .= " AND (e.codigo LIKE :search OR e.asunto LIKE :search)";
            $params[':search'] = "%$search%";
        }
        if ($estado !== '') {
            $query .= " AND e.estado = :estado";
            $params[':estado'] = $estado;
        }

        $query .= " ORDER BY e.created_at DESC LIMIT " . (int)$limit;

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
