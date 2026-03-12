<?php

declare(strict_types=1);

function usage(): void
{
    $msg = <<<TXT
Usage:
  php scripts/import_registro.php --file <path> --dsn <dsn> --user <user> --pass <pass> [--map <path>] [--usuario <id>] [--expediente <id>] [--dry-run]

Examples:
  php scripts/import_registro.php --file "C:\\data\\BASE CORREO 2026.xlsx" --dsn "mysql:host=localhost;dbname=sigdi;charset=utf8mb4" --user root --pass secret
  php scripts/import_registro.php --file "C:\\data\\registro.csv" --dsn "mysql:host=localhost;dbname=sigdi;charset=utf8mb4" --user root --pass secret --dry-run
TXT;
    fwrite(STDERR, $msg . PHP_EOL);
}

function parseArgs(array $argv): array
{
    $args = [];
    for ($i = 1; $i < count($argv); $i++) {
        $key = $argv[$i];
        if (substr($key, 0, 2) === '--') {
            $name = substr($key, 2);
            $value = true;
            if (isset($argv[$i + 1]) && substr($argv[$i + 1], 0, 2) !== '--') {
                $value = $argv[$i + 1];
                $i++;
            }
            $args[$name] = $value;
        }
    }
    return $args;
}

function colLetterToIndex(string $col): int
{
    $col = strtoupper($col);
    $sum = 0;
    for ($i = 0; $i < strlen($col); $i++) {
        $sum = $sum * 26 + (ord($col[$i]) - 64);
    }
    return $sum - 1;
}

function excelDateToYmd($value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_numeric($value)) {
        return (string)$value;
    }
    $days = (int)round((float)$value);
    $unix = ($days - 25569) * 86400;
    if ($unix <= 0) {
        return null;
    }
    return gmdate('Y-m-d', $unix);
}

function normalizeValue($raw, string $type): ?string
{
    if ($raw === null) {
        return null;
    }
    $raw = is_string($raw) ? trim($raw) : $raw;
    if ($raw === '') {
        return null;
    }
    if ($type === 'date_excel') {
        return excelDateToYmd($raw);
    }
    return (string)$raw;
}

function detectDelimiter(string $line): string
{
    $delims = [',' => substr_count($line, ','), ';' => substr_count($line, ';'), "\t" => substr_count($line, "\t")];
    arsort($delims);
    return (string)array_key_first($delims);
}

function readCsvRows(string $path, array $columns, int $startRow): iterable
{
    $fh = fopen($path, 'r');
    if ($fh === false) {
        throw new RuntimeException('Unable to open CSV file');
    }
    $firstLine = fgets($fh);
    if ($firstLine === false) {
        fclose($fh);
        return;
    }
    $delimiter = detectDelimiter($firstLine);
    rewind($fh);

    $rowIndex = 0;
    while (($row = fgetcsv($fh, 0, $delimiter)) !== false) {
        $rowIndex++;
        if ($rowIndex < $startRow) {
            continue;
        }
        $data = [];
        foreach ($columns as $colLetter => $_meta) {
            $idx = colLetterToIndex($colLetter);
            $data[$colLetter] = $row[$idx] ?? null;
        }
        yield $rowIndex => $data;
    }
    fclose($fh);
}

