<?php
namespace App\Models;

class Tarea extends BaseModel
{
    public const ESTADOS     = ['PENDIENTE','EN_PROCESO','COMPLETADO','CANCELADO'];
    public const PRIORIDADES = ['BAJA','NORMAL','ALTA','URGENTE'];
    public const SEMAFOROS   = ['VERDE','AMARILLO','ROJO'];

    protected array $fillable = [
        'id','proceso_id','expediente_id','titulo','descripcion','estado',
        'prioridad','assigned_to','due_date','fecha_vencimiento','sla_horas',
        'semaforo','completed_at','created_at','updated_at'
    ];

    public function calcularSemaforo(): string
    {
        $vence = $this->attributes['fecha_vencimiento'] ?? $this->attributes['due_date'] ?? null;
        if (!$vence) return 'VERDE';
        $now = new \DateTime();
        $v   = new \DateTime($vence);
        if ($now > $v) return 'ROJO';
        $diff = $now->diff($v);
        $horasRestantes = ($diff->days * 24) + $diff->h;
        $slaHoras = (int)($this->attributes['sla_horas'] ?? 48);
        $consumido = (($slaHoras - $horasRestantes) / $slaHoras) * 100;
        if ($consumido >= 100) return 'ROJO';
        if ($consumido >= 70)  return 'AMARILLO';
        return 'VERDE';
    }

    public function isPendiente(): bool
    {
        return in_array($this->attributes['estado'] ?? '', ['PENDIENTE','EN_PROCESO']);
    }
}
