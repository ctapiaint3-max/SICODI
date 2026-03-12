<?php
namespace App\Models;

/**
 * Modelo base — hydratación desde array DB, serialización a JSON
 */
abstract class BaseModel
{
    protected array $attributes = [];
    protected array $fillable   = [];
    protected array $hidden     = [];

    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
    }

    public function fill(array $data): static
    {
        foreach ($data as $key => $value) {
            if (empty($this->fillable) || in_array($key, $this->fillable)) {
                $this->attributes[$key] = $value;
            }
        }
        return $this;
    }

    public function __get(string $key): mixed
    {
        return $this->attributes[$key] ?? null;
    }

    public function __set(string $key, mixed $value): void
    {
        $this->attributes[$key] = $value;
    }

    public function __isset(string $key): bool
    {
        return isset($this->attributes[$key]);
    }

    public function toArray(): array
    {
        $arr = $this->attributes;
        foreach ($this->hidden as $h) {
            unset($arr[$h]);
        }
        return $arr;
    }

    public static function hydrate(array $rows): array
    {
        return array_map(fn($row) => new static($row), $rows);
    }
}
