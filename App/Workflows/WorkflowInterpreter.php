<?php
namespace App\Workflows;

use App\Core\Database;
use PDO;

/**
 * WorkflowInterpreter — carga definiciones de proceso desde BD y construye el motor
 */
class WorkflowInterpreter
{
    private $db;

    // Definición embebida por si la BD no está disponible
    private array $builtinDefinitions = [
        'FLUJO_ESTANDAR' => [
            'id'   => 'FLUJO_ESTANDAR',
            'name' => 'Flujo Administrativo Estándar',
            'transitions' => [
                'INGRESADO'   => [['target'=>'EN_PROCESO',  'label'=>'Iniciar análisis']],
                'EN_PROCESO'  => [['target'=>'EN_REVISION',  'label'=>'Enviar a revisión'],
                                  ['target'=>'INGRESADO',    'label'=>'Devolver']],
                'EN_REVISION' => [['target'=>'RESUELTO',     'label'=>'Aprobar'],
                                  ['target'=>'EN_PROCESO',   'label'=>'Rechazar']],
                'RESUELTO'    => [['target'=>'ARCHIVADO',    'label'=>'Archivar']],
            ]
        ],
        'FLUJO_URGENTE' => [
            'id'   => 'FLUJO_URGENTE',
            'name' => 'Flujo Urgente — Resolución directa',
            'transitions' => [
                'INGRESADO'  => [['target'=>'EN_PROCESO',  'label'=>'Activar urgente']],
                'EN_PROCESO' => [['target'=>'RESUELTO',    'label'=>'Resolver directamente']],
                'RESUELTO'   => [['target'=>'ARCHIVADO',   'label'=>'Archivar']],
            ]
        ],
    ];

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Carga definición de proceso por clave
     */
    public function load(string $definitionKey): array
    {
        // Intentar cargar desde BD primero
        try {
            $stmt = $this->db->prepare('SELECT definition FROM system_config WHERE key_name = ?');
            $stmt->execute(["workflow_{$definitionKey}"]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && $row['definition']) {
                return json_decode($row['definition'], true);
            }
        } catch (\Exception $e) {
            // Fallback a built-in
        }

        return $this->builtinDefinitions[$definitionKey]
            ?? $this->builtinDefinitions['FLUJO_ESTANDAR'];
    }

    /**
     * Lista todas las definiciones disponibles
     */
    public function list(): array
    {
        return array_values(array_map(fn($d) => [
            'key'  => $d['id'],
            'name' => $d['name'],
        ], $this->builtinDefinitions));
    }

    /**
     * Crea un ProcessEngine con la definición cargada
     */
    public function buildEngine(string $definitionKey): ProcessEngine
    {
        return new ProcessEngine($this->load($definitionKey));
    }
}