function readXlsxRows(string $path): iterable
{
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) {
        throw new RuntimeException('Unable to open XLSX file');
    }

    $sharedStrings = [];
    $ssIndex = $zip->locateName('xl/sharedStrings.xml');
    if ($ssIndex !== false) {
        $ssXml = simplexml_load_string($zip->getFromIndex($ssIndex));
        if ($ssXml && isset($ssXml->si)) {
            foreach ($ssXml->si as $si) {
                if (isset($si->t)) {
                    $sharedStrings[] = (string)$si->t;
                } elseif (isset($si->r)) {
                    $text = '';
                    foreach ($si->r as $r) {
                        $text .= (string)$r->t;
                    }
                    $sharedStrings[] = $text;
                } else {
                    $sharedStrings[] = '';
                }
            }
        }
    }

    $sheetName = 'xl/worksheets/sheet1.xml';
    $sheetIndex = $zip->locateName($sheetName);
    if ($sheetIndex === false) {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (strpos($name, 'xl/worksheets/sheet') === 0) {
                $sheetIndex = $i;
                break;
            }
        }
    }
    if ($sheetIndex === false) {
        $zip->close();
        throw new RuntimeException('No worksheet found in XLSX');
    }

    $sheetXml = simplexml_load_string($zip->getFromIndex($sheetIndex));
    $zip->close();

    if (!$sheetXml || !isset($sheetXml->sheetData->row)) {
        return;
    }

    foreach ($sheetXml->sheetData->row as $row) {
        $rowIndex = (int)$row['r'];
        $data = [];
        foreach ($row->c as $c) {
            $ref = (string)$c['r'];
            $col = preg_replace('/\d+/', '', $ref);
            $type = (string)$c['t'];
            $value = null;
            if ($type === 's') {
                $idx = (int)$c->v;
                $value = $sharedStrings[$idx] ?? '';
            } elseif ($type === 'inlineStr') {
                $value = (string)$c->is->t;
            } else {
                $value = isset($c->v) ? (string)$c->v : '';
            }
            $data[$col] = $value;
        }
        yield $rowIndex => $data;
    }
}

$args = parseArgs($argv);
if (!isset($args['file'], $args['dsn'], $args['user'], $args['pass'])) {
    usage();
    exit(1);
}

$file = (string)$args['file'];
if (!file_exists($file)) {
    fwrite(STDERR, 'File not found: ' . $file . PHP_EOL);
    exit(1);
}

$mapPath = $args['map'] ?? (__DIR__ . '/../config/registro_import_map.php');
if (!file_exists($mapPath)) {
    fwrite(STDERR, 'Map config not found: ' . $mapPath . PHP_EOL);
    exit(1);
}

$config = require $mapPath;
$columns = $config['columns'] ?? [];
$startRow = (int)($config['start_row'] ?? 2);

$pdo = new PDO($args['dsn'], $args['user'], $args['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$insertFields = [];
foreach ($columns as $meta) {
    $insertFields[] = $meta['field'];
}
$insertFields[] = 'usuario_registro';
$insertFields[] = 'expediente_id';

$placeholders = implode(',', array_fill(0, count($insertFields), '?'));
$sql = 'INSERT INTO registro_documental (' . implode(',', $insertFields) . ') VALUES (' . $placeholders . ')';
$stmt = $pdo->prepare($sql);

$usuario = isset($args['usuario']) ? (int)$args['usuario'] : null;
$expediente = isset($args['expediente']) ? (int)$args['expediente'] : null;
$dryRun = isset($args['dry-run']);

$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
$rows = ($ext === 'xlsx') ? readXlsxRows($file) : readCsvRows($file, $columns, $startRow);

$inserted = 0;
foreach ($rows as $rowIndex => $rowData) {
    if ($rowIndex < $startRow) {
        continue;
    }
    $values = [];
    $allEmpty = true;
    foreach ($columns as $colLetter => $meta) {
        $raw = $rowData[$colLetter] ?? null;
        $val = normalizeValue($raw, $meta['type']);
        if ($val !== null && $val !== '') {
            $allEmpty = false;
        }
        $values[] = $val;
    }
    if ($allEmpty) {
        continue;
    }
    $values[] = $usuario;
    $values[] = $expediente;

    if ($dryRun) {
        fwrite(STDOUT, 'Row ' . $rowIndex . ': ' . json_encode($values, JSON_UNESCAPED_UNICODE) . PHP_EOL);
        continue;
    }

    $stmt->execute($values);
    $inserted++;
}

fwrite(STDOUT, 'Done. Inserted rows: ' . $inserted . PHP_EOL);
