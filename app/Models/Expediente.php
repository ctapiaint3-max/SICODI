<?php
namespace App\Models;

class Expediente extends BaseModel
{
    // Estados válidos según el flujo BPMN del spec
    public const ESTADOS = [
        'INGRESADO','EN_PROCESO','EN_REVISION','RESUELTO','ARCHIVADO','CANCELADO'
    ];

    // Prioridades
    public const PRIORIDADES = ['BAJA','NORMAL','ALTA','URGENTE'];

    protected array $fillable = [
        'id','codigo','area_id','estado','asunto','descripcion',
        'prioridad','fecha_apertura','fecha_cierre','created_by',
        'created_at','updated_at','creador_nombre'
    ];

    public function getSemaforoColor(?string $fechaVencimiento = null): string
    {
        if (!$fechaVencimiento) return 'VERDE';
        $now      = new \DateTime();
        $vence    = new \DateTime($fechaVencimiento);
        $apertura = new \DateTime($this->attributes['fecha_apertura'] ?? 'now');
        $totalSecs = $vence->getTimestamp() - $apertura->getTimestamp();
        $elapsedSecs = $now->getTimestamp() - $apertura->getTimestamp();
        if ($totalSecs <= 0) return 'ROJO';
        $ratio = ($elapsedSecs / $totalSecs) * 100;
        if ($ratio >= 100) return 'ROJO';
        if ($ratio >= 70)  return 'AMARILLO';
        return 'VERDE';
    }

    public function isEditable(): bool
    {
        return !in_array($this->attributes['estado'] ?? '', ['ARCHIVADO','CANCELADO']);
    }
}
