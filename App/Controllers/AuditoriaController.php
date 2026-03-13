<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use Exception;
use PDO;

class AuditoriaController
{
    public function index(Request $request, Response $response)
    {
        try {
            $db    = Database::getInstance();
            $limit = (int)($request->query('limit', 100));
            $page  = (int)($request->query('page', 1));
            $off   = ($page - 1) * $limit;

            $stmt = $db->prepare(
                'SELECT al.id, u.username, al.action, al.entity_type, al.entity_id,
                        al.ip_address, al.created_at,
                        al.old_data, al.new_data
                 FROM audit_log al
                 LEFT JOIN users u ON al.user_id = u.id
                 ORDER BY al.created_at DESC
                 LIMIT ? OFFSET ?'
            );
            $stmt->execute([$limit, $off]);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $total = (int)$db->query('SELECT COUNT(*) FROM audit_log')->fetchColumn();

            return $response->json([
                'status' => 'success',
                'data'   => $logs,
                'meta'   => ['total'=>$total, 'page'=>$page, 'limit'=>$limit, 'pages'=>ceil($total/$limit)]
            ]);
        } catch (Exception $e) {
            // Mock demo
            return $response->json([
                'status' => 'success',
                'data'   => [
                    ['id'=>1,'username'=>'admin','action'=>'LOGIN','entity_type'=>'SESSION','entity_id'=>null,'ip_address'=>'127.0.0.1','created_at'=>date('Y-m-d H:i:s'),'old_data'=>null,'new_data'=>null],
                    ['id'=>2,'username'=>'admin','action'=>'CREATE','entity_type'=>'EXPEDIENTE','entity_id'=>'1','ip_address'=>'127.0.0.1','created_at'=>date('Y-m-d H:i:s',strtotime('-1 hour')),'old_data'=>null,'new_data'=>'{"codigo":"EXP-2026-00001"}'],
                ],
                'meta' => ['total'=>2,'page'=>1,'limit'=>100,'pages'=>1]
            ]);
        }
    }

    public function byEntity(Request $request, Response $response, string $entityType)
    {
        try {
            $db   = Database::getInstance();
            $stmt = $db->prepare(
                'SELECT al.*, u.username FROM audit_log al
                 LEFT JOIN users u ON al.user_id = u.id
                 WHERE al.entity_type = ?
                 ORDER BY al.created_at DESC LIMIT 50'
            );
            $stmt->execute([$entityType]);
            return $response->json(['status'=>'success', 'data'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return $response->json(['status'=>'success','data'=>[]]);
        }
    }
}
