<?php
namespace App\Security;

/**
 * PasswordPolicy — valida y aplica política de contraseñas institucional
 */
class PasswordPolicy
{
    private const MIN_LENGTH  = 8;
    private const REQUIRE_UPPER  = true;
    private const REQUIRE_LOWER  = true;
    private const REQUIRE_NUMBER = true;
    private const REQUIRE_SPECIAL = false; // Opcional para intranet

    /**
     * Valida que una contraseña cumpla la política
     * @throws \InvalidArgumentException con el mensaje de error
     */
    public static function validate(string $password): void
    {
        $errors = [];

        if (strlen($password) < self::MIN_LENGTH) {
            $errors[] = 'Mínimo ' . self::MIN_LENGTH . ' caracteres.';
        }
        if (self::REQUIRE_UPPER && !preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Debe contener al menos una letra mayúscula.';
        }
        if (self::REQUIRE_LOWER && !preg_match('/[a-z]/', $password)) {
            $errors[] = 'Debe contener al menos una letra minúscula.';
        }
        if (self::REQUIRE_NUMBER && !preg_match('/[0-9]/', $password)) {
            $errors[] = 'Debe contener al menos un número.';
        }
        if (self::REQUIRE_SPECIAL && !preg_match('/[\W_]/', $password)) {
            $errors[] = 'Debe contener al menos un carácter especial.';
        }

        if (!empty($errors)) {
            throw new \InvalidArgumentException(implode(' ', $errors));
        }
    }

    /**
     * Genera hash seguro bcrypt
     */
    public static function hash(string $password): string
    {
        self::validate($password);
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verifica hash
     */
    public static function verify(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Indica si el hash debe ser rehashed (costo más alto disponible)
     */
    public static function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => 12]);
    }
}
