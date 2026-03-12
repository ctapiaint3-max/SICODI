<?php

namespace App\Services;

use App\Repositories\ExpedienteRepository;

class ExpedienteService
{
    private ExpedienteRepository $expedienteRepo;

    public function __construct(ExpedienteRepository $expedienteRepo)
    {
        $this->expedienteRepo = $expedienteRepo;
    }

    /**
     * Creates a new Expediente with an auto-generated institutional code
     * E.g. EXP-2023-00123
     */
    public function crearExpediente(int $userId, int $areaId, string $asunto, ?string $descripcion = null, string $prioridad = 'NORMAL'): int
    {
        // Simple logic to generate the code: EXP-{YEAR}-{COUNT}
        $year = date('Y');
        
        // This simulates a sequence counter. In a real highly concurrent system 
        // a sequence table or Redis counter should be used to avoid duplicates.
        $count = $this->expedienteRepo->countByAreaAndEstado($areaId, 'NUEVO') + 1;
        $codigo = sprintf("EXP-%s-%05d", $year, $count);

        $data = [
            'codigo' => $codigo,
            'area_id' => $areaId,
            'estado' => 'NUEVO',
            'asunto' => $asunto,
            'descripcion' => $descripcion,
            'prioridad' => $prioridad,
            'fecha_apertura' => date('Y-m-d'),
            'created_by' => $userId
        ];

        return $this->expedienteRepo->create($data);
    }
}
