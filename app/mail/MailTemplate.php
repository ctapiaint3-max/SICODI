<?php
namespace App\Mail;

/**
 * MailTemplate — renderiza templates HTML de correo institucional
 */
class MailTemplate
{
    private string $templateDir;

    public function __construct()
    {
        $this->templateDir = __DIR__ . '/templates/';
    }

    /**
     * Genera el HTML de notificación de tarea asignada
     */
    public function tareaAsignada(string $funcionarioNombre, string $expedienteCodigo, string $tituloTarea, string $prioridad = 'NORMAL', ?string $urlAccion = null): string
    {
        $badge    = strtolower($prioridad);
        $url      = $urlAccion ?? 'http://localhost:3000/bandeja';
        $content  = "
            <h2>Nueva tarea asignada</h2>
            <p>Estimado/a <strong>{$funcionarioNombre}</strong>,</p>
            <p>Se le ha asignado una nueva tarea en el sistema SICODI que requiere su atención.</p>
            <div class='info-box'>
                <p><strong>Expediente:</strong> {$expedienteCodigo}</p>
                <p><strong>Tarea:</strong> {$tituloTarea}</p>
                <p><strong>Prioridad:</strong> <span class='badge {$badge}'>{$prioridad}</span></p>
            </div>
            <p>Por favor, ingrese al sistema para procesar el trámite antes de su vencimiento.</p>
            <a href='{$url}' class='btn'>Ver mi bandeja de tareas →</a>
        ";
        return $this->render('Nueva tarea asignada — SICODI', $content);
    }

    /**
     * Genera el HTML de alerta SLA
     */
    public function alertaSla(string $funcionarioNombre, string $expedienteCodigo, string $semaforo, string $horasRestantes = ''): string
    {
        $emoji  = $semaforo === 'ROJO' ? '⛔' : '⚠️';
        $msg    = $semaforo === 'ROJO'
            ? 'El expediente ha <strong>superado el tiempo límite</strong> de atención institucional.'
            : "El expediente tiene <strong>{$horasRestantes}</strong> antes de vencer el SLA.";
        $content = "
            <h2>{$emoji} Alerta de SLA — {$expedienteCodigo}</h2>
            <p>Estimado/a <strong>{$funcionarioNombre}</strong>,</p>
            <p>{$msg}</p>
            <div class='info-box'>
                <p><strong>Expediente:</strong> {$expedienteCodigo}</p>
                <p><strong>Estado SLA:</strong> <span class='badge alta'>{$semaforo}</span></p>
            </div>
            <p>Tome acción inmediata para evitar incumplimiento institucional.</p>
            <a href='http://localhost:3000/expedientes' class='btn'>Ver expediente →</a>
        ";
        return $this->render("{$emoji} Alerta SLA — {$expedienteCodigo}", $content);
    }

    /**
     * Genera el HTML de notificación general
     */
    public function notificacionGeneral(string $titulo, string $mensaje, ?string $urlAccion = null): string
    {
        $btnHtml = $urlAccion ? "<a href='{$urlAccion}' class='btn'>Ver en SICODI →</a>" : '';
        $content = "
            <h2>{$titulo}</h2>
            <p>{$mensaje}</p>
            {$btnHtml}
        ";
        return $this->render($titulo, $content);
    }

    private function render(string $subject, string $content): string
    {
        $base = file_exists($this->templateDir . 'base.html')
            ? file_get_contents($this->templateDir . 'base.html')
            : $this->defaultBase();

        return str_replace(
            ['{{SUBJECT}}', '{{CONTENT}}', '{{YEAR}}'],
            [$subject, $content, date('Y')],
            $base
        );
    }

    private function defaultBase(): string
    {
        return '<html><body><h2>{{SUBJECT}}</h2>{{CONTENT}}<p>© {{YEAR}} SICODI</p></body></html>';
    }
}
