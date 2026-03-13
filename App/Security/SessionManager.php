<?php
namespace App\Security;

use App\Core\Database;
use PDO;

/**
 * SessionManager — gestión de sesiones con revocación y limpieza automática
 */
class SessionManager
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Crea una nueva sesión y devuelve el token
     */
    public function create(int $userId, string $ip, string $userAgent = '', int $horasValida = 8): string
    {
        $token     = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$horasValida} hours"));

        $this->db->prepare(
            'INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at) VALUES (?,?,?,?,?)'
        )->execute([$token, $userId, $ip, $userAgent, $expiresAt]);

        return $token;
    }

    /**
     * Valida un token y retorna el user_id si es válido
     */
    public function validate(string $token): ?int
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT user_id FROM sessions
                 WHERE id = ? AND expires_at > NOW() AND revoked_at IS NULL'
            );
            $stmt->execute([$token]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ? (int)$row['user_id'] : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Revoca una sesión específica (logout)
     */
    public function revoke(string $token): void
    {
        try {
            $this->db->prepare('UPDATE sessions SET revoked_at = NOW() WHERE id = ?')->execute([$token]);
        } catch (\Exception $e) {}
    }

    /**
     * Revoca todas las sesiones de un usuario (logout total)
     */
    public function revokeAll(int $userId): void
    {
        try {
            $this->db->prepare('UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL')
                     ->execute([$userId]);
        } catch (\Exception $e) {}
    }

    /**
     * Limpieza de sesiones expiradas (llamar en cron o al inicio)
     */
    public function cleanup(): int
    {
        try {
            $stmt = $this->db->prepare('DELETE FROM sessions WHERE expires_at < NOW() OR revoked_at IS NOT NULL');
            $stmt->execute();
            return $stmt->rowCount();
        } catch (\Exception $e) {
            return 0;
        }
    }
}
