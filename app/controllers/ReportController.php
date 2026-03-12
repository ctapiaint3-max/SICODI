<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\ReportService;

class ReportController
{
    private ReportService $service;

    public function __construct()
    {
        $this->service = new ReportService();
    }

    public function cumplimientoPorArea(Request $request, Response $response)
    {
        return $response->json([
            'status' => 'success',
            'data'   => $this->service->getCumplimientoPorArea()
        ]);
    }

    public function tiemposPromedio(Request $request, Response $response)
    {
        return $response->json([
            'status' => 'success',
            'data'   => $this->service->getTiemposPromedio()
        ]);
    }

    public function tabular(Request $request, Response $response)
    {
        $limit = (int)($request->query('limit', 200));
        return $response->json([
            'status' => 'success',
            'data'   => $this->service->getTabular($limit)
        ]);
    }

    public function kpis(Request $request, Response $response)
    {
        return $response->json([
            'status' => 'success',
            'data'   => $this->service->getKpis()
        ]);
    }
}
