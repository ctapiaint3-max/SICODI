<?php
namespace App\Models;

class Proceso extends BaseModel
{
    public const ESTADOS = ['INICIADO','EN_PROCESO','COMPLETADO','CANCELADO','SUSPENDIDO'];

    protected array $fillable = [
        'id','expediente_id','nombre','definition_key','estado',
        'started_at','ended_at','created_by','created_at','updated_at'
    ];

    public function isActive(): bool
    {
        return in_array($this->attributes['estado'] ?? '', ['INICIADO','EN_PROCESO']);
    }

    public function getDurationDays(): ?int
    {
        if (!$this->attributes['started_at']) return null;
        $start = new \DateTime($this->attributes['started_at']);
        $end   = $this->attributes['ended_at'] ? new \DateTime($this->attributes['ended_at']) : new \DateTime();
        return (int)$start->diff($end)->days;
    }
}
