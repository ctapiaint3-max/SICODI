<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use PDO;
use Exception;

/**
 * AuditController — Solo accesible para rol ADMIN
 * Expone el log completo de auditoría institucional en modo lectura
 */
class AuditController
{
    /**
     * GET /api/v1/audit/log
     * Devuelve los registros del audit_log paginados y filtrables.
     * Restringido a ADMIN en el middleware; aquí reforzamos la validación.
     */
    public function index(Request $request, Response $response)
    {
        // Guard adicional de rol
        $user  = $request->user ?? [];
        $roles = (array)($user['roles'] ?? []);
        $isAdmin = in_array('ADMIN', $roles, true)
                || in_array('admin', $roles, true)
                || (($user['role'] ?? '') === 'admin');

        if (!$isAdmin) {
            return $response->json(['status' => 'error', 'message' => 'Acceso denegado. Solo Administradores.'], 403)->send();
        }

        try {
            $db = Database::getInstance()->getConnection();

            // Filtros opcionales
            $accion   = $request->getParam('accion')   ?? null;
            $entidad  = $request->getParam('entidad')  ?? null;
            $usuario  = $request->getParam('usuario')  ?? null;
            $desde    = $request->getParam('desde')    ?? null;
            $hasta    = $request->getParam('hasta')    ?? null;
            $page     = max(1, (int)($request->getParam('page') ?? 1));
            $limit    = 50;
            $offset   = ($page - 1) * $limit;

            $where  = [];
            $params = [];

            if ($accion)  { $where[] = 'al.accion   = :accion';   $params[':accion']  = $accion;  }
            if ($entidad) { $where[] = 'al.entidad  = :entidad';   $params[':entidad'] = $entidad; }
            if ($usuario) { $where[] = '(u.username LIKE :usr OR u.nombre LIKE :usr)'; $params[':usr'] = "%$usuario%"; }
            if ($desde)   { $where[] = 'al.created_at >= :desde';  $params[':desde']   = $desde;   }
            if ($hasta)   { $where[] = 'al.created_at <= :hasta';  $params[':hasta']   = $hasta;   }

            $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

            $sql = "
                SELECT
                    al.id,
                    al.accion,
                    al.entidad,
                    al.entidad_id,
                    al.datos_nuevos,
                    al.datos_anteriores,
                    al.ip_address,
                    al.user_agent,
                    al.created_at,
                    COALESCE(u.full_name, u.username, CONCAT('UID-', al.usuario_id), 'Sistema') AS usuario_nombre,
                    u.username
                FROM audit_log al
                LEFT JOIN users u ON u.id = al.usuario_id
                $whereSQL
                ORDER BY al.created_at DESC
                LIMIT :limit OFFSET :offset
            ";

            $stmt = $db->prepare($sql);
            foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
            $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Total para paginación
            $countSQL  = "SELECT COUNT(*) FROM audit_log al LEFT JOIN users u ON u.id = al.usuario_id $whereSQL";
            $countStmt = $db->prepare($countSQL);
            foreach ($params as $k => $v) { $countStmt->bindValue($k, $v); }
            $countStmt->execute();
            $total = (int)$countStmt->fetchColumn();

            // Decodificar JSON de datos
            foreach ($rows as &$row) {
                foreach (['datos_nuevos', 'datos_anteriores'] as $field) {
                    if (!empty($row[$field])) {
                        $decoded = json_decode($row[$field], true);
                        $row[$field] = $decoded ?? $row[$field];
                    }
                }
            }

            return $response->json([
                'status' => 'success',
                'data'   => $rows,
                'meta'   => [
                    'total'  => $total,
                    'page'   => $page,
                    'limit'  => $limit,
                    'pages'  => (int)ceil($total / $limit),
                ],
            ])->send();

        } catch (Exception $e) {
            // Sin BD — devolver mock demo
            $mockData = [
                ['id' => 1, 'accion' => 'LOGIN',        'entidad' => 'users',         'entidad_id' => 1, 'usuario_nombre' => 'Administrador', 'username' => 'admin', 'ip_address' => '192.168.1.10', 'user_agent' => 'Chrome/131 SICODI-Intranet', 'created_at' => date('Y-m-d H:i:s', strtotime('-5 minutes')),  'datos_nuevos' => null],
                ['id' => 2, 'accion' => 'CORREO_LEIDO', 'entidad' => 'mail_messages', 'entidad_id' => 1, 'usuario_nombre' => 'Administrador', 'username' => 'admin', 'ip_address' => '192.168.1.10', 'user_agent' => 'Chrome/131 SICODI-Intranet', 'created_at' => date('Y-m-d H:i:s', strtotime('-3 minutes')),  'datos_nuevos' => ['accion' => 'Correo leído', 'read_at' => date('Y-m-d H:i:s')]],
                ['id' => 3, 'accion' => 'EXPEDIENTE_CREADO', 'entidad' => 'expedientes', 'entidad_id' => 5, 'usuario_nombre' => 'Operador SICODI', 'username' => 'operador1', 'ip_address' => '192.168.1.22', 'user_agent' => 'Firefox/132', 'created_at' => date('Y-m-d H:i:s', strtotime('-30 minutes')), 'datos_nuevos' => ['codigo' => 'EXP-2026-00005', 'asunto' => 'Solicitud Viáticos']],
                ['id' => 4, 'accion' => 'FIRMA_DIGITAL', 'entidad' => 'tareas',       'entidad_id' => 3, 'usuario_nombre' => 'Administrador', 'username' => 'admin', 'ip_address' => '192.168.1.10', 'user_agent' => 'Chrome/131 SICODI-Intranet', 'created_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),   'datos_nuevos' => ['pin_hash' => '****', 'timestamp' => date('Y-m-d H:i:s')]],
                ['id' => 5, 'accion' => 'LOGIN',        'entidad' => 'users',         'entidad_id' => 3, 'usuario_nombre' => 'Operador SICODI', 'username' => 'operador1', 'ip_address' => '192.168.1.22', 'user_agent' => 'Firefox/132', 'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),  'datos_nuevos' => null],
            ];
            return $response->json(['status' => 'success', 'data' => $mockData, 'meta' => ['total' => 5, 'page' => 1, 'limit' => 50, 'pages' => 1]])->send();
        }
    }

    /**
     * GET /api/v1/audit/acciones
     * Listado de acciones únicas para el filtro dropdown del panel.
     */
    public function acciones(Request $request, Response $response)
    {
        $user  = $request->user ?? [];
        $roles = (array)($user['roles'] ?? []);
        $isAdmin = in_array('ADMIN', $roles, true) || in_array('admin', $roles, true) || (($user['role'] ?? '') === 'admin');
        if (!$isAdmin) {
            return $response->json(['status' => 'error', 'message' => 'Acceso denegado.'], 403)->send();
        }

        try {
            $db   = Database::getInstance()->getConnection();
            $stmt = $db->query("SELECT DISTINCT accion FROM audit_log ORDER BY accion ASC");
            $list = $stmt->fetchAll(PDO::FETCH_COLUMN);
            return $response->json(['status' => 'success', 'data' => $list])->send();
        } catch (Exception $e) {
            $mock = ['LOGIN', 'LOGOUT', 'CORREO_LEIDO', 'CORREO_BLOQUEADO', 'EXPEDIENTE_CREADO', 'DOCUMENTO_SUBIDO', 'FIRMA_DIGITAL', 'TAREA_COMPLETADA', 'CONFIG_CAMBIADA'];
            return $response->json(['status' => 'success', 'data' => $mock])->send();
        }
    }
}
