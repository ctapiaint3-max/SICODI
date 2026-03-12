<?php

namespace App\Repositories;

class DocumentoRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct();
        $this->table = 'documentos';
    }
}
