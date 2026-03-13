<?php
namespace App\Services;

use App\Core\Database;
use Exception;
use PDO;

class UserService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getAll(): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT u.id, u.username, u.email, u.full_name, u.status, u.area_id,
                        a.name as area_nombre, GROUP_CONCAT(r.name) as roles_csv
                 FROM users u
                 LEFT JOIN areas a ON u.area_id = a.id
                 LEFT JOIN user_roles ur ON u.id = ur.user_id
                 LEFT JOIN roles r ON ur.role_id = r.id
                 GROUP BY u.id
                 ORDER BY u.full_name ASC'
            );
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($users as &$u) {
                $u['roles'] = $u['roles_csv'] ? explode(',', $u['roles_csv']) : [];
                unset($u['roles_csv']);
            }
            return $users;
        } catch (Exception $e) {
            return $this->mockUsers();
        }
    }

    public function create(array $data): int
    {
        $hash = password_hash($data['password'], PASSWORD_BCRYPT);
        $conn = $this->db->prepare(
            'INSERT INTO users (username, email, password_hash, full_name, status, area_id)
             VALUES (?,?,?,?,?,?)'
        );
        $conn->execute([
            $data['username'], $data['email'], $hash,
            $data['full_name'], 'ACTIVE', $data['area_id'] ?? null
        ]);
        $newId = $this->db->lastInsertId();

        // Asignar rol
        $roleId = $data['role_id'] ?? 3;
        $this->db->prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?,?)')->execute([$newId, $roleId]);

        return (int)$newId;
    }

    public function toggleStatus(int $id): string
    {
        $stmt = $this->db->prepare('SELECT status FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) throw new Exception('Usuario no encontrado', 404);
        $newStatus = $user['status'] === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        $this->db->prepare('UPDATE users SET status = ? WHERE id = ?')->execute([$newStatus, $id]);
        return $newStatus;
    }

    public function delete(int $id): void
    {
        $this->db->prepare('DELETE FROM user_roles WHERE user_id = ?')->execute([$id]);
        $this->db->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$id]);
        $this->db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    }

    private function mockUsers(): array
    {
        return [
            ['id'=>1,'username'=>'admin','email'=>'admin@institucion.gov','full_name'=>'Administrador Sistema','status'=>'ACTIVE','area_nombre'=>'TI','roles'=>['SUPER_ADMIN']],
            ['id'=>2,'username'=>'jperez','email'=>'jperez@institucion.gov','full_name'=>'Juan Pérez','status'=>'ACTIVE','area_nombre'=>'Dirección General','roles'=>['FUNCIONARIO']],
        ];
    }
}
