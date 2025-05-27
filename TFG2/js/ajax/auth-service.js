// TFG/js/ajax/auth-service.js

const AuthService = {
    register: function(userData) {
        console.log("AuthService: Registrando usuario...", userData);
        return $.ajax({
            url: 'api/users.php', // Asume que users.php está en TFG/api/users.php
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(userData),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    login: function(credentials) {
        console.log("AuthService: Iniciando sesión...", credentials);
        // CORRECCIÓN DE LA URL:
        // Asumiendo que logReg.html está en TFG/ y auth.php en TFG/api/
        const loginUrl = 'api/auth.php?action=login'; 
        // Elige la que mejor se adapte a cómo accedes a tu sitio. 'api/auth.php?action=login' debería ser lo más común.

        return $.ajax({
            url: loginUrl, // Usar la URL corregida
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(credentials),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    logout: function() {
        console.log("AuthService: Cerrando sesión...");
        // MISMA LÓGICA DE RUTA PARA LOGOUT
        const logoutUrl = 'api/auth.php?action=logout';
        return $.ajax({
            url: logoutUrl,
            type: 'POST',
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    checkSession: function() {
        console.log("AuthService: Verificando sesión activa...");
        // MISMA LÓGICA DE RUTA PARA CHECKSESSION
        const checkSessionUrl = 'api/auth.php?action=check_session';
        return $.ajax({
            url: checkSessionUrl,
            type: 'GET',
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};

if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}