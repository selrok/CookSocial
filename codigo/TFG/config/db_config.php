<?php
// config/db_config.php

// Configuración para la conexión a la base de datos
define('DB_HOST', 'localhost');        // O la IP de tu servidor MySQL si es remoto
define('DB_NAME', 'sergisaiz_CookSocial'); // El nombre de tu base de datos
define('DB_USER', 'sergisaiz_sergisaiz');    // Tu nombre de usuario de MySQL
define('DB_PASS', 'Alumno1234');  // Tu contraseña de MySQL
define('DB_CHARSET', 'utf8mb4');        // Juego de caracteres recomendado

// Opciones de PDO (opcional pero útil)
$pdo_options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanzar excepciones en errores
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devolver resultados como arrays asociativos por defecto
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Usar preparaciones nativas del SGBD (más seguro)
];

// DSN (Data Source Name) para PDO
$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;

?>