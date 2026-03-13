<?php

namespace App\Core;

use PDO;
use PDOException;
use Exception;

class Database
{
    private static ?PDO $pdo = null;
    private static ?Database $self = null;

    private function __construct() {}
    private function __clone() {}

    /**
     * Singleton que devuelve la instancia Database (para que ->getConnection() funcione).
     */
    public static function getInstance(): Database
    {
        if (self::$self === null) {
            self::$self = new self();
        }
        return self::$self;
    }

    /**
     * Devuelve la conexión PDO activa (singleton).
     */
    public function getConnection(): PDO
    {
        if (self::$pdo === null) {
            $host    = getenv('DB_HOST') ?: '127.0.0.1';
            $port    = getenv('DB_PORT') ?: '3306';
            $db      = getenv('DB_NAME') ?: 'sigdi';
            $user    = getenv('DB_USER') ?: 'root';
            $pass    = getenv('DB_PASS') ?: '';
            $charset = 'utf8mb4';

            $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            // TiDB Cloud (y otros servicios cloud) requieren SSL
            if (getenv('DB_SSL') === 'true') {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
                $options[PDO::MYSQL_ATTR_SSL_CA] = '';
            }

            try {
                self::$pdo = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                throw new Exception("Database connection failed. Please check configurations.");
            }
        }

        return self::$pdo;
    }

    /**
     * Backwards-compat: permitir usar Database::getInstance() directamente como PDO
     * para las clases que asignan $db = Database::getInstance();
     * Al llamar prepare/query/etc. sobre este objeto, PHP invocara __call
     * y los redirigiremos al PDO real.
     */
    public function __call(string $method, array $args): mixed
    {
        return $this->getConnection()->$method(...$args);
    }
}
