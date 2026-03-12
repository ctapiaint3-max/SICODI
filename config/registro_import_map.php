<?php

return [
    // Row index to start reading data (1-based). Row 1 contains partial headers in the XLSX.
    'start_row' => 2,

    // Column-to-field mapping for BASE CORREO 2026.xlsx (A-J)
    // Adjust this map if the source file changes.
    'columns' => [
        'A' => ['field' => 'mando_que_gira', 'type' => 'string'],
        'B' => ['field' => 'fecha_recepcion', 'type' => 'date_excel'],
        'C' => ['field' => 'numero_programa_incogmar', 'type' => 'string'],
        'D' => ['field' => 'tipo_documento', 'type' => 'string'],
        'E' => ['field' => 'clasificacion', 'type' => 'string'],
        'F' => ['field' => 'numero_documento', 'type' => 'string'],
        'G' => ['field' => 'fecha_documento', 'type' => 'date_excel'],
        'H' => ['field' => 'registro', 'type' => 'string'],
        'I' => ['field' => 'asunto', 'type' => 'string'],
        'J' => ['field' => 'tramite', 'type' => 'string'],
    ],
];
