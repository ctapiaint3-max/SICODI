<?php
namespace App\Models;

class Firma extends BaseModel
{
    public const TIPOS   = ['ELECTRONICA','DIGITAL_PKI','MANUSCRITA_ESCANEADA'];
    public const ESTADOS = ['VALIDA','EXPIRADA','REVOCADA','PENDIENTE'];

    protected array $fillable = [
        'id','documento_id','user_id','tipo','estado','hash_firma',
        'certificado_path','metadata','firmado_at','expira_at',
        'created_at','updated_at'
    ];

    public function isValida(): bool
    {
        if (($this->attributes['estado'] ?? '') !== 'VALIDA') return false;
        $expira = $this->attributes['expira_at'] ?? null;
        if (!$expira) return true;
        return new \DateTime() < new \DateTime($expira);
    }

    public function getResumen(): string
    {
        return sprintf(
            'Firma %s por usuario #%d el %s',
            $this->attributes['tipo'] ?? 'ELECTRONICA',
            $this->attributes['user_id'] ?? 0,
            $this->attributes['firmado_at'] ?? '-'
        );
    }
}
