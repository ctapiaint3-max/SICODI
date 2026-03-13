<?php
namespace App\Services;

use App\Core\Database;
use App\Security\SessionManager;
use Exception;
use PDO;

/**
 * AuthService — autenticación, tokens de sesión, logout
 */
class AuthService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Autentica usuario y devuelve token de sesión
     * @return array ['user'=>[...], 'token'=>'...']
     */
    public function login(string $username, string $password, string $ip): array
    {
        // Buscar usuario activo
        $stmt = $this->db->prepare(
            'SELECT u.*, GROUP_CONCAT(r.code) as roles_csv
             FROM users u
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             LEFT JOIN roles r ON ur.role_id = r.id
             WHERE (u.username = :u OR u.email = :u) AND u.status = "ACTIVE"
             GROUP BY u.id'
        );
        $stmt->execute([':u' => $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new Exception('Credenciales inválidas.', 401);
        }

        // Generar token de sesión seguro
        $token     = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+8 hours'));

        $this->db->prepare(
            'INSERT INTO sessions (id, user_id, ip_address, expires_at) VALUES (:id, :uid, :ip, :exp)'
        )->execute([':id' => $token, ':uid' => $user['id'], ':ip' => $ip, ':exp' => $expiresAt]);

        // Actualizar último login
        $this->db->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')
                 ->execute([$user['id']]);

        unset($user['password_hash']);
        $user['roles'] = $user['roles_csv'] ? explode(',', $user['roles_csv']) : [];
        unset($user['roles_csv']);

        return ['user' => $user, 'token' => $token, 'expires_at' => $expiresAt];
    }

    /**
     * Valida token de sesión y retorna el usuario
     */
    public function validateToken(string $token, string $ip): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT u.id, u.username, u.email, u.full_name, u.area_id, u.status,
                    GROUP_CONCAT(r.code) as roles_csv
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             LEFT JOIN roles r ON ur.role_id = r.id
             WHERE s.id = :token
               AND s.expires_at > NOW()
               AND s.revoked_at IS NULL
               AND u.status = "ACTIVE"
             GROUP BY u.id'
        );
        $stmt->execute([':token' => $token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) return null;

        $user['roles'] = $user['roles_csv'] ? explode(',', $user['roles_csv']) : [];
        unset($user['roles_csv']);
        return $user;
    }

    /**
     * Revoca la sesión (logout)
     */
    public function logout(string $token): void
    {
        $this->db->prepare('UPDATE sessions SET revoked_at = NOW() WHERE id = ?')
                 ->execute([$token]);
    }

    /**
     * Fallback para modo demo sin BD
     */
    public function loginDemo(string $username, string $password): array
    {
        if ($username === 'admin' && $password === 'admin123') {
            return [
                'user'  => ['id'=>1,'username'=>'admin','email'=>'admin@institucion.gov',
                            'full_name'=>'Administrador Sistema','area_id'=>1,
                            'status'=>'ACTIVE','roles'=>['SUPER_ADMIN']],
                'token' => 'demo-token-' . bin2hex(random_bytes(8)),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+8 hours'))
            ];
        }
        throw new Exception('Credenciales inválidas.', 401);
    }
}
