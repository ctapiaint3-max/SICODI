<?php

namespace App\Repositories;

class UserRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct();
        $this->table = 'users';
    }

    public function findByUsername(string $username): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE username = :username LIMIT 1");
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch();
        return $user ?: null;
    }
}
