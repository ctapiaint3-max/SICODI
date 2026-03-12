<?php

namespace App\Repositories;

class RegistroDocumentalRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct();
        $this->table = 'registro_documental';
    }

    public function findByNumeroProtocolo(string $numero): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE numero_documento = :numero");
        $stmt->execute(['numero' => $numero]);
        $result = $stmt->fetch();
        return $result ?: null;
    }
}
