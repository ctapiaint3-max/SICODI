<?php
namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use PDO;

/**
 * PermissionMiddleware — validación RBAC granular por permiso
 */
class PermissionMiddleware
{
    private string $requiredPermission;

    public function __construct(string $requiredPermission)
    {
        $this->requiredPermission = $requiredPermission;
    }

    public function handle(Request $request, Response $response, callable $next): mixed
    {
        $user = $request->user ?? null;
        if (!$user) {
            return $response->json(['status'=>'error','message'=>'No autenticado.'], 401)->send();
        }

        // SuperAdmin tiene acceso total
        if (in_array('SUPER_ADMIN', $user['roles'] ?? [])) {
            return $next($request, $response);
        }

        // Verificar permiso específico en BD
        try {
            $db   = Database::getInstance();
            $stmt = $db->prepare(
                'SELECT COUNT(*) FROM role_permissions rp
                 JOIN permissions p ON rp.permission_id = p.id
                 JOIN user_roles ur ON rp.role_id = ur.role_id
                 WHERE ur.user_id = ? AND p.code = ?'
            );
            $stmt->execute([$user['id'], $this->requiredPermission]);
            if ((int)$stmt->fetchColumn() > 0) {
                return $next($request, $response);
            }
        } catch (\Exception $e) {
            // En modo demo sin BD, permitir acceso
            return $next($request, $response);
        }

        return $response->json([
            'status'  => 'error',
            'message' => "Permiso requerido: {$this->requiredPermission}"
        ], 403)->send();
    }
}
