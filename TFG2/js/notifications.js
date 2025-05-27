// TFG/js/notifications.js

// Ya no usamos estas constantes hardcodeadas
// const IS_USER_LOGGED_IN = true; 
// const IS_USER_ADMIN = true;

// Envolver toda la lógica en una función que podamos llamar o en un objeto
// para evitar que se ejecute automáticamente si el usuario no está logueado.

const NotificationsModule = {
    // Elementos del DOM (se pueden inicializar en init)
    notificationsDropdown: null,
    notificationsList: null,
    notificationBadge: null,
    currentUserData: null, // Para almacenar datos del usuario si es necesario

    /**
     * Inicializa el módulo de notificaciones.
     * Solo se debe llamar si el usuario está autenticado.
     * @param {object} userData - Los datos del usuario logueado (de AuthService.checkSession).
     */
    init: function(userData) {
        if (!userData || !userData.user_id) {
            console.warn("NotificationsModule.init: No se proporcionaron datos de usuario válidos. No se inicializarán las notificaciones.");
            this.clearNotificationsUI(); // Limpiar la UI por si acaso
            return;
        }
        
        this.currentUserData = userData;
        console.log("NotificationsModule: Inicializando para el usuario:", this.currentUserData.username);

        // Cachear elementos del DOM
        this.notificationsDropdown = $('#notificationsDropdown');
        this.notificationsList = $('#notificationsList');
        this.notificationBadge = $('#notification-badge');

        if (!this.notificationsDropdown.length || !this.notificationsList.length || !this.notificationBadge.length) {
            console.error("NotificationsModule.init: Elementos del DOM para notificaciones no encontrados.");
            return;
        }

        this.loadUserNotifications(); // Cargar notificaciones para el usuario actual

        // Manejar la apertura del dropdown
        const self = this; // Para usar 'this' del módulo dentro del callback del evento
        this.notificationsDropdown.on('show.bs.dropdown', function() {
            console.log("NotificationsModule: Dropdown abierto. Marcando notificaciones como leídas (simulado).");
            // Aquí iría la lógica real para marcar notificaciones como leídas en el backend
            // y luego actualizar la UI. Por ahora, solo ocultamos el badge.
            if (self.notificationBadge.length) {
                self.notificationBadge.text('0').hide(); // Opcional: poner a 0 antes de ocultar
            }
            // Podrías recargar las notificaciones o actualizar su estado visual aquí
            // self.markNotificationsAsReadUI();
        });

        // Podrías tener un polling o WebSockets aquí para notificaciones en tiempo real en el futuro
    },

    /**
     * Carga y muestra las notificaciones para el usuario actual.
     * En una aplicación real, esto haría una llamada AJAX.
     */
    loadUserNotifications: function() {
        console.log("NotificationsModule: Cargando notificaciones para el usuario ID:", this.currentUserData.user_id);
        
        // Por ahora, usamos los datos mock. En el futuro, harías una llamada AJAX aquí:
        // SomethingLike_NotificationService.fetchUserNotifications(this.currentUserData.user_id)
        //    .done(notifications => this.renderNotifications(notifications))
        //    .fail(error => console.error("Error cargando notificaciones", error));
        
        const notifications = this.getMockNotifications(); // Usando datos mock
        this.renderNotifications(notifications);
    },

    /**
     * Renderiza las notificaciones en la lista del dropdown.
     * @param {Array} notifications - Array de objetos de notificación.
     */
    renderNotifications: function(notifications) {
        if (!this.notificationsList || !this.notificationsList.length) return;
        
        this.notificationsList.empty(); // Limpiar lista actual

        if (!notifications || notifications.length === 0) {
            this.notificationsList.append(
                '<li class="dropdown-item text-center text-muted p-3 mb-0">No tienes notificaciones nuevas.</li>'
            );
            if (this.notificationBadge.length) this.notificationBadge.hide();
            return;
        }

        let unreadCount = 0;
        const self = this; // Para getNotificationColor y getNotificationIcon
        
        notifications.forEach(notif => {
            const isUnread = !notif.read; // Asumimos que tus notificaciones tienen una propiedad 'read'
            if (isUnread) unreadCount++;
            
            // Construir el HTML del item de notificación
            // Nota: Asegúrate que los datos (notif.title, notif.message) estén saneados si vienen del servidor.
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
                </li>`);
            this.notificationsList.append(listItem);
        });

        // Actualizar el badge de notificaciones no leídas
        if (this.notificationBadge.length) {
            if (unreadCount > 0) {
                this.notificationBadge.text(unreadCount > 99 ? '99+' : unreadCount).show();
            } else {
                this.notificationBadge.hide();
            }
        }
    },

    /**
     * Simula marcar notificaciones como leídas en la UI (solo visualmente).
     * En una app real, esto se haría después de una confirmación del backend.
     */
    markNotificationsAsReadUI: function() {
        if (!this.notificationsList || !this.notificationsList.length) return;
        this.notificationsList.find('.notification-item.unread').removeClass('unread');
        this.notificationsList.find('.unread-dot').remove();
    },
    
    /**
     * Limpia la UI de notificaciones (ej. si el usuario cierra sesión).
     */
    clearNotificationsUI: function() {
        if (this.notificationsList && this.notificationsList.length) {
             this.notificationsList.empty().append(
                '<li class="dropdown-item text-center text-muted p-3 mb-0">Inicia sesión para ver notificaciones.</li>'
            );
        }
        if (this.notificationBadge && this.notificationBadge.length) {
            this.notificationBadge.hide();
        }
    },

    // --- FUNCIONES AUXILIARES (Mantenidas como estaban) ---
    getNotificationIcon: function(type) {
        const icons = { 'like': 'fa-heart', 'comment': 'fa-comment', 'follow': 'fa-user-plus', 'admin_message': 'fa-shield-alt', 'system': 'fa-info-circle'};
        return `fas ${icons[type] || 'fa-bell'}`; // fa-bell como fallback
    },

    getNotificationColor: function(type) {
        const colors = { 'like': 'danger', 'comment': 'primary', 'follow': 'success', 'admin_message': 'warning', 'system':'info' };
        return colors[type] || 'secondary';
    },

    // --- DATOS MOCK (Mantenidos como estaban para pruebas) ---
    getMockNotifications: function() {
        // Tu array de notificaciones mock (asegúrate que tengan una propiedad 'read: true/false' y opcionalmente 'link')
        return [
            { id: 1, type: 'comment', title: 'Nuevo comentario', message: 'Ana ha comentado tu receta "Paella Valenciana".', read: false, link: 'recipe.html?id=paella-valenciana#comments' },
            { id: 2, type: 'like', title: 'Nuevo Me Gusta', message: 'Luis le ha dado Me Gusta a tu "Tarta de Manzana".', read: false, link: 'recipe.html?id=tarta-manzana' },
            { id: 3, type: 'follow', title: 'Nuevo Seguidor', message: 'Carlos ha comenzado a seguirte.', read: true, link: 'profile.html?userId=carlos' },
            { id: 4, type: 'admin_message', title: 'Sistema', message: 'Tu receta se ha publicado correctamente', read: false, link: '#' },
            { id: 5, type: 'like', title: 'Más Me Gusta', message: '10 personas más le dieron Me Gusta a tu receta.', read: true, link:'#'}
            
        ];
    }
};

// Función global de escape HTML (si no la tienes en un utils.js)
// Es mejor tenerla en un archivo de utilidades global si la usas en varios sitios.
function escapeHTML(str) {
    if (str === null || typeof str === 'undefined') return '';
    return $('<div></div>').text(String(str)).html();
}

// Hacer el módulo accesible globalmente
if (typeof window !== 'undefined') {
    window.NotificationsModule = NotificationsModule;
}