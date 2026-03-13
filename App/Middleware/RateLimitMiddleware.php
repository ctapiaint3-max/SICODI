<?php
namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

/**
 * RateLimitMiddleware — límite de peticiones por IP (en memoria con APCu o fallback en archivo)
 */
class RateLimitMiddleware
{
    private int $maxRequests;
    private int $windowSeconds;
    private string $cacheDir;

    public function __construct(int $maxRequests = 60, int $windowSeconds = 60)
    {
        $this->maxRequests   = $maxRequests;
        $this->windowSeconds = $windowSeconds;
        $this->cacheDir      = sys_get_temp_dir() . '/sicodi_ratelimit/';
        if (!is_dir($this->cacheDir)) @mkdir($this->cacheDir, 0700, true);
    }

    public function handle(Request $request, Response $response, callable $next): mixed
    {
        $ip  = $request->ip();
        $key = 'rl_' . md5($ip);

        [$count, $reset] = $this->getCounter($key);

        if ($count >= $this->maxRequests) {
            $response->setHeader('Retry-After', (string)($reset - time()));
            return $response->json([
                'status'  => 'error',
                'message' => 'Demasiadas peticiones. Intente de nuevo en ' . ($reset - time()) . ' segundos.'
            ], 429)->send();
        }

        $this->incrementCounter($key, $count, $reset);
        $response->setHeader('X-RateLimit-Limit',     (string)$this->maxRequests);
        $response->setHeader('X-RateLimit-Remaining', (string)($this->maxRequests - $count - 1));

        return $next($request, $response);
    }

    private function getCounter(string $key): array
    {
        $file = $this->cacheDir . $key . '.json';
        if (!file_exists($file)) return [0, time() + $this->windowSeconds];
        $data = json_decode(file_get_contents($file), true);
        if (!$data || $data['reset'] < time()) return [0, time() + $this->windowSeconds];
        return [$data['count'], $data['reset']];
    }

    private function incrementCounter(string $key, int $count, int $reset): void
    {
        file_put_contents(
            $this->cacheDir . $key . '.json',
            json_encode(['count' => $count + 1, 'reset' => $reset])
        );
    }
}
