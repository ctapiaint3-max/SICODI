<?php

namespace App\Services;

use App\Repositories\RegistroDocumentalRepository;
use Exception;

class RegistroDocumentalService
{
    private RegistroDocumentalRepository $registroRepo;
    private ExpedienteService $expedienteService;

    public function __construct(
        RegistroDocumentalRepository $registroRepo, 
        ExpedienteService $expedienteService
    ) {
        $this->registroRepo = $registroRepo;
        $this->expedienteService = $expedienteService;
    }

    /**
     * Registra un nuevo documento en ventanilla y gatilla la creación del Expediente.
     */
    public function recepcionarDocumento(
        int $userId,
        array $data,
        int $areaDestinoId
    ): array {
        try {
            $this->registroRepo->beginTransaction();

            // 1. Crear el Expediente asociado al documento entrante
            $expedienteId = $this->expedienteService->crearExpediente(
                $userId,
                $areaDestinoId,
                $data['asunto'],
                "Expediente generado auto. por Recepción Doc: " . $data['numero_documento']
            );

            // 2. Guardar el Registro Documental ("Correspondencia")
            $registroData = [
                'registro' => $data['registro'] ?? 'EXTERNO',
                'fecha_recepcion' => date('Y-m-d'),
                'numero_programa_incogmar' => $data['numero_programa_incogmar'] ?? null,
                'tipo_documento' => $data['tipo_documento'],
                'clasificacion' => $data['clasificacion'],
                'numero_documento' => $data['numero_documento'],
                'fecha_documento' => $data['fecha_documento'],
                'mando_que_gira' => $data['mando_que_gira'],
                'asunto' => $data['asunto'],
                'tramite' => $data['tramite'] ?? null,
                'usuario_registro' => $userId,
                'expediente_id' => $expedienteId
            ];

            $registroId = $this->registroRepo->create($registroData);

            $this->registroRepo->commit();

            return [
                'registro_id' => $registroId,
                'expediente_id' => $expedienteId
            ];

        } catch (Exception $e) {
            $this->registroRepo->rollBack();
            throw new Exception("Error al recepcionar oficio: " . $e->getMessage());
        }
    }
}
