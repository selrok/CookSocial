<?php
// TFG/api/users.php

// Iniciar sesión AL PRINCIPIO, ya que vamos a loguear al usuario tras el registro.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // En producción, especifica tu dominio frontend exacto
header('Access-Control-Allow-Methods: POST, OPTIONS'); // Solo POST para registro, OPTIONS para pre-flight
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true'); // Importante para cookies de sesión con AJAX

// Incluir el archivo de conexión a la base de datos
require_once __DIR__ . '/../config/db_connection.php'; // $pdo estará disponible

// Manejar peticiones OPTIONS (pre-flight requests para CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => '', 'data' => null];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // --- SECCIÓN: REGISTRAR UN NUEVO USUARIO ---

    // Obtener datos del request (asumimos JSON)
    $inputJSON = file_get_contents('php://input');
    $data = json_decode($inputJSON, true);

    // Validar si el JSON es válido
    if (json_last_error() !== JSON_ERROR_NONE || $data === null) {
        $response['message'] = 'Error: JSON inválido o no proporcionado.';
        http_response_code(400); // Bad Request
        echo json_encode($response);
        exit;
    }

    // --- SECCIÓN: OBTENER Y VALIDAR DATOS DE ENTRADA ---
    // Campos requeridos del JSON
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? ''; // No trimear contraseña directamente

    // Campos opcionales del JSON
    $nombre_completo = isset($data['nombre_completo']) ? trim($data['nombre_completo']) : null;
    // avatar_url y bio se insertarán como NULL por defecto en este punto.

    // Rol por defecto para nuevos usuarios (VERIFICA ESTE ID EN TU TABLA 'roles')
    $id_rol_defecto = 3; // Asume que 3 es el ID para 'Usuario'.

    // Validaciones de campos básicos
    if (empty($username) || empty($email) || empty($password)) {
        $response['message'] = 'Nombre de usuario, email y contraseña son requeridos.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Formato de email inválido.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }

    if (strlen($password) < 8) { // Ejemplo de política de contraseña (ajusta según necesidad)
        $response['message'] = 'La contraseña debe tener al menos 8 caracteres.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }
    // Aquí podrías añadir más validaciones de fortaleza de contraseña si lo deseas en el backend también.
    
    if ($nombre_completo !== null && (strlen($nombre_completo) < 2 || strlen($nombre_completo) > 100)) {
        $response['message'] = 'El nombre completo, si se proporciona, debe tener entre 2 y 100 caracteres.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }

    try {
        // Asegurar que la conexión PDO está disponible
        if (!$pdo) {
            throw new Exception("Error crítico: Conexión a la base de datos no disponible.");
        }

        // --- SECCIÓN: VERIFICAR UNICIDAD DE USERNAME Y EMAIL ---
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = :username");
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        if ($stmt->fetch()) {
            $response['message'] = 'El nombre de usuario ya está en uso.';
            http_response_code(409); // Conflict
            echo json_encode($response);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        if ($stmt->fetch()) {
            $response['message'] = 'El email ya está registrado.';
            http_response_code(409); // Conflict
            echo json_encode($response);
            exit;
        }

        // --- SECCIÓN: HASHEAR CONTRASEÑA E INSERTAR USUARIO ---
        $password_hash = password_hash($password, PASSWORD_DEFAULT); // O PASSWORD_BCRYPT

        $sql = "INSERT INTO usuarios (username, email, password_hash, nombre_completo, id_rol, avatar_url, bio) 
                VALUES (:username, :email, :password_hash, :nombre_completo, :id_rol, NULL, NULL)"; // avatar_url y bio son NULL inicialmente
        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password_hash', $password_hash);
        $stmt->bindParam(':nombre_completo', $nombre_completo); // Se insertará NULL si $nombre_completo es null
        $stmt->bindParam(':id_rol', $id_rol_defecto, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            $newUserId = $pdo->lastInsertId();

            // --- SECCIÓN: INICIO DE SESIÓN AUTOMÁTICO DESPUÉS DEL REGISTRO ---
            session_regenerate_id(true); // Previene fijación de sesión

            $_SESSION['user_id'] = (int)$newUserId; // Guardar como entero
            $_SESSION['username'] = $username;
            $_SESSION['email'] = $email;
            $_SESSION['nombre_completo'] = $nombre_completo;
            $_SESSION['id_rol'] = (int)$id_rol_defecto; // Guardar como entero
            $_SESSION['avatar_url'] = null; // Avatar es NULL al registrar

            $response['success'] = true;
            $response['message'] = 'Usuario registrado e sesión iniciada exitosamente.';
            $response['data'] = [ // Datos a devolver al frontend
                'id' => (int)$newUserId, 
                'username' => $username, 
                'email' => $email, 
                'nombre_completo' => $nombre_completo,
                'id_rol' => (int)$id_rol_defecto,
                'avatar_url' => null
            ];
            http_response_code(201); // Created
        } else {
            $response['message'] = 'Error al registrar el usuario en la base de datos.';
            http_response_code(500); // Internal Server Error
        }

    } catch (PDOException $e) {
        error_log("API DB Error (users.php POST): " . $e->getMessage() . " Input Data: " . $inputJSON);
        $response['message'] = 'Error de base de datos al procesar el registro.'; // Mensaje genérico en producción
        // $response['message'] = 'Error de base de datos: ' . $e->getMessage(); // Más detalle en desarrollo
        http_response_code(500);
    } catch (Exception $e) {
        error_log("API General Error (users.php POST): " . $e->getMessage());
        $response['message'] = 'Error general en el servidor durante el registro.';
        http_response_code(500);
    }

} else {
    // Solo se permite el método POST para este endpoint (registro)
    $response['message'] = "Método '$method' no implementado. Use POST para registrar.";
    http_response_code(405); // Method Not Allowed
}

echo json_encode($response);
exit;
?>