<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use Exception;
use PDO;

class ConfigController
{
    public function getConfig(Request $request, Response $response)
    {
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->query("SELECT metakey, metavalue FROM system_config");
            $configPairs = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            // Valores por defecto si la base de datos está vacía
            $defaults = [
                'bpmn_auto_assign' => 'true',
                'bpmn_sla_hours' => '48',
                'abac_strict_mode' => 'true',
                'abac_confidentiality_level' => 'Alta',
                'sys_maintenance' => 'false',
                'sys_max_upload_mb' => '10'
            ];

            $finalConfig = array_merge($defaults, $configPairs);

            return $response->json(['status' => 'success', 'data' => $finalConfig])->send();
        } catch (Exception $e) {
             // Offline fallback
             if (strpos($e->getMessage(), 'Database connection failed') !== false || strpos($e->getMessage(), 'SQLSTATE') !== false) {
                 return $response->json([
                    'status' => 'success', 
                    'data' => [
                        'bpmn_auto_assign' => 'true',
                        'bpmn_sla_hours' => '48',
                        'abac_strict_mode' => 'true',
                        'abac_confidentiality_level' => 'Alta',
                        'sys_maintenance' => 'false',
                        'sys_max_upload_mb' => '10'
                    ]
                 ])->send();
             }
             return $response->json(['status' => 'error', 'message' => $e->getMessage()], 500)->send();
        }
    }

    public function updateConfig(Request $request, Response $response)
    {
        try {
            $data = $request->all();
            if (empty($data)) {
                return $response->json(['status' => 'error', 'message' => 'No configuration payload provided'], 400)->send();
            }

            $db = Database::getInstance()->getConnection();
            
            foreach ($data as $key => $value) {
                // Upsert logic (Insert or Update on Duplicate Key)
                $stmt = $db->prepare("
                    INSERT INTO system_config (metakey, metavalue) 
                    VALUES (?, ?) 
                    ON DUPLICATE KEY UPDATE metavalue = VALUES(metavalue)
                ");
                $stmt->execute([$key, (string)$value]);
            }

            return $response->json(['status' => 'success', 'message' => 'Configuración de seguridad y arquitectura actualizada'])->send();
        } catch (Exception $e) {
             return $response->json(['status' => 'error', 'message' => $e->getMessage()], 500)->send();
        }
    }
}
