<?php

namespace App\Core;

use Exception;
use ReflectionClass;
use ReflectionException;

class Container
{
    private array $instances = [];
    private array $bindings = [];

    /**
     * Bind an abstract class or interface to a concrete implementation.
     */
    public function bind(string $abstract, $concrete = null): void
    {
        if ($concrete === null) {
            $concrete = $abstract;
        }
        $this->bindings[$abstract] = $concrete;
    }

    /**
     * Bind a concrete implementation as a singleton.
     */
    public function singleton(string $abstract, $concrete = null): void
    {
        $this->bind($abstract, $concrete);
        // We will cache it on resolve
        $this->instances[$abstract] = null;
    }

    /**
     * Resolve a class from the container, injecting dependencies automatically.
     */
    public function make(string $abstract)
    {
        // Return existing singleton instance if exists
        if (array_key_exists($abstract, $this->instances) && $this->instances[$abstract] !== null) {
            return $this->instances[$abstract];
        }

        $concrete = $this->bindings[$abstract] ?? $abstract;

        // If the concrete is a closure, execute it
        if ($concrete instanceof \Closure) {
            $object = $concrete($this);
        } else {
            $object = $this->build($concrete);
        }

        // Cache the instance if it was binded as a singleton
        if (array_key_exists($abstract, $this->instances)) {
            $this->instances[$abstract] = $object;
        }

        return $object;
    }

    /**
     * Build an instance of a concrete class, resolving dependencies via reflection.
     */
    private function build(string $concrete)
    {
        try {
            $reflector = new ReflectionClass($concrete);
            
            if (!$reflector->isInstantiable()) {
                throw new Exception("Class {$concrete} is not instantiable.");
            }

            $constructor = $reflector->getConstructor();

            if (is_null($constructor)) {
                return new $concrete;
            }

            $parameters = $constructor->getParameters();
            $dependencies = $this->resolveDependencies($parameters);

            return $reflector->newInstanceArgs($dependencies);
        } catch (ReflectionException $e) {
            throw new Exception("Failed to build {$concrete}: " . $e->getMessage());
        }
    }

    /**
     * Resolve the dependencies from the Reflection parameters.
     */
    private function resolveDependencies(array $parameters): array
    {
        $dependencies = [];

        foreach ($parameters as $parameter) {
            $type = $parameter->getType();
            if (!$type || $type->isBuiltin()) {
                if ($parameter->isDefaultValueAvailable()) {
                    $dependencies[] = $parameter->getDefaultValue();
                } else {
                    throw new Exception("Unresolvable primitive dependency in parameter {$parameter->name}");
                }
            } else {
                $dependencies[] = $this->make($type->getName());
            }
        }

        return $dependencies;
    }
}
