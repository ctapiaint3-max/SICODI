<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\NotificationService;

class NotificationController
{
    private NotificationService $service;

    public function __construct()
    {
        $this->service = new NotificationService();
    }

    public function index(Request $request, Response $response)
    {
        $userId = (int)($request->user['id'] ?? 1);
        $notifs = $this->service->getNoLeidas($userId);
        $count  = count($notifs);

        return $response->json([
            'status' => 'success',
            'data'   => $notifs,
            'meta'   => ['no_leidas' => $count]
        ]);
    }

    public function count(Request $request, Response $response)
    {
        $userId = (int)($request->user['id'] ?? 1);
        return $response->json([
            'status' => 'success',
            'data'   => ['count' => $this->service->countNoLeidas($userId)]
        ]);
    }

    public function marcarLeida(Request $request, Response $response, string $id)
    {
        $userId = (int)($request->user['id'] ?? 1);
        $this->service->marcarLeida((int)$id, $userId);
        return $response->json(['status'=>'success','message'=>'Notificación marcada como leída.']);
    }

    public function marcarTodasLeidas(Request $request, Response $response)
    {
        $userId = (int)($request->user['id'] ?? 1);
        $this->service->marcarTodasLeidas($userId);
        return $response->json(['status'=>'success','message'=>'Todas las notificaciones marcadas como leídas.']);
    }
}
