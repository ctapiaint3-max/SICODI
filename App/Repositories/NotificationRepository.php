<?php
namespace App\Repositories;

use PDO;

class NotificationRepository extends BaseRepository
{
    protected string $table = 'notifications';

    public function getNoLeidas(int $userId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT * FROM notifications WHERE user_id = ? AND leida = 0 ORDER BY created_at DESC LIMIT 50'
            );
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Exception $e) { return []; }
    }

    public function countNoLeidas(int $userId): int
    {
        try {
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND leida = 0');
            $stmt->execute([$userId]);
            return (int)$stmt->fetchColumn();
        } catch (\Exception $e) { return 0; }
    }
}
