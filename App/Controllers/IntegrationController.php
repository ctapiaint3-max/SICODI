<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;

class IntegrationController
{
    /**
     * Endpoint API 16: Validación de Conectividad para APIs de Terceros (Intranet Gubernamental)
     */
    public function ping(Request $request, Response $response)
    {
        // En este punto, AuthMiddleware ya garantizó el Token, 
        // y inyectó los atributos de la Service Account en 'abac_user'.
        $serviceAccount = $request->getAttribute('abac_user');

        return $response->json([
            'status' => 'success',
            'message' => 'Integración Validada Localmente. SICODI Handshake OK.',
            'service_account' => $serviceAccount,
            'timestamp' => date('Y-m-d H:i:s'),
            'host' => $_SERVER['HTTP_HOST'] ?? 'unknown'
        ]);
    }
}
