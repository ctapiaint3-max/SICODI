<?php
namespace App\Models;

class Documento extends BaseModel
{
    public const TIPOS = ['Oficio','Circular','Memorándum','Resolución','Contrato','Informe','Archivo Adjunto'];
    public const CLASIFICACIONES = ['General','Interno','Reservado','Confidencial'];
    public const ESTADOS = ['ACTIVO','INACTIVO','ARCHIVADO'];

    protected array $fillable = [
        'id','expediente_id','titulo','tipo','clasificacion','estado',
        'current_version_id','created_by','created_at','updated_at',
        'storage_path','storage_hash','mime_type','file_size'
    ];

    public function getExtension(): string
    {
        return pathinfo($this->attributes['titulo'] ?? '', PATHINFO_EXTENSION);
    }

    public function isViewable(): bool
    {
        return in_array(strtolower($this->getExtension()), ['pdf','png','jpg','jpeg']);
    }
}
