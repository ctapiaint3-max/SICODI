<?php
$data = json_encode([
    'registro' => 'EXTERNO',
    'clasificacion' => 'Ordinario',
    'tipo_documento' => 'Oficio',
    'numero_documento' => '123',
    'mando_que_gira' => 'Ministerio',
    'asunto' => 'Prueba',
    'area_destino_id' => 1
]);

$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n" .
                     "Accept: application/json\r\n",
        'content' => $data,
        'ignore_errors' => true // This is key to reading 500 responses
    ]
];

$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:8000/api/registro/recepcionar', false, $context);
echo $result;
