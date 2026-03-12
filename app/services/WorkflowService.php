<?php
namespace App\Services;

use App\Core\Database;
use App\Workflows\ProcessEngine;
use Exception;
use PDO;

/**
 * WorkflowService — orquesta procesos BPMN sobre expedientes
 */
class WorkflowService
{
    private $db;

    // Definición del flujo administrativo estándar (BPMN embebido)
    private array $defaultFlowDef = [
        'id'   => 'FLUJO_ESTANDAR',
        'name' => 'Flujo Administrativo Estándar',
        'transitions' => [
            'INGRESADO'   => [['target'=>'EN_PROCESO',  'label'=>'Iniciar análisis']],
            'EN_PROCESO'  => [['target'=>'EN_REVISION',  'label'=>'Enviar a revisión'],
                              ['target'=>'INGRESADO',    'label'=>'Devolver']],
            'EN_REVISION' => [['target'=>'RESUELTO',     'label'=>'Aprobar resolución'],
                              ['target'=>'EN_PROCESO',   'label'=>'Rechazar — regresar']],
            'RESUELTO'    => [['target'=>'ARCHIVADO',    'label'=>'Archivar'],
                              ['target'=>'CANCELADO',    'label'=>'Cancelar']],
        ]
    ];

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Inicia un proceso para un expediente
     */
    public function iniciarProceso(int $expedienteId, int $userId, string $definitionKey = 'FLUJO_ESTANDAR'): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO procesos (expediente_id, nombre, definition_key, estado, started_at, created_by)
             VALUES (?, ?, ?, "INICIADO", NOW(), ?)'
        );
        $stmt->execute([$expedienteId, 'Flujo Administrativo Estándar', $definitionKey, $userId]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Avanza el estado del expediente según el motor BPMN
     */
    public function avanzarEstado(int $expedienteId, string $nuevoEstado, int $userId, string $observaciones = ''): array
    {
        // 1. Obtener estado actual
        $stmt = $this->db->prepare('SELECT estado FROM expedientes WHERE id = ?');
        $stmt->execute([$expedienteId]);
        $exp = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$exp) throw new Exception('Expediente no encontrado', 404);

        // 2. Validar transición con motor
        $engine = new ProcessEngine($this->defaultFlowDef);
        if (!$engine->canTransition($exp['estado'], $nuevoEstado)) {
            throw new Exception("Transición inválida: {$exp['estado']} → {$nuevoEstado}", 422);
        }

        // 3. Actualizar expediente
        $estadoAnterior = $exp['estado'];
        $this->db->prepare('UPDATE expedientes SET estado = ? WHERE id = ?')
                 ->execute([$nuevoEstado, $expedienteId]);

        // 4. Registrar historial
        $this->db->prepare(
            'INSERT INTO expediente_historial (expediente_id, user_id, estado_anterior, estado_nuevo, accion, observaciones)
             VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([$expedienteId, $userId, $estadoAnterior, $nuevoEstado, "Transición workflow", $observaciones]);

        return [
            'expediente_id'   => $expedienteId,
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo'    => $nuevoEstado,
        ];
    }

    /**
     * Crea tareas automáticas al avanzar un nodo
     */
    public function crearTareaAutomatica(int $procesoId, int $expedienteId, string $titulo, ?int $assignedTo = null, int $slaHoras = 48): int
    {
        $vence = date('Y-m-d H:i:s', strtotime("+{$slaHoras} hours"));
        $stmt = $this->db->prepare(
            'INSERT INTO tareas (proceso_id, expediente_id, titulo, estado, prioridad, assigned_to, fecha_vencimiento, sla_horas, semaforo)
             VALUES (?, ?, ?, "PENDIENTE", "NORMAL", ?, ?, ?, "VERDE")'
        );
        $stmt->execute([$procesoId, $expedienteId, $titulo, $assignedTo, $vence, $slaHoras]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Obtiene tareas del usuario con cálculo de semáforo actualizado
     */
    public function getTareasUsuario(int $userId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT t.*, e.codigo as expediente_codigo, e.asunto as expediente_asunto
                 FROM tareas t
                 JOIN expedientes e ON t.expediente_id = e.id
                 WHERE t.assigned_to = ? AND t.estado IN ("PENDIENTE","EN_PROCESO")
                 ORDER BY t.fecha_vencimiento ASC'
            );
            $stmt->execute([$userId]);
            $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Recalcular semáforo en tiempo real
            foreach ($tareas as &$t) {
                $t['semaforo'] = $this->calcularSemaforo($t['fecha_vencimiento'], $t['sla_horas'] ?? 48);
            }
            return $tareas;
        } catch (Exception $e) {
            return $this->mockTareas($userId);
        }
    }

    public function calcularSemaforo(?string $fechaVencimiento, int $slaHoras = 48): string
    {
        if (!$fechaVencimiento) return 'VERDE';
        $now   = new \DateTime();
        $vence = new \DateTime($fechaVencimiento);
        if ($now > $vence) return 'ROJO';
        $diff  = $now->diff($vence);
        $hRestantes = ($diff->days * 24) + $diff->h;
        $consumido  = (($slaHoras - $hRestantes) / $slaHoras) * 100;
        if ($consumido >= 70) return 'AMARILLO';
        return 'VERDE';
    }

    private function mockTareas(int $userId): array
    {
        return [
            ['id'=>1,'titulo'=>'Revisar expediente EXP-2026-00001','estado'=>'PENDIENTE','prioridad'=>'ALTA','semaforo'=>'VERDE','expediente_codigo'=>'EXP-2026-00001','expediente_asunto'=>'Solicitud de Viáticos','fecha_vencimiento'=>date('Y-m-d H:i:s',strtotime('+2 days'))],
            ['id'=>2,'titulo'=>'Clasificar documentación adjunta','estado'=>'EN_PROCESO','prioridad'=>'NORMAL','semaforo'=>'AMARILLO','expediente_codigo'=>'EXP-2026-00002','expediente_asunto'=>'Adquisición de Equipos','fecha_vencimiento'=>date('Y-m-d H:i:s',strtotime('+5 hours'))],
            ['id'=>3,'titulo'=>'Validar firma digital contrato','estado'=>'PENDIENTE','prioridad'=>'URGENTE','semaforo'=>'ROJO','expediente_codigo'=>'EXP-2026-00003','expediente_asunto'=>'Contrato Mantenimiento NAS','fecha_vencimiento'=>date('Y-m-d H:i:s',strtotime('-1 hour'))],
        ];
    }
}
