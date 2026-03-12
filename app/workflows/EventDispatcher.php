<?php
namespace App\Workflows;

/**
 * EventDispatcher — bus de eventos para el motor de workflow
 */
class EventDispatcher
{
    private array $listeners = [];

    /**
     * Registra un listener para un evento
     */
    public function on(string $event, callable $listener): void
    {
        $this->listeners[$event][] = $listener;
    }

    /**
     * Dispara un evento con contexto
     */
    public function dispatch(string $event, array $context = []): void
    {
        foreach ($this->listeners[$event] ?? [] as $listener) {
            $listener($context);
        }
    }

    /**
     * Eventos estándar del sistema
     */
    public const EXPEDIENTE_CREADO     = 'expediente.creado';
    public const EXPEDIENTE_AVANZADO   = 'expediente.avanzado';
    public const TAREA_ASIGNADA        = 'tarea.asignada';
    public const TAREA_COMPLETADA      = 'tarea.completada';
    public const DOCUMENTO_SUBIDO      = 'documento.subido';
    public const FIRMA_ESTAMPADA       = 'firma.estampada';
    public const SLA_VENCIDO           = 'sla.vencido';
    public const SLA_PROXIMO           = 'sla.proximo';

    /**
     * Suscripciones por defecto del sistema institucional
     */
    public static function createDefault(): self
    {
        $dispatcher = new self();

        // Cuando se avanza un expediente → notificar al área responsable
        $dispatcher->on(self::EXPEDIENTE_AVANZADO, function(array $ctx) {
            // MailService::sendTaskNotification() se llamaría aquí
            // Solo logging en modo demo
            error_log("[SICODI Event] Expediente avanzado: " . json_encode($ctx));
        });

        // Cuando se asigna tarea → notificar al usuario
        $dispatcher->on(self::TAREA_ASIGNADA, function(array $ctx) {
            error_log("[SICODI Event] Tarea asignada: " . json_encode($ctx));
        });

        // SLA vencido → alerta crítica
        $dispatcher->on(self::SLA_VENCIDO, function(array $ctx) {
            error_log("[SICODI ALERT] SLA VENCIDO: " . json_encode($ctx));
        });

        return $dispatcher;
    }
}
