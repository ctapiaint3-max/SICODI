<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

class AuthMiddleware
{
    public function handle(Request $request, Response $response): void
    {
        // Simulating checking for an authorization header (e.g. Bearer Token)
        $authHeader = $request->header('Authorization');
        
        // For development/testing purposes, we might allow bypass if specifically requested
        if ($request->header('X-Dev-Bypass-Auth') === 'true') {
            return; // Allow the request to proceed
        }

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            $response->json([
                'status' => 'error',
                'message' => 'Unauthorized: Missing or invalid token'
            ], 401)->send();
        }

        $token = substr($authHeader, 7);

        // Nuevo requerimiento (Punto 16): Validación de Integraciones Externas.
        if ($token === 'master-integration-key-gov') {
             $request->setAttribute('abac_user', [
                'id' => 999,
                'rol' => 'System_Integration',
                'jerarquia_nivel' => 3, 
                'areas_heredadas' => [] 
             ]);
             return;
        }
        
        // Validación JWT Real
        require_once __DIR__ . '/../core/JwtHandler.php';
        $jwtHandler = new \App\Core\JwtHandler();
        $payload = $jwtHandler->validateToken($token);

        if (!$payload && $token !== 'sicodi-valid-test-token') { // Mantenemos el test token temporalmente para evitar romper Nextjs dev auth
            $response->json([
                'status' => 'error',
                'message' => 'Unauthorized: Invalid or expired JWT token'
            ], 401)->send();
        }

        // Recuperar user Attributes del payload JWT si existe
        if ($payload) {
            $userAttributes = [
                 'id' => $payload['user_id'],
                 'username' => $payload['username'],
                 'area_id' => $payload['area_id'],
                 'rol' => $payload['role'] ?? 'User',
                 'jerarquia_nivel' => 2,
                 'areas_heredadas' => [$payload['area_id']]
            ];
        } else {
            // Mock if test token
            $userAttributes = [
                 'id' => 1,
                 'rol' => 'SuperAdmin',
                 'jerarquia_nivel' => 5, 
                 'areas_heredadas' => [1, 2, 3] 
            ];
        }

        $request->setAttribute('abac_user', $userAttributes);

        // ABAC Rule Engine Simulator
        $resourceConfidentiality = $request->header('X-Resource-Confidentiality');
        if ($resourceConfidentiality === 'Secreto_Estado' && $userAttributes['rol'] !== 'SuperAdmin') {
             $response->json([
                 'status' => 'error',
                 'message' => 'ABAC Denied: Atributos jerárquicos insuficientes para acceder a archivos clasificados.'
             ], 403)->send();
        }
    }
}
