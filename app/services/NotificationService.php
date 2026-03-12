<?php
namespace App\Services;

use App\Core\Database;
use Exception;
use PDO;

/**
 * NotificationService — notificaciones in-app para usuarios
 */
class NotificationService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Crea una notificación para un usuario
     */
    public function crear(int $userId, string $tipo, string $titulo, string $mensaje = '', ?string $urlAccion = null): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO notifications (user_id, tipo, titulo, mensaje, url_accion)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $tipo, $titulo, $mensaje, $urlAccion]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Obtiene notificaciones no leídas de un usuario
     */
    public function getNoLeidas(int $userId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT id, tipo, titulo, mensaje, url_accion, created_at
                 FROM notifications
                 WHERE user_id = ? AND leida = 0
                 ORDER BY created_at DESC
                 LIMIT 50'
            );
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            return $this->mockNotifications();
        }
    }

    /**
     * Cuenta notificaciones no leídas
     */
    public function countNoLeidas(int $userId): int
    {
        try {
            $stmt = $this->db->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND leida = 0');
            $stmt->execute([$userId]);
            return (int)$stmt->fetchColumn();
        } catch (Exception $e) {
            return 3; // Mock demo
        }
    }

    /**
     * Marca una notificación como leída
     */
    public function marcarLeida(int $notificationId, int $userId): void
    {
        $this->db->prepare(
            'UPDATE notifications SET leida = 1, read_at = NOW() WHERE id = ? AND user_id = ?'
        )->execute([$notificationId, $userId]);
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    public function marcarTodasLeidas(int $userId): void
    {
        $this->db->prepare(
            'UPDATE notifications SET leida = 1, read_at = NOW() WHERE user_id = ? AND leida = 0'
        )->execute([$userId]);
    }

    /**
     * Envía notificación de tarea asignada
     */
    public function notificarTareaAsignada(int $userId, string $expedienteCodigo, string $tituloTarea): void
    {
        $this->crear(
            $userId,
            'TAREA',
            "Nueva tarea asignada — {$expedienteCodigo}",
            $tituloTarea,
            "/bandeja"
        );
    }

    /**
     * Envía alerta de SLA próximo a vencer
     */
    public function notificarSlaProximo(int $userId, string $expedienteCodigo, string $semaforo): void
    {
        $titulo = $semaforo === 'ROJO'
            ? "⛔ SLA VENCIDO — {$expedienteCodigo}"
            : "⚠️ SLA próximo a vencer — {$expedienteCodigo}";
        $this->crear($userId, 'SLA', $titulo, 'Revise el expediente urgentemente.', "/expedientes");
    }

    private function mockNotifications(): array
    {
        return [
            ['id'=>1,'tipo'=>'TAREA','titulo'=>'Nueva tarea asignada — EXP-2026-00001','mensaje'=>'Revisar documentación','url_accion'=>'/bandeja','created_at'=>date('Y-m-d H:i:s',strtotime('-1 hour'))],
            ['id'=>2,'tipo'=>'SLA','titulo'=>'⚠️ SLA próximo a vencer — EXP-2026-00002','mensaje'=>'Quedan 5 horas','url_accion'=>'/expedientes','created_at'=>date('Y-m-d H:i:s',strtotime('-30 minutes'))],
            ['id'=>3,'tipo'=>'INFO','titulo'=>'Sistema SICODI actualizado','mensaje'=>'Nueva versión disponible','url_accion'=>null,'created_at'=>date('Y-m-d H:i:s',strtotime('-2 hours'))],
        ];
    }
}
