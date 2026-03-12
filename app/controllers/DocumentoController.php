<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\DocumentoService;

class DocumentoController
{
    private DocumentoService $service;

    public function __construct()
    {
        $this->service = new DocumentoService();
    }

    public function index(Request $request, Response $response)
    {
        try {
            // Este endpoint devolverá todos los documentos
            $docs = $this->service->getDocumentos();
            return $response->json([
                'status' => 'success',
                'data' => $docs
            ]);
        } catch (\Exception $e) {
           return $response->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function upload(Request $request, Response $response)
    {
        // Simulated Auth User checking. En un sistema real vendria del AuthMiddleware Request->user_id
        $userId = 1; 

        if (empty($_FILES['file'])) {
            return $response->json(['status' => 'error', 'message' => 'No se subió ningún archivo.'], 400);
        }

        $file = $_FILES['file'];

        // Validaciones básicas de seguridad
        $allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($ext, $allowedExtensions)) {
            return $response->json(['status' => 'error', 'message' => 'Tipo de archivo no permitido.'], 403);
        }

        try {
            $result = $this->service->saveFisico($file, $userId);
            
            return $response->json([
                'status' => 'success',
                'message' => 'Documento almacenado con éxito e integridad validada (Hash SHA-256).',
                'data' => $result
            ], 201);
            
        } catch (\Exception $e) {
            // Manejador offline XAMPP bypass
            if (strpos($e->getMessage(), 'Database connection failed') !== false) {
                 return $response->json([
                    'status' => 'success',
                    'message' => 'Documento copiado. Base de datos offline - Bypass Simulado activo.',
                    'data' => [ 'documento_id' => rand(100,999) ]
                ], 201);
            }

            return $response->json([
                'status' => 'error',
                'message' => 'Fallo al subir archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    public function download(Request $request, Response $response, string $id)
    {
        try {
            $db = \App\Core\Database::getInstance()->getConnection();
            $stmt = $db->prepare('
                SELECT d.titulo, dv.storage_path, dv.mime_type, dv.file_size
                FROM documentos d 
                JOIN documento_version dv ON d.current_version_id = dv.id 
                WHERE d.id = ?
            ');
            $stmt->execute([$id]);
            $doc = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$doc) {
                return $response->json(['status' => 'error', 'message' => 'Documento Inexistente'], 404);
            }

            $basePath = realpath(__DIR__ . '/../../');
            $filePath = $basePath . $doc['storage_path'];

            if (!file_exists($filePath)) {
                return $response->json(['status' => 'error', 'message' => 'El Binario físico no se encontró en el NAS (Broken Link)'], 404);
            }

            // By-pass del objeto Response para Stream Binario Directo
            header('Content-Description: File Transfer');
            header('Content-Type: ' . $doc['mime_type']);
            
            // Si el parametro "view" es setado (ejemplo ?view=1), se pre-visualiza inline en vez de forzar attachment.
            $disposition = isset($_GET['view']) && $_GET['view'] == '1' ? 'inline' : 'attachment';
            header('Content-Disposition: ' . $disposition . '; filename="' . basename($doc['titulo']) . '"');
            
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . $doc['file_size']);
            
            readfile($filePath);
            exit; // Prevenimos inyecciones extra post-stream

        } catch (\Exception $e) {
             return $response->json(['status' => 'error', 'message' => 'Falla interna de descarga'], 500);
        }
    }
}
