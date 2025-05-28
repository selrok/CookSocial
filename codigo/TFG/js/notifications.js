// TFG/js/notifications.js

// Variables globales para los elementos del Navbar (se cachearán en document.ready)
let $navBarUserAuthButtons = null;
let $navBarUserProfileButtons = null;
let $navBarAdminLinkContainer = null; // El <li> que contiene el enlace de admin
let $navBarMainLinksUl = null; // El <ul> principal "navbar-nav me-auto"

/**
 * updateLoginStatusUIGlobal
 * Actualiza la UI del navbar globalmente.
 * Todos los elementos condicionales están ocultos por defecto con 'd-none'.
 * Esta función quita 'd-none' de los elementos que deben ser visibles.
 * @param {object | null} sessionData - Respuesta de checkSession.
 *        Esperado: { is_logged_in: boolean, data: { user_id: int, username: string, id_rol: int, ... } }
 */
function updateLoginStatusUIGlobal(sessionData) {
    console.log("[NavUI] Actualizando con datos:", sessionData);

    if (!$navBarUserAuthButtons || !$navBarUserProfileButtons || !$navBarAdminLinkContainer || !$navBarMainLinksUl) {
        console.error("[NavUI] Elementos del Navbar no cacheados. No se puede actualizar UI.");
        return;
    }

    // Primero, asegurarse de que todos los elementos condicionales estén ocultos.
    // Esto es por si esta función se llama múltiples veces y el estado cambia.
    $navBarUserAuthButtons.addClass('d-none');
    $navBarUserProfileButtons.addClass('d-none');
    $navBarAdminLinkContainer.addClass('d-none');
    $navBarMainLinksUl.addClass('d-none'); // Ocultar el UL principal de la izquierda inicialmente

    if (sessionData && sessionData.is_logged_in && sessionData.data && sessionData.data.user_id) {
        // --- Usuario ESTÁ logueado ---
        const userData = sessionData.data;
        console.log("[NavUI] LOGUEADO:", userData.username, "Rol:", userData.id_rol);
        
        // Mostrar botones de perfil, notificaciones, salir
        $navBarUserProfileButtons.removeClass('d-none'); 
        
        let mainLinksUlShouldBeVisible = false; // Bandera para saber si el UL principal debe mostrarse

        // Mostrar enlace de "Administrar" si id_rol NO es 3 (Usuario)
        // Asumimos que id_rol = 3 es para 'Usuario'. Ajusta si tus IDs de rol son diferentes.
        // Roles 1 (SuperAdmin) y 2 (Admin) ven el link "Administrar".
        if (userData.id_rol && parseInt(userData.id_rol, 10) !== 3) {
            $navBarAdminLinkContainer.removeClass('d-none');
            mainLinksUlShouldBeVisible = true; // Si el link de admin es visible, el UL debe serlo
        }
        
        // Aquí podrías tener lógica para OTROS links en $navBarMainLinksUl
        // que solo se muestran a usuarios logueados, por ejemplo:
        // const $myRecipesLink = $('#nav-my-recipes-link'); // Si tuvieras este ID
        // if ($myRecipesLink.length) {
        //     $myRecipesLink.removeClass('d-none');
        //     mainLinksUlShouldBeVisible = true;
        // }

        // Mostrar el <ul> principal si alguno de sus hijos condicionales es visible
        if (mainLinksUlShouldBeVisible) {
            $navBarMainLinksUl.removeClass('d-none');
        }

    } else {
        // --- Usuario NO está logueado ---
        console.log("[NavUI] NO LOGUEADO.");
        // Mostrar botones de "Iniciar Sesión" / "Registrarse"
        $navBarUserAuthButtons.removeClass('d-none'); 
        // El resto ya está oculto por el reseteo inicial o por el HTML por defecto.
    }
}

