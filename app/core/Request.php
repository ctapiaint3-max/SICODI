<?php

namespace App\Core;

class Request
{
    private array $data = [];
    private array $query = [];
    private string $method;
    private string $uri;
    private array $attributes = [];

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // Extract basic URI without query string
        $uriStr = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uriStr, PHP_URL_PATH);
        $this->uri = rtrim($path, '/') ?: '/';
        
        // Parse incoming data
        $this->query = $_GET;
        
        if ($this->method === 'POST' || $this->method === 'PUT' || $this->method === 'PATCH') {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            if (str_contains($contentType, 'application/json')) {
                $rawBody = file_get_contents('php://input');
                $decoded = json_decode($rawBody, true);
                if (is_array($decoded)) {
                    $this->data = $decoded;
                }
            } else {
                $this->data = $_POST;
            }
        }
    }

    public function method(): string
    {
        return $this->method;
    }

    public function uri(): string
    {
        return $this->uri;
    }

    public function all(): array
    {
        return $this->data;
    }

    public function get(string $key, $default = null)
    {
        return $this->data[$key] ?? $default;
    }
    
    public function query(string $key, $default = null)
    {
        return $this->query[$key] ?? $default;
    }

    public function setAttribute(string $key, mixed $value): self
    {
        $this->attributes[$key] = $value;
        return $this;
    }

    public function getAttribute(string $key, mixed $default = null)
    {
        return $this->attributes[$key] ?? $default;
    }

    public function headers(): array
    {
        if (function_exists('getallheaders')) {
            return getallheaders();
        }
        
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (str_starts_with($name, 'HTTP_')) {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }

    public function header(string $key, $default = null)
    {
        $headers = $this->headers();
        $normalizedKey = str_replace(' ', '-', ucwords(strtolower(str_replace('-', ' ', $key))));
        return $headers[$normalizedKey] ?? $headers[strtolower($key)] ?? $default;
    }
}
