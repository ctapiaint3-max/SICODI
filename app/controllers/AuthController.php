<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Repositories\UserRepository;

class AuthController
{
    private UserRepository $userRepo;

    public function __construct()
    {
        $this->userRepo = new UserRepository();
    }

    public function login(Request $request, Response $response)
    {
        $payload = json_decode(file_get_contents('php://input'), true);

        if (!$payload || empty($payload['username']) || empty($payload['password'])) {
            return $response->json([
                'status' => 'error',
                'message' => 'Usuario y contraseña son requeridos'
            ], 400);
        }

        $username = $payload['username'];
        $password = $payload['password'];

        try {
            // Buscando el usuario en SQL
            $user = $this->userRepo->findByUsername($username);

            // Mock fallback: si la tabla users está vacía o si ocurre un fallo de base de datos offline, simulamos login.
            // Esto es crucial para poder probar el Frontend Next.js rápidamente si no hemos ejecutado seeders.
            if (!$user && $username === 'admin' && $password === 'admin123') {
                 $mockToken = base64_encode(json_encode(['id' => 1, 'username' => 'admin', 'role' => 'ADMIN', 'exp' => time() + 3600]));
                 return $response->json([
                    'status' => 'success',
                    'data' => [
                        'token' => $mockToken,
                        'user' => [
                            'id' => 1,
                            'username' => 'admin',
                            'full_name' => 'Administrador del Sistema',
                            'area_id' => 1
                        ]
                    ]
                 ]);
            }

            if (!$user) {
                return $response->json([
                    'status' => 'error',
                    'message' => 'Credenciales inválidas'
                ], 401);
            }

            // Verificando contraseña usando BCRYPT
            if (!password_verify($password, $user['password_hash'])) {
                return $response->json([
                    'status' => 'error',
                    'message' => 'Credenciales inválidas'
                ], 401);
            }

            if ($user['status'] !== 'ACTIVE') {
                 return $response->json([
                    'status' => 'error',
                    'message' => 'Usuario inactivo'
                ], 403);
            }

            // Generando JWT Real
            require_once __DIR__ . '/../core/JwtHandler.php';
            $jwtHandler = new \App\Core\JwtHandler();
            
            $jwt = $jwtHandler->generateToken([
                'user_id' => $user['id'],
                'username' => $user['username'],
                'area_id' => $user['area_id'],
                'role' => 'ADMIN' // Se puede extender buscando los roles reales en BD
            ]);

            return $response->json([
                'status' => 'success',
                'data' => [
                    'token' => $jwt,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'full_name' => $user['full_name'],
                        'area_id' => $user['area_id']
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            // Manejador offline XAMPP para permitir desarrollo de NEXT
            if (strpos($e->getMessage(), 'Database connection failed') !== false || strpos($e->getMessage(), 'SQLSTATE') !== false) {
                 if ($username === 'admin' && $password === 'admin123') {
                     $mockToken = base64_encode(json_encode(['id' => 1, 'username' => 'admin', 'role' => 'ADMIN', 'exp' => time() + 3600]));
                     return $response->json([
                        'status' => 'success',
                        'data' => [
                            'token' => $mockToken,
                            'user' => [
                                'id' => 1,
                                'username' => 'admin',
                                'full_name' => 'Administrador (Offline Mode)',
                                'area_id' => 1
                            ]
                        ]
                     ]);
                 }
            }

            return $response->json([
                'status' => 'error',
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }
}
