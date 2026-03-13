<?php

namespace App\Repositories;

class AuditRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct();
        $this->table = 'audit_log';
    }
}
