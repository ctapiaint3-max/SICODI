<?php
namespace App\Workflows;

/**
 * StateMachine — valida transiciones de estado de expediente
 */
class StateMachine
{
    private array $transitions;
    private string $currentState;

    public function __construct(array $transitions, string $initialState)
    {
        $this->transitions  = $transitions;
        $this->currentState = $initialState;
    }

    public function can(string $targetState): bool
    {
        $allowed = $this->transitions[$this->currentState] ?? [];
        return in_array($targetState, array_column($allowed, 'target'));
    }

    public function transition(string $targetState): string
    {
        if (!$this->can($targetState)) {
            throw new \InvalidArgumentException(
                "Transición inválida: {$this->currentState} → {$targetState}"
            );
        }
        $this->currentState = $targetState;
        return $this->currentState;
    }

    public function getState(): string   { return $this->currentState; }
    public function getAvailable(): array
    {
        return $this->transitions[$this->currentState] ?? [];
    }

    /**
     * Definición estándar del flujo de expediente institucional
     */
    public static function expedienteFlow(): self
    {
        return new self([
            'INGRESADO'   => [['target'=>'EN_PROCESO',  'label'=>'Iniciar análisis'],
                              ['target'=>'CANCELADO',    'label'=>'Cancelar']],
            'EN_PROCESO'  => [['target'=>'EN_REVISION',  'label'=>'Enviar a revisión'],
                              ['target'=>'INGRESADO',    'label'=>'Devolver'],
                              ['target'=>'CANCELADO',    'label'=>'Cancelar']],
            'EN_REVISION' => [['target'=>'RESUELTO',     'label'=>'Aprobar'],
                              ['target'=>'EN_PROCESO',   'label'=>'Rechazar']],
            'RESUELTO'    => [['target'=>'ARCHIVADO',    'label'=>'Archivar']],
            'ARCHIVADO'   => [],
            'CANCELADO'   => [],
        ], 'INGRESADO');
    }
}
