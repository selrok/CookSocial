$(document).ready(function() {
    // Estado de usuario (simulado)
    const IS_USER_LOGGED_IN = true;
    const IS_USER_ADMIN = true;

    // Elementos del DOM
    const notificationsDropdown = $('#notificationsDropdown');
    const notificationsList = $('#notificationsList');
    const notificationBadge = $('#notification-badge');

    if (IS_USER_LOGGED_IN) {
        loadNotifications();

        // Manejar la apertura del dropdown
        notificationsDropdown.on('show.bs.dropdown', function() {
            console.log("Dropdown de notificaciones abierto");
            // Aquí iría la lógica para marcar notificaciones como leídas
            notificationBadge.hide();
        });
    }

    // Cargar notificaciones
    function loadNotifications() {
        const notifications = getMockNotifications();
        
        notificationsList.empty(); // Limpiar lista actual

        if (notifications.length === 0) {
            notificationsList.append(
                '<li class="empty-notifications"><p class="text-center text-muted p-3 mb-0">No tienes notificaciones nuevas.</p></li>'
            );
            notificationBadge.hide();
            return;
        }

        let unreadCount = 0;
        
        notifications.forEach(notif => {
            const isUnread = !notif.read;
            if (isUnread) unreadCount++;
            
            const listItem = $(
                `<li>
                    <a class="dropdown-item" href="#">
                        <div class="d-flex align-items-start">
                            <div class="notification-icon text-${getNotificationColor(notif.type)}">
                                <i class="${getNotificationIcon(notif.type)}"></i>
                            </div>
                            <div class="notification-content">
                                <div class="notification-title">${notif.title}</div>
                                <div class="notification-message">${notif.message}</div>
                            </div>
                            ${isUnread ? '<div class="unread-indicator"></div>' : ''}
                        </div>
                    </a>
                </li>`
            );
            
            notificationsList.append(listItem);
        });

        if (unreadCount > 0) {
            notificationBadge.text(unreadCount > 9 ? '9+' : unreadCount);
            notificationBadge.show();
        } else {
            notificationBadge.hide();
        }
    }

    // Funciones auxiliares
    function getNotificationIcon(type) {
        const icons = {
            'like': 'fa-heart',
            'comment': 'fa-comment',
            'follow': 'fa-user-plus',
            'admin_message': 'fa-shield-alt'
        };
        return `fas ${icons[type] || 'fa-info-circle'}`;
    }

    function getNotificationColor(type) {
        const colors = {
            'like': 'danger',
            'comment': 'primary',
            'follow': 'success',
            'admin_message': 'warning'
        };
        return colors[type] || 'secondary';
    }

    function getMockNotifications() {
        return [
            { id: 1, type: 'comment', title: 'Nuevo comentario', message: 'Ana ha comentado tu receta "Paella Valenciana".', read: false },
            { id: 2, type: 'like', title: 'Nuevo Me Gusta', message: 'Luis le ha dado Me Gusta a tu "Tarta de Manzana".', read: false },
            { id: 3, type: 'follow', title: 'Nuevo Seguidor', message: 'Carlos ha comenzado a seguirte.', read: true },
            { id: 4, type: 'admin_message', title: 'Sistema', message: 'Tu receta se ha publicado correctamente', read: false },
            { id: 4, type: 'admin_message', title: 'Sistema', message: 'Tu receta se ha publicado correctamente', read: false },
            { id: 4, type: 'admin_message', title: 'Sistema', message: 'Tu receta se ha publicado correctamente', read: false },
            { id: 4, type: 'admin_message', title: 'Sistema', message: 'Tu receta se ha publicado correctamente', read: false },
            { id: 5, type: 'like', title: 'Nuevo Me Gusta', message: 'Sara le ha dado Me Gusta a tu "Gazpacho Andaluz".', read: false }
        ];
    }
});