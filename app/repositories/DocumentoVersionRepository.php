<?php

namespace App\Repositories;

class DocumentoVersionRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct();
        $this->table = 'documento_version';
    }

    public function getLastVersionNum(int $documentoId): int
    {
        $stmt = $this->db->prepare("SELECT MAX(version_num) FROM {$this->table} WHERE documento_id = :doc_id");
        $stmt->execute(['doc_id' => $documentoId]);
        $result = $stmt->fetchColumn();
        return $result ? (int)$result : 0;
    }
}