// NotificationsModule y escapeHTML (sin cambios en su lógica interna, solo se pega por completitud)
const NotificationsModule = { 
    notificationsDropdown: null,
    notificationsList: null,
    notificationBadge: null,
    currentUserData: null,
    
    init: function(userData) {
        if (!userData || !userData.user_id) {
            this.clearNotificationsUI();
            return;
        }
        
        this.currentUserData = userData;
        this.notificationsDropdown = $('#notificationsDropdown');
        this.notificationsList = $('#notificationsList');
        this.notificationBadge = $('#notification-badge');
        
        if (!this.notificationsDropdown.length || !this.notificationsList.length || !this.notificationBadge.length) {
            console.error("NM: DOM elements missing");
            return;
        }
        
        this.loadUserNotifications();
        const self = this;
        this.notificationsDropdown.on('show.bs.dropdown', function() {
            if (self.notificationBadge.length) self.notificationBadge.text('0').hide();
        });
    },
    
    loadUserNotifications: function() {
        const notifications = this.getMockNotifications();
        this.renderNotifications(notifications);
    },
    
    renderNotifications: function(notifications) {
        if (!this.notificationsList || !this.notificationsList.length) return;
        
        this.notificationsList.empty();
        
        if (!notifications || notifications.length === 0) {
            this.notificationsList.append('<li class="dropdown-item text-center text-muted p-3 mb-0">No hay notificaciones.</li>');
            if (this.notificationBadge.length) this.notificationBadge.hide();
            return;
        }
        
        let unreadCount = 0;
        const self = this;
        
        notifications.forEach(notif => {
            const isUnread = !notif.read;
            if (isUnread) unreadCount++;
            
            const listItem = $(`
                <li>
                    <a class="dropdown-item notification-item ${isUnread ? 'unread' : ''}" href="${notif.link || '#'}">
                        <div class="d-flex align-items-start">
                            <div class="notification-icon text-${self.getNotificationColor(notif.type)} me-2">
                                <i class="${self.getNotificationIcon(notif.type)} fa-fw"></i>
                            </div>
                            <div class="notification-content flex-grow-1">
                                <strong class="notification-title">${escapeHTML(notif.title)}</strong>
                                <div class="notification-message small text-muted">${escapeHTML(notif.message)}</div>
                            </div>
                            ${isUnread ? '<span class="unread-dot ms-auto align-self-center"><i class="fas fa-circle text-primary fa-xs"></i></span>' : ''}
                        </div>
                    </a>
                </li>
            `);
            
            this.notificationsList.append(listItem);
        });
        
        if (this.notificationBadge.length) {
            unreadCount > 0 
                ? this.notificationBadge.text(unreadCount > 99 ? '99+' : unreadCount).show()
                : this.notificationBadge.hide();
        }
    },
    
    clearNotificationsUI: function() {
        if (this.notificationsList && this.notificationsList.length) {
            this.notificationsList.empty().append('<li class="dropdown-item text-center text-muted p-3 mb-0">Inicia sesión para notificaciones.</li>');
        }
        if (this.notificationBadge && this.notificationBadge.length) this.notificationBadge.hide();
    },
    
    getNotificationIcon: function(type) {
        const icons = {
            'like': 'fa-heart',
            'comment': 'fa-comment',
            'follow': 'fa-user-plus',
            'admin_message': 'fa-shield-alt',
            'system': 'fa-info-circle'
        };
        return `fas ${icons[type] || 'fa-bell'}`;
    },
    
    getNotificationColor: function(type) {
        const colors = {
            'like': 'danger',
            'comment': 'primary',
            'follow': 'success',
            'admin_message': 'warning',
            'system': 'info'
        };
        return colors[type] || 'secondary';
    },
    
    getMockNotifications: function() {
        return [{
            id: 1,
            type: 'comment',
            title: 'Nuevo comentario',
            message: 'Ana comentó tu receta.',
            read: false,
            link: '#'
        }];
    }
};

function escapeHTML(str) {
    if (str === null || typeof str === 'undefined') return '';
    return $('<div></div>').text(String(str)).html();
}

