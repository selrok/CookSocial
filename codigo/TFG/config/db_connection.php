<?php
// config/db_connection.php

// Incluir el archivo de configuración que está en el MISMO directorio
// __DIR__ apunta a TFG/config/
require_once __DIR__ . '/db_config.php'; // Ya no necesitas '../'

$pdo = null;

try {
    // $dsn y $pdo_options vienen de db_config.php
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $pdo_options);
    
    // Opcional: para depuración, eliminar en producción
    // echo "Conexión (desde db_connection.php) a la base de datos '" . DB_NAME . "' establecida.<br>";

} catch (PDOException $e) {
    error_log("Error de conexión a la base de datos: " . $e->getMessage() . " (DSN: $dsn, User: " . DB_USER . ")");
    // No mostrar detalles sensibles al usuario en producción
    die("Error: No se pudo conectar a la base de datos. Contacte al administrador si el problema persiste.");
}

// La variable $pdo ahora está disponible si este archivo se incluye correctamente.
?>