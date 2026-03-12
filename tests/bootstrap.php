<?php
// tests/bootstrap.php
require_once __DIR__ . '/../app/core/Container.php';
require_once __DIR__ . '/../app/core/Database.php';

// Set test environment configuration
putenv('DB_HOST=127.0.0.1');
putenv('DB_NAME=sigdi_test');
putenv('DB_USER=root');
putenv('DB_PASS=');
putenv('APP_ENV=testing');

echo "SICODI PHPUnit Test Environment Initialized.\n";
