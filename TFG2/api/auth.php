<?php
// TFG/api/auth.php

// Permitir el origen específico de tu frontend
header('Access-Control-Allow-Origin: https://sergisaiz.com.es');

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');


// Iniciar la sesión AL PRINCIPIO de este script también.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// --- SECCIÓN: CONFIGURACIÓN DE CABECERAS CORS ---
// En desarrollo, puedes ser más permisivo. En producción, sé específico.
// Si tu frontend y backend están en el MISMO dominio exacto (ej. localhost sin puerto diferente),
// puede que no necesites ser tan explícito con Access-Control-Allow-Origin si withCredentials es true,
// pero es buena práctica manejarlo.

// Ejemplo para desarrollo si sirves tu frontend desde http://localhost:PUERTO o solo http://localhost
$allowed_origins = [
    'http://localhost', // Si accedes como http://localhost/TFG/logReg.html
    'http://127.0.0.1', // Si accedes como http://127.0.0.1/TFG/logReg.html
    // Añade aquí el origen específico si usas un puerto, ej: 'http://localhost:8000'
    // O el dominio de tu sitio en producción.
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
} else {
    // Fallback o si no hay HTTP_ORIGIN (peticiones del mismo servidor no lo envían)
    // Para pruebas locales si no puedes especificar el origen exacto y da problemas,
    // podrías usar header('Access-Control-Allow-Origin: *'); pero RECUERDA CAMBIARLO.
    // Sin embargo, '*' con Allow-Credentials: true es problemático.
    // Es mejor asegurarse que el origen del frontend coincida con uno en $allowed_origins.
    // Si esto falla, puedes probar temporalmente '*' PERO LAS SESIONES PUEDEN NO FUNCIONAR
    // si withCredentials:true está activo en el JS.
    // Por ahora, lo dejo así, priorizando orígenes permitidos.
    // Si el origin no está en la lista, el navegador podría bloquear.
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true'); // Clave para que las cookies de sesión se envíen/reciban con AJAX

// Incluir el archivo de conexión a la base de datos
require_once __DIR__ . '/../config/db_connection.php'; // $pdo estará disponible

$response = ['success' => false, 'message' => '', 'data' => null];
// Determinar la acción solicitada (login, logout, check_session)
$action = $_GET['action'] ?? null; 

// Manejar peticiones OPTIONS (pre-flight requests para CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- SECCIÓN: MANEJO DE PETICIONES POST (LOGIN, LOGOUT) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'login') {
        // --- SUB-SECCIÓN: INICIAR SESIÓN ---
        $inputJSON = file_get_contents('php://input');
        $data = json_decode($inputJSON, true);

        if (json_last_error() !== JSON_ERROR_NONE || $data === null) {
            $response['message'] = 'Error: JSON inválido o no proporcionado para login.';
            http_response_code(400);
            echo json_encode($response);
            exit;
        }

        $loginIdentifier = trim($data['loginIdentifier'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($loginIdentifier) || empty($password)) {
            $response['message'] = 'El identificador (usuario/email) y la contraseña son requeridos para iniciar sesión.';
            http_response_code(400);
            echo json_encode($response);
            exit;
        }

        try {
            if (!$pdo) { 
                error_log("API Auth Error (auth.php login): Conexión PDO no disponible al inicio del try.");
                throw new Exception("Conexión DB no disponible."); 
            }

            $sql = "SELECT id, username, email, password_hash, nombre_completo, id_rol, avatar_url 
                    FROM usuarios 
                    WHERE username = :identifier OR email = :identifier";
            
            $stmt = $pdo->prepare($sql);

            // ***** NUEVA VERIFICACIÓN *****
            if (!$stmt) {
                // Error al preparar la sentencia SQL. Esto es grave.
                $errorInfo = $pdo->errorInfo(); // Obtener info del error de PDO
                error_log("API DB Error (auth.php login): Fallo al PREPARAR la consulta SQL. Error PDO: " . ($errorInfo[2] ?? 'No details') . ". SQL: " . $sql);
                throw new PDOException("Error interno del servidor al preparar la solicitud de inicio de sesión. Por favor, inténtalo de nuevo más tarde."); 
            }
            // ***** FIN DE NUEVA VERIFICACIÓN *****

            $stmt->bindParam(':identifier', $loginIdentifier);
            $stmt->execute(); // execute() puede lanzar PDOException si falla, que será capturada abajo.
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password_hash'])) {
                // Credenciales correctas
                session_regenerate_id(true); 

                $_SESSION['user_id'] = (int)$user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['nombre_completo'] = $user['nombre_completo'];
                $_SESSION['id_rol'] = (int)$user['id_rol'];
                $_SESSION['avatar_url'] = $user['avatar_url'];

                $response['success'] = true;
                $response['message'] = 'Inicio de sesión exitoso.';
                $response['data'] = [
                    'id' => (int)$user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'nombre_completo' => $user['nombre_completo'],
                    'id_rol' => (int)$user['id_rol'],
                    'avatar_url' => $user['avatar_url']
                ];
                http_response_code(200);
            } else {
                // Usuario no encontrado o contraseña incorrecta
                error_log("API Auth Info (auth.php login): Fallo de login para identifier '{$loginIdentifier}'. Usuario encontrado: " . ($user ? 'Sí' : 'No') . ". Password verify: " . ($user ? (password_verify($password, $user['password_hash']) ? 'OK' : 'FALLÓ') : 'N/A'));
                $response['message'] = 'Credenciales incorrectas.';
                http_response_code(401); 
            }

        } catch (PDOException $e) {
            // Loguear el mensaje real de la excepción PDO
            error_log("API DB PDOException (auth.php login): " . $e->getMessage() . " - SQL: " . (isset($sql) ? $sql : 'N/A'));
            $response['message'] = 'Error de base de datos durante el inicio de sesión. Por favor, inténtalo más tarde.'; // Mensaje para el usuario
            http_response_code(500);
        } catch (Exception $e) {
            error_log("API General Exception (auth.php login): " . $e->getMessage());
            $response['message'] = 'Error general durante el inicio de sesión. Por favor, inténtalo más tarde.';
            http_response_code(500);
        }

    } elseif ($action === 'logout') {
        // --- SUB-SECCIÓN: CERRAR SESIÓN ---
        $_SESSION = array(); 

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy(); 

        $response['success'] = true;
        $response['message'] = 'Sesión cerrada exitosamente.';
        http_response_code(200);

    } else {
        $response['message'] = "Acción POST '$action' no reconocida en auth.php.";
        http_response_code(400); 
    }

// --- SECCIÓN: MANEJO DE PETICIONES GET (CHECK_SESSION) ---
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'check_session') {
        // --- SUB-SECCIÓN: VERIFICAR SESIÓN ACTIVA ---
        if (isset($_SESSION['user_id'])) {
            $response['success'] = true;
            $response['is_logged_in'] = true;
            $response['message'] = 'Sesión activa.';
            $response['data'] = [ 
                'user_id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'email' => $_SESSION['email'],
                'nombre_completo' => $_SESSION['nombre_completo'] ?? null,
                'id_rol' => $_SESSION['id_rol'],
                'avatar_url' => $_SESSION['avatar_url'] ?? null
            ];
            http_response_code(200);
        } else {
            $response['success'] = true; 
            $response['is_logged_in'] = false;
            $response['message'] = 'No hay sesión activa.';
            http_response_code(200); 
        }
    } else {
        $response['message'] = "Acción GET '$action' no reconocida en auth.php.";
        http_response_code(400);
    }

} else {
    $response['message'] = "Método HTTP '" . $_SERVER['REQUEST_METHOD'] . "' no soportado por auth.php.";
    http_response_code(405); 
}

echo json_encode($response);
exit;
?>