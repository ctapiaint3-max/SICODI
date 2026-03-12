<?php

namespace App\Core;

class Router
{
    private array $routes = [];
    private array $globalMiddlewares = [];

    public function get(string $path, array|callable $handler, array $middlewares = []): void
    {
        $this->addRoute('GET', $path, $handler, $middlewares);
    }

    public function post(string $path, array|callable $handler, array $middlewares = []): void
    {
        $this->addRoute('POST', $path, $handler, $middlewares);
    }

    public function put(string $path, array|callable $handler, array $middlewares = []): void
    {
        $this->addRoute('PUT', $path, $handler, $middlewares);
    }

    public function delete(string $path, array|callable $handler, array $middlewares = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $middlewares);
    }

    private function addRoute(string $method, string $path, array|callable $handler, array $middlewares): void
    {
        // Convert route parameters like {id} to regex named groups
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<\1>[a-zA-Z0-9_-]+)', $path);
        
        // Escape forward slashes
        $pattern = str_replace('/', '\/', $pattern);
        
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'pattern' => '/^' . $pattern . '$/',
            'handler' => $handler,
            'middlewares' => $middlewares
        ];
    }
    
    public function addGlobalMiddleware(callable|string|array $middleware): void
    {
        $this->globalMiddlewares[] = $middleware;
    }

    public function dispatch(Request $request, Response $response): void
    {
        $method = $request->method();
        $uri = rtrim($request->uri(), '/') ?: '/';

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $uri, $matches)) {
                
                // Extract named parameters from regex matches
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                
                // Execute global middlewares
                foreach ($this->globalMiddlewares as $middleware) {
                    $this->executeMiddleware($middleware, $request, $response);
                }

                // Execute route specific middlewares
                foreach ($route['middlewares'] as $middleware) {
                    $this->executeMiddleware($middleware, $request, $response);
                }

                // Execute the handler
                $handler = $route['handler'];
                
                if (is_callable($handler)) {
                    $result = call_user_func_array($handler, array_merge([$request, $response], array_values($params)));
                } elseif (is_array($handler) && count($handler) === 2) {
                    $controllerName = $handler[0];
                    $methodName = $handler[1];
                    
                    if (class_exists($controllerName)) {
                        $controller = new $controllerName();
                        if (method_exists($controller, $methodName)) {
                            $result = call_user_func_array([$controller, $methodName], array_merge([$request, $response], array_values($params)));
                        } else {
                            $response->json(['error' => "Method $methodName not found in $controllerName"], 500)->send();
                        }
                    } else {
                        $response->json(['error' => "Controller $controllerName not found"], 500)->send();
                    }
                } else {
                    $response->json(['error' => 'Invalid route handler format'], 500)->send();
                }

                // If handler returned response, send it
                if ($result instanceof Response) {
                    $result->send();
                }
                
                return;
            }
        }

        // If no route matched
        $response->json(['error' => 'Not Found', 'path' => $uri], 404)->send();
    }
    
    private function executeMiddleware($middleware, Request $request, Response $response): void
    {
         if (is_callable($middleware)) {
             $middleware($request, $response);
         } elseif (is_string($middleware) && class_exists($middleware)) {
             $instance = new $middleware();
             if (method_exists($instance, 'handle')) {
                 $instance->handle($request, $response);
             }
         }
    }
}
