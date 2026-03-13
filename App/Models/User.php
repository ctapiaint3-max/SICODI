<?php
namespace App\Models;

class User extends BaseModel
{
    protected array $fillable = [
        'id','username','email','full_name','area_id','status',
        'last_login_at','created_at','updated_at','password_hash'
    ];
    protected array $hidden = ['password_hash'];

    public function isActive(): bool
    {
        return ($this->attributes['status'] ?? '') === 'ACTIVE';
    }

    public function hasRole(string $roleCode, array $roles): bool
    {
        foreach ($roles as $r) {
            if (($r['code'] ?? '') === $roleCode) return true;
        }
        return false;
    }
}
