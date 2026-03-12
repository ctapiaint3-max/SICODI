<?php

namespace App\Core;

class Response
{
    private int $statusCode = 200;
    private array $headers = [];
    private $content = '';

    public function setStatusCode(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function setHeader(string $key, string $value): self
    {
        $this->headers[$key] = $value;
        return $this;
    }

    public function json($data, int $statusCode = 200): self
    {
        $this->statusCode = $statusCode;
        $this->setHeader('Content-Type', 'application/json; charset=utf-8');
        $this->content = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this;
    }

    public function html(string $html, int $statusCode = 200): self
    {
        $this->statusCode = $statusCode;
        $this->setHeader('Content-Type', 'text/html; charset=utf-8');
        $this->content = $html;
        return $this;
    }

    public function send(): void
    {
        if (!headers_sent()) {
            http_response_code($this->statusCode);
            foreach ($this->headers as $key => $value) {
                header("$key: $value");
            }
        }
        
        echo $this->content;
        exit;
    }
}
