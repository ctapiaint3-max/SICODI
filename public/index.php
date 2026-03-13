<?php

require_once __DIR__ . '/../App/Core/Request.php';
require_once __DIR__ . '/../App/Core/Response.php';
require_once __DIR__ . '/../App/Core/Router.php';

use App\Core\Request;
use App\Core\Response;
use App\Core\Router;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple Autoloader for standard Psr-4
spl_autoload_register(function ($class) {
    // Project-specific namespace prefix
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../App/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

$request = new Request();
$response = new Response();
$router = new Router();

// ==========================================
// RUTES DE PRUEBA / REGISTRO DE RUTAS
// ==========================================

$router->get('/', function(Request $request, Response $response) {
    // Intentar detectar la URL base automáticamente si no hay variable de entorno
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
    $autoUrl = rtrim($protocol . $host, '/');

    $appUrl  = getenv('APP_URL')  ?: $autoUrl;
    $frontUrl = getenv('FRONTEND_URL') ?: 'http://localhost:3000';
    
    return $response->json([
        'status'  => 'success',
        'app'     => 'SICODI — Sistema de Control Documental Institucional',
        'version' => '1.0.0',
        'api'     => $appUrl . '/api',
        'frontend'=> $frontUrl,
        'endpoints' => ['/api/v1/health', '/api/v1/expedientes', '/api/v1/documentos', '/api/v1/auth/login', '/api/v1/dashboard/kpis']
    ]);
});

$router->get('/api/v1/health', function(Request $request, Response $response) {
    return $response->json([
        'status'  => 'success',
        'message' => 'SICODI Core API is running gracefully.',
        'time'    => date('Y-m-d H:i:s'),
        'php'     => phpversion()
    ]);
});

// Rutas BPMN Workflow Emulado
$router->get('/api/v1/workflow/tasks', [\App\Controllers\WorkflowController::class, 'myTasks']);
$router->post('/api/v1/workflow/tasks/{id}/complete', [\App\Controllers\WorkflowController::class, 'completeTask']);
$router->post('/api/v1/workflow/simulate', [\App\Controllers\WorkflowController::class, 'simulateTransition']);
$router->post('/api/v1/workflow/read', [\App\Controllers\WorkflowController::class, 'markAsRead']);

// Ruta Correspondencia
require_once __DIR__ . '/../App/Controllers/RegistroDocumentalController.php';
$router->post('/api/v1/registro/recepcionar', [\App\Controllers\RegistroDocumentalController::class, 'recepcionar']);
$router->get('/api/v1/registro/listar', [\App\Controllers\RegistroDocumentalController::class, 'listar']);

// Ruta Correo Institucional
require_once __DIR__ . '/../App/Controllers/MailController.php';
$router->get('/api/v1/correo/inbox', [\App\Controllers\MailController::class, 'getInbox']);
$router->post('/api/v1/correo/enviar', [\App\Controllers\MailController::class, 'enviarCorreo']);
$router->post('/api/v1/correo/inbound-webhook', [\App\Controllers\MailController::class, 'receiveImapWebhook']);
$router->get('/api/v1/correo/track', [\App\Controllers\MailController::class, 'markAsReadProxy']);
$router->post('/api/v1/correo/cron-expirations', [\App\Controllers\MailController::class, 'checkExpirations']);

// Rutas Expedientes (Gestor Maestros)
require_once __DIR__ . '/../App/Controllers/ExpedienteController.php';
$router->get('/api/v1/expedientes', [\App\Controllers\ExpedienteController::class, 'index']);
$router->get('/api/v1/expedientes/{id}', [\App\Controllers\ExpedienteController::class, 'show']);

// Ruta Autenticación
require_once __DIR__ . '/../App/Controllers/AuthController.php';
$router->post('/api/v1/auth/login', [\App\Controllers\AuthController::class, 'login']);

// Rutas Documentos
require_once __DIR__ . '/../App/Controllers/DocumentoController.php';
$router->get('/api/v1/documentos', [\App\Controllers\DocumentoController::class, 'index']);
$router->post('/api/v1/documentos/upload', [\App\Controllers\DocumentoController::class, 'upload']);
$router->get('/api/v1/documentos/{id}/download', [\App\Controllers\DocumentoController::class, 'download']);

// Rutas Firmas
require_once __DIR__ . '/../App/Controllers/FirmaController.php';
$router->post('/api/v1/firmas/estampar', [\App\Controllers\FirmaController::class, 'firmarDocumento']);

// Rutas Notificaciones (SLA visual y polling)
require_once __DIR__ . '/../App/Controllers/NotificationController.php';
$router->get('/api/v1/notifications', [\App\Controllers\NotificationController::class, 'index']);
$router->get('/api/v1/notifications/count', [\App\Controllers\NotificationController::class, 'count']);
$router->put('/api/v1/notifications/todas-leidas', [\App\Controllers\NotificationController::class, 'marcarTodasLeidas']);
$router->put('/api/v1/notifications/{id}/leida', [\App\Controllers\NotificationController::class, 'marcarLeida']);

// Rutas Dashboard
require_once __DIR__ . '/../App/Controllers/DashboardController.php';
$router->get('/api/v1/dashboard/kpis', [\App\Controllers\DashboardController::class, 'getKpis']);
$router->get('/api/v1/dashboard/reports', [\App\Controllers\DashboardController::class, 'getTabularReports']);
$router->get('/api/v1/dashboard/reports/pdf', [\App\Controllers\DashboardController::class, 'getPrintableReport']);

// Rutas Administración
require_once __DIR__ . '/../App/Controllers/AdminController.php';
$router->get('/api/v1/admin/users', [\App\Controllers\AdminController::class, 'getUsers']);
$router->post('/api/v1/admin/users/create', [\App\Controllers\AdminController::class, 'createUser']);
$router->put('/api/v1/admin/users/{id}/update', [\App\Controllers\AdminController::class, 'updateUser']);
$router->put('/api/v1/admin/users/{id}/toggle', [\App\Controllers\AdminController::class, 'toggleUserStatus']);
$router->delete('/api/v1/admin/users/{id}', [\App\Controllers\AdminController::class, 'deleteUser']);
$router->get('/api/v1/admin/audit', [\App\Controllers\AdminController::class, 'getAuditLogs']);
$router->get('/api/v1/admin/areas', [\App\Controllers\AdminController::class, 'getAreas']);
$router->post('/api/v1/admin/areas', [\App\Controllers\AdminController::class, 'createArea']);
$router->put('/api/v1/admin/areas/{id}', [\App\Controllers\AdminController::class, 'updateArea']);
$router->get('/api/v1/admin/roles', [\App\Controllers\AdminController::class, 'getRoles']);
$router->post('/api/v1/admin/roles', [\App\Controllers\AdminController::class, 'createRole']);
$router->put('/api/v1/admin/roles/{id}', [\App\Controllers\AdminController::class, 'updateRole']);

// Rutas Auditoría Institucional (solo ADMIN)
require_once __DIR__ . '/../App/Controllers/AuditController.php';
$router->get('/api/v1/audit/log',      [\App\Controllers\AuditController::class, 'index']);
$router->get('/api/v1/audit/acciones', [\App\Controllers\AuditController::class, 'acciones']);


// Rutas Expedientes (CRUD Completo)
$router->post('/api/v1/expedientes', [\App\Controllers\ExpedienteController::class, 'store']);
$router->put('/api/v1/expedientes/{id}', [\App\Controllers\ExpedienteController::class, 'update']);
$router->delete('/api/v1/expedientes/{id}', [\App\Controllers\ExpedienteController::class, 'destroy']);

// Rutas Trazabilidad Workflow
require_once __DIR__ . '/../App/Controllers/WorkflowController.php';
$router->post('/api/v1/workflow/read',                   [\App\Controllers\WorkflowController::class, 'markAsRead']);
$router->post('/api/v1/workflow/iniciar/{expedienteId}', [\App\Controllers\WorkflowController::class, 'iniciarProceso']);
$router->post('/api/v1/workflow/avanzar/{expedienteId}', [\App\Controllers\WorkflowController::class, 'avanzarEstado']);
$router->get('/api/v1/workflow/transitions/{estado}',    [\App\Controllers\WorkflowController::class, 'getTransitions']);

// Rutas Notificaciones
require_once __DIR__ . '/../App/Controllers/NotificationController.php';
$router->get('/api/v1/notifications',                      [\App\Controllers\NotificationController::class, 'index']);
$router->get('/api/v1/notifications/count',                [\App\Controllers\NotificationController::class, 'count']);
$router->put('/api/v1/notifications/{id}/leida',           [\App\Controllers\NotificationController::class, 'marcarLeida']);
$router->put('/api/v1/notifications/todas-leidas',         [\App\Controllers\NotificationController::class, 'marcarTodasLeidas']);

// Rutas Reportes (dedicado)
require_once __DIR__ . '/../App/Controllers/ReportController.php';
$router->get('/api/v1/reportes/kpis',              [\App\Controllers\ReportController::class, 'kpis']);
$router->get('/api/v1/reportes/cumplimiento',      [\App\Controllers\ReportController::class, 'cumplimientoPorArea']);
$router->get('/api/v1/reportes/tiempos',           [\App\Controllers\ReportController::class, 'tiemposPromedio']);
$router->get('/api/v1/reportes/tabular',           [\App\Controllers\ReportController::class, 'tabular']);

// Rutas Auditoría
require_once __DIR__ . '/../App/Controllers/AuditoriaController.php';
$router->get('/api/v1/auditoria',                  [\App\Controllers\AuditoriaController::class, 'index']);
$router->get('/api/v1/auditoria/{entityType}',     [\App\Controllers\AuditoriaController::class, 'byEntity']);

// Logout
require_once __DIR__ . '/../App/Controllers/AuthController.php';
$router->post('/api/v1/auth/logout', [\App\Controllers\AuthController::class, 'logout']);

// Rutas Interoperabilidad / Integraciones (Punto 16)
require_once __DIR__ . '/../App/Controllers/IntegrationController.php';
$router->get('/api/v1/integrations/ping', [\App\Controllers\IntegrationController::class, 'ping']);

// Rutas Configuración (Gateway ABAC y Sys)
require_once __DIR__ . '/../App/Controllers/ConfigController.php';
$router->get('/api/v1/config',  [\App\Controllers\ConfigController::class, 'getConfig']);
$router->put('/api/v1/config',  [\App\Controllers\ConfigController::class, 'updateConfig']);

// ─────────────────────────────────────────────────────────────
// CABECERAS DE SEGURIDAD HTTP (Sección 15 de AGENTS.md)
// ─────────────────────────────────────────────────────────────
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
// CSP permisivo para desarrollo (en prod: restringir orígenes)
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");

// Start dispatching
$router->dispatch($request, $response);

