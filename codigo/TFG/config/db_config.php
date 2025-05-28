<?php
// config/db_config.php

// Configuración para la conexión a la base de datos
define('DB_HOST', 'localhost');        // Direccion de servidor al que te conectas
define('DB_NAME', 'sergisaiz_CookSocial'); // Nombre de tu base de datos
define('DB_USER', 'sergisaiz_sergisaiz');    // Nombre de usuario de MySQL
define('DB_PASS', 'Alumno1234');  // Contraseña de MySQL
define('DB_CHARSET', 'utf8mb4');        // Juego de caracteres recomendado

// Opciones de PDO (opcional pero útil)
$pdo_options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanzar excepciones en errores
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devolver resultados como arrays por defecto
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Usar preparaciones nativas del SGBD (más seguro)
];

// DSN (Data Source Name) para PDO
$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;

?>