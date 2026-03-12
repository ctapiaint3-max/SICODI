<?php
namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

/**
 * CsrfMiddleware — protección CSRF para mutaciones (POST/PUT/DELETE)
 * Los endpoints API (JSON) usan header X-CSRF-Token
 */
class CsrfMiddleware
{
    private const HEADER = 'X-CSRF-Token';
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request, Response $response, callable $next): mixed
    {
        // Métodos seguros no requieren verificación
        if (in_array($request->method(), self::SAFE_METHODS)) {
            return $next($request, $response);
        }

        // Rutas de API con Bearer Token son exempt (stateless auth)
        $auth = $request->header('Authorization', '');
        if (str_starts_with($auth, 'Bearer ')) {
            return $next($request, $response);
        }

        // Verificar CSRF token
        $token = $request->header(self::HEADER, '') ?: ($request->all()['_csrf'] ?? '');
        $sessionToken = $_SESSION['csrf_token'] ?? '';

        if (empty($token) || !hash_equals($sessionToken, $token)) {
            return $response->json(['status' => 'error', 'message' => 'CSRF token inválido o faltante.'], 403)->send();
        }

        return $next($request, $response);
    }

    /**
     * Genera y almacena un nuevo token CSRF en la sesión
     */
    public static function generateToken(): string
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
}