$(document).ready(function() {
    console.log("notifications.js: DOM ready. Configurando UI global y sesión.");

    // Cachear selectores del Navbar una vez
    $navBarUserAuthButtons = $('#user-auth-buttons');
    $navBarUserProfileButtons = $('#user-profile-buttons');
    $navBarAdminLinkContainer = $('#nav-admin-link'); 
    $navBarMainLinksUl = $('#nav-main-links'); // ID añadido al <ul> de la izquierda

    // Asegurar que los elementos base del navbar existan antes de continuar
    if (!$navBarUserAuthButtons.length || !$navBarUserProfileButtons.length || 
        !$navBarAdminLinkContainer.length || !$navBarMainLinksUl.length) {
        console.error("notifications.js: Elementos críticos del Navbar (user-auth-buttons, user-profile-buttons, nav-admin-link, o nav-main-links) NO encontrados en el DOM. La UI no se gestionará.");
        $(document).trigger('sessionChecked', [{ is_logged_in: false, data: null, error: "Navbar elements missing" }]);
        return; // No podemos continuar si faltan elementos base
    }
    
    // Estado inicial de la UI: asegurar que todo esté como para "no logueado"
    // Los elementos ya tienen d-none en el HTML según necesidad, pero esto lo refuerza.
    updateLoginStatusUIGlobal({ is_logged_in: false, data: null });
    NotificationsModule.clearNotificationsUI(); // También limpiar notificaciones

    // Verificar dependencias
    if (typeof AuthService === 'undefined' || typeof AuthService.checkSession !== 'function') {
        console.error("notifications.js: AuthService o AuthService.checkSession no disponible. No se puede determinar estado de login.");
        // La UI ya está como "no logueado". Disparar evento para que otras páginas continúen.
        $(document).trigger('sessionChecked', [{ is_logged_in: false, data: null, error: "AuthService missing" }]);
        return; 
    }

    // 1. VERIFICAR SESIÓN Y ACTUALIZAR NAVBAR
    AuthService.checkSession()
        .done(function(sessionResponse) {
            console.log("notifications.js (checkSession.done): Respuesta de checkSession:", sessionResponse);
            updateLoginStatusUIGlobal(sessionResponse); // Actualiza el navbar y links

            if (sessionResponse && sessionResponse.is_logged_in && sessionResponse.data) {
                NotificationsModule.init(sessionResponse.data); // Inicializa notificaciones si está logueado
            } else {
                NotificationsModule.clearNotificationsUI();
            }
            // Informar a otros scripts (como index.js) que la comprobación ha terminado
            $(document).trigger('sessionChecked', [sessionResponse]);
        })
        .fail(function(jqXHR) {
            console.error("notifications.js (checkSession.fail): Error AJAX en checkSession:", jqXHR.status, jqXHR.responseText);
            const errorResponse = { success: false, is_logged_in: false, message: 'Error verificando sesión', data: null };
            updateLoginStatusUIGlobal(errorResponse); // Asumir no logueado
            NotificationsModule.clearNotificationsUI();
            $(document).trigger('sessionChecked', [errorResponse]); // Informar del fallo
        });

    // 2. MANEJAR EL BOTÓN DE LOGOUT
    const $logoutButton = $('#logoutButton');
    if ($logoutButton.length) {
        $logoutButton.on('click', function(e) {
            e.preventDefault();
            console.log("notifications.js: Logout button presionado.");
            
            if (AuthService && AuthService.logout) {
                AuthService.logout()
                    .done(function(logoutResponse) {
                        if (logoutResponse && logoutResponse.success) {
                            updateLoginStatusUIGlobal({ is_logged_in: false, data: null });
                            NotificationsModule.clearNotificationsUI();
                            const nonAuthPages = ['index.html', 'logReg.html', 'help.html'];
                            let currentPageIsPublicAndIndex = window.location.pathname.endsWith('index.html');
                            
                            if (!currentPageIsPublicAndIndex) {
                                // Si no está en index, o está en una página que podría ser protegida, redirige a index
                                let pathSegments = window.location.pathname.split('/');
                                let pageName = pathSegments.pop() || pathSegments.pop(); // Maneja trailing slash
                                
                                if (pageName && !nonAuthPages.includes(pageName)) {
                                    window.location.href = 'index.html';
                                } else if (!pageName && !currentPageIsPublicAndIndex) { // si es la raiz del sitio pero no index.html
                                    window.location.href = 'index.html';
                                } else {
                                    $(document).trigger('sessionChecked', [{ is_logged_in: false, data: null }]);
                                }
                            } else {
                                $(document).trigger('sessionChecked', [{ is_logged_in: false, data: null }]);
                            }
                        } else {
                            console.error("notifications.js: Logout API error:", logoutResponse.message || "Error desconocido desde servidor.");
                            // Aquí se podría usar un sistema de mensajes global, no un alert
                            // ej: GlobalMessages.showError("Error al cerrar sesión: " + (logoutResponse.message || "Inténtalo de nuevo."));
                        }
                    })
                    .fail(function(jqXHR_logout) {
                        console.error("notifications.js: Logout AJAX fail:", jqXHR_logout.status, jqXHR_logout.responseText);
                        // ej: GlobalMessages.showError("Error de comunicación al cerrar sesión.");
                    });
            } else {
                console.error("notifications.js: AuthService.logout no disponible.");
            }
        });
    }
});

if (typeof window !== 'undefined') {
    window.NotificationsModule = NotificationsModule;
}