$(document).ready(function() {
    const CURRENT_LOGGED_IN_USER_ROLE = 'SuperAdministrador'; // O 'Administrador'

    let recipeData = [], userData = [], commentReportData = [], supportTicketData = [];

    let currentSort = { column: '', direction: 'asc', tableId: '' };
    let confirmRoleChangeModalInstance, confirmDeleteModalInstance, 
        superAdminWarningModalInstance, permissionDeniedModalInstance,
        viewCommentReportModalInstance, viewSupportTicketModalInstance,
        confirmHideReportedCommentModalInstance, 
        confirmClearRecipeReportsModalInstance;

    let currentUserToChangeRole = null;
    let itemToDelete = null;
    let currentReportToView = null;
    let currentTicketToView = null;
    let reportedCommentToManageInfo = null;
    let recipeToClearReportsInfo = null; 

    const ROLE_HIERARCHY = { 'SuperAdministrador': 3, 'Administrador': 2, 'Usuario': 1 };

    function init() {
        if (typeof mockAdminData === 'undefined' || mockAdminData === null) {
            console.error("CRITICAL: mockAdminData no está definido o es null.");
            displayErrorInAllTables("Error crítico al cargar datos iniciales. Verifique la consola.");
            return; 
        }
        recipeData = (mockAdminData.recipes || []).map(r => ({...r, reports: Number(r.reports) || 0 }));
        userData = mockAdminData.users || [];
        commentReportData = mockAdminData.commentReports || [];
        supportTicketData = mockAdminData.supportTickets || [];

        renderAllTables();
        setupEventListeners();
        
        confirmRoleChangeModalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmRoleChangeModal'));
        confirmDeleteModalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmDeleteModal'));
        superAdminWarningModalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('superAdminWarningModal'));
        permissionDeniedModalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('permissionDeniedModal'));
        viewCommentReportModalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('viewCommentReportModal'));
        viewSupportTicketModalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('viewSupportTicketModal'));
        confirmHideReportedCommentModalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmHideReportedCommentModal'));
        confirmClearRecipeReportsModalInstance = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmClearRecipeReportsModal'));
        
        initialTableMessages();
    }
    
    function displayErrorInAllTables(message) {
        ['recipeTableBody', 'userTableBody', 'commentReportsTableBody', 'supportTicketsTableBody'].forEach(id => {
            const el = document.getElementById(id);
            // Asegurarse de que el colspan sea correcto para cada tabla si el mensaje de error se muestra
            let colspan = 7; // Por defecto para recetas y usuarios
            if (id === 'commentReportsTableBody' || id === 'supportTicketsTableBody') {
                colspan = 6;
            }
            if (el) el.innerHTML = `<tr><td colspan="${colspan}" class="text-center text-danger p-3">${message}</td></tr>`;
        });
    }
    
    function renderAllTables() {
        renderRecipes(recipeData);
        renderUsers(userData);
        renderCommentReports(commentReportData);
        renderSupportTickets(supportTicketData);
    }

    function renderRecipes(recipes) {
        const $tbody = $('#recipeTableBody');
        if (!$tbody.length) return;
        $tbody.empty(); 
        if (!recipes || recipes.length === 0) {
            $tbody.html('<tr><td colspan="7" class="text-center text-muted">No se encontraron recetas.</td></tr>');
            return;
        }
        recipes.forEach(recipe => {
            const tr = $('<tr>'); // Crear con jQuery
            const reportCount = Number(recipe.reports) || 0;
            const reportIndicatorClass = reportCount > 0 ? 'has-reports' : 'no-reports';
            // Mostrar el número directamente si hay reportes, o el icono de check si no hay.
            const reportIndicatorContent = reportCount > 0 ? reportCount : '<i class="bi bi-check-circle-fill"></i>';

            tr.html(`
                <td class="fw-semibold">${recipe.id}</td>
                <td>${escapeHTML(recipe.title)}</td>
                <td>${escapeHTML(recipe.author)}</td>
                <td>${formatDate(recipe.date)}</td>
                <td><span class="badge ${getStatusBadgeClass(recipe.status)}">${escapeHTML(recipe.status)}</span></td>
                <td class="text-center">
                    <span class="report-indicator ${reportIndicatorClass}" title="${reportCount} denuncias">
                        ${reportIndicatorContent}
                    </span>
                </td>
                <td class="text-end">
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-h"></i></button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="recipe.html?id=${recipe.id}" target="_blank"><i class="bi bi-eye-fill me-2"></i>Ver receta</a></li>
                            ${reportCount > 0 ? `<li><a class="dropdown-item clear-recipe-reports-btn" href="#" data-item-id="${recipe.id}" data-item-name="${escapeHTML(recipe.title)}" title="Marcar denuncias como revisadas"><i class="bi bi-bookmark-check-fill me-2"></i>Limpiar Denuncias</a></li>` : ''}
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger delete-item-btn" href="#" data-item-id="${recipe.id}" data-item-name="${escapeHTML(recipe.title)}" data-item-type="recipe"><i class="bi bi-trash-fill me-2"></i>Eliminar</a></li>
                        </ul>
                    </div>
                </td>`);
            $tbody.append(tr);
        });
    }

    function renderUsers(users) {
        const $tbody = $('#userTableBody');
        if (!$tbody.length) return;
        $tbody.empty();
        if (!users || users.length === 0) {
            $tbody.html('<tr><td colspan="7" class="text-center text-muted">No se encontraron usuarios.</td></tr>');
            return;
        }
        users.forEach(user => {
            const tr = $('<tr>');
            const isTargetAdminOrSuperAdmin = user.role === 'Administrador' || user.role === 'SuperAdministrador';
            const switchId = `roleSwitch-${user.id}`;
            let switchRoleClass = user.role === 'SuperAdministrador' ? 'role-superadmin' : (user.role === 'Administrador' ? 'role-admin' : '');

            tr.html(`
                <td class="fw-semibold">${user.id}</td>
                <td>${escapeHTML(user.username)}</td>
                <td>${escapeHTML(user.email)}</td>
                <td>${formatDate(user.joindate)}</td>
                <td><span class="badge ${getRoleBadgeClass(user.role)} user-role-badge-${user.id}">${escapeHTML(user.role)}</span></td>
                <td class="text-center role-switch-cell">
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input role-switch ${switchRoleClass}" type="checkbox" role="switch" 
                               id="${switchId}" 
                               data-user-id="${user.id}" 
                               data-username="${escapeHTML(user.username)}"
                               data-current-role="${user.role}" 
                               ${isTargetAdminOrSuperAdmin ? 'checked' : ''}>
                        <label class="form-check-label visually-hidden" for="${switchId}">Cambiar rol</label>
                    </div>
                </td>
                <td class="text-end">
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-h"></i></button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="profile.html?userId=${user.id}" target="_blank"><i class="bi bi-person-circle me-2"></i>Ver perfil</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger delete-item-btn" href="#" data-item-id="${user.id}" data-item-name="${escapeHTML(user.username)}" data-item-type="user"><i class="bi bi-trash-fill me-2"></i>Eliminar</a></li>
                        </ul>
                    </div>
                </td>`);
            $tbody.append(tr);
        });
    }

    function renderCommentReports(reports) {
        const $tbody = $('#commentReportsTableBody');
        if (!$tbody.length) return;
        $tbody.empty();
        if (!reports || reports.length === 0) {
            $tbody.html('<tr><td colspan="6" class="text-center text-muted">No hay reportes de comentarios.</td></tr>');
            return;
        }
        reports.forEach(report => {
            const tr = $('<tr>');
            tr.html(`
                <td><a href="recipe.html?id=${report.recipeId}#comment-${report.commentId}" target="_blank">${escapeHTML(report.recipeTitle)}</a></td>
                <td><a href="profile.html?userId=${report.userId}" target="_blank">${escapeHTML(report.username)}</a></td>
                <td class="comment-content-cell" title="Ver detalle para leer completo">${escapeHTML(report.commentContent)}</td>
                <td>${formatDate(report.reportDate)}</td>
                <td><span class="badge ${getReportStatusBadgeClass(report.status)}">${escapeHTML(report.status)}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary view-comment-report-btn" data-report-id="${report.id}" title="Ver y gestionar reporte">
                        <i class="bi bi-eye-fill me-1"></i> Ver Detalles
                    </button>
                </td>`);
            $tbody.append(tr);
        });
    }

    function renderSupportTickets(tickets) {
        const $tbody = $('#supportTicketsTableBody');
        if (!$tbody.length) return;
        $tbody.empty();
        if (!tickets || tickets.length === 0) {
            $tbody.html('<tr><td colspan="6" class="text-center text-muted">No hay tickets de soporte.</td></tr>');
            return;
        }
        tickets.forEach(ticket => {
            const tr = $('<tr>');
            tr.html(`
                <td>${escapeHTML(ticket.name)}</td>
                <td><a href="mailto:${escapeHTML(ticket.email)}">${escapeHTML(ticket.email)}</a></td>
                <td class="support-message-cell" title="Ver detalle para leer completo">${escapeHTML(ticket.message)}</td>
                <td>${formatDate(ticket.submissionDate)}</td>
                <td><span class="badge ${getSupportTicketStatusBadgeClass(ticket.status)} support-ticket-status-${ticket.id}">${escapeHTML(ticket.status)}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary view-support-ticket-btn" data-ticket-id="${ticket.id}" title="Ver y gestionar ticket">
                        <i class="bi bi-eye-fill me-1"></i> Ver / Gestionar
                    </button>
                </td>`);
            $tbody.append(tr);
        });
    }

    function setupEventListeners() {
        $('#adminTabsContent').on('click', '.sortable', function() {
            const $th = $(this);
            sortTable($th.data('column'), $th.closest('table').find('tbody').attr('id'));
        });
$('#recipeSearch').on('input', function() { renderRecipes((recipeData || []).filter(r => Object.values(r).some(val => String(val).toLowerCase().includes($(this).val().toLowerCase())))); });
        $('#userSearch').on('input', function() { renderUsers((userData || []).filter(u => Object.values(u).some(val => String(val).toLowerCase().includes($(this).val().toLowerCase())))); });
        $('#commentReportSearch').on('input', function() { renderCommentReports((commentReportData || []).filter(report => Object.values(report).some(val => String(val).toLowerCase().includes($(this).val().toLowerCase())))); });
        $('#supportTicketSearch').on('input', function() { renderSupportTickets((supportTicketData || []).filter(ticket => Object.values(ticket).some(val => String(val).toLowerCase().includes($(this).val().toLowerCase())))); });
        
        $('#userTableBody').on('change', '.role-switch', function() {
            const $switchElement = $(this);
            const targetUserId = parseInt($switchElement.data('user-id'));
            const targetUserCurrentRole = $switchElement.data('current-role');
            const targetUserRoleLevel = ROLE_HIERARCHY[targetUserCurrentRole] || 0;
            const loggedInUserRoleLevel = ROLE_HIERARCHY[CURRENT_LOGGED_IN_USER_ROLE] || 0;

            if (targetUserCurrentRole === 'SuperAdministrador') {
                superAdminWarningModalInstance?.show();
                $switchElement.prop('checked', true); 
                return;
            }
            if (loggedInUserRoleLevel <= targetUserRoleLevel) {
                 showPermissionDeniedModal("No puedes modificar el rol de un usuario de igual o mayor rango.");
                 $switchElement.prop('checked', (targetUserCurrentRole === 'Administrador')); 
                 return;
            }
            const newRole = $switchElement.is(':checked') ? 'Administrador' : 'Usuario';
            currentUserToChangeRole = { userId: targetUserId, userName: $switchElement.data('username'), newRole, oldRole: targetUserCurrentRole, switchElement: this };
            $('#roleChangeUserName').text(currentUserToChangeRole.userName);
            $('#roleChangeNewRole').text(newRole);
            confirmRoleChangeModalInstance?.show();
        });
        
        $('#confirmRoleChangeBtn').on('click', function() {
            if (currentUserToChangeRole) {
                const userIndex = userData.findIndex(u => u.id === currentUserToChangeRole.userId);
                if (userIndex !== -1) {
                    userData[userIndex].role = currentUserToChangeRole.newRole;
                    renderUsers(userData); 
                }
                confirmRoleChangeModalInstance?.hide();
                currentUserToChangeRole = null;
            }
        });

        $('#confirmRoleChangeModal').on('hidden.bs.modal', function () {
             if (currentUserToChangeRole?.switchElement) {
                if (currentUserToChangeRole.oldRole !== 'SuperAdministrador') {
                     $(currentUserToChangeRole.switchElement).prop('checked', (currentUserToChangeRole.oldRole === 'Administrador'));
                }
                currentUserToChangeRole = null;
            }
        });
        
        $('#adminTabsContent').on('click', function(event) {
            const $target = $(event.target);
            const $deleteButton = $target.closest('.delete-item-btn');
            const $viewReportButton = $target.closest('.view-comment-report-btn');
            const $viewSupportTicketButton = $target.closest('.view-support-ticket-btn');
            const $clearRecipeReportsButton = $target.closest('.clear-recipe-reports-btn');
            const $editRecipeButton = $target.closest('.edit-recipe-btn');

            if ($deleteButton.length) {
                event.preventDefault();
                const itemData = $deleteButton.data();
                // Validaciones de permiso para eliminar usuarios
                if (itemData.itemType === 'user') {
                    const userToDelete = userData.find(u => u.id === itemData.itemId);
                    if (!userToDelete) return; 
                    if (userToDelete.role === 'SuperAdministrador') { 
                        showPermissionDeniedModal("Los SuperAdministradores no pueden ser eliminados."); return; 
                    }
                    if ((ROLE_HIERARCHY[CURRENT_LOGGED_IN_USER_ROLE] || 0) <= (ROLE_HIERARCHY[userToDelete.role] || 0)) { 
                        showPermissionDeniedModal("No puedes eliminar un usuario de igual o mayor rango."); return; 
                    }
                }
                itemToDelete = { itemId: itemData.itemId, itemName: itemData.itemName, itemType: itemData.itemType };
                $('#deleteItemName').text(`${itemData.itemType === 'recipe' ? 'la receta' : 'el usuario'} "${itemData.itemName}"`);
                confirmDeleteModalInstance?.show();

            } else if ($viewReportButton.length) { 
                event.preventDefault();
                currentReportToView = commentReportData.find(r => r.id === $viewReportButton.data('report-id'));
                if (currentReportToView) {
                    $('#reportDetailRecipeTitle').text(currentReportToView.recipeTitle);
                    $('#reportDetailRecipeLink').attr('href', `recipe.html?id=${currentReportToView.recipeId}#comment-${currentReportToView.commentId}`);
                    $('#reportDetailUsername').text(currentReportToView.username);
                    $('#reportDetailUserLink').attr('href', `profile.html?userId=${currentReportToView.userId}`);
                    $('#reportDetailDate').text(formatDate(currentReportToView.reportDate));
                    $('#reportDetailStatus').text(currentReportToView.status).attr('class', `badge ${getReportStatusBadgeClass(currentReportToView.status)}`);
                    $('#reportDetailCommentContent').text(currentReportToView.commentContent);
                    
                    $('#markCommentReportAsReviewedBtn').data('report-id', currentReportToView.id);
                    $('#hideReportedCommentActionBtn').data({ 'report-id': currentReportToView.id, 'comment-id': currentReportToView.commentId });
                    $('#viewReportedCommentOriginalLink').attr('href', `recipe.html?id=${currentReportToView.recipeId}#comment-${currentReportToView.commentId}`);
                    
                    const isPending = currentReportToView.status?.toLowerCase() === 'pendiente';
                    $('#markCommentReportAsReviewedBtn').prop('disabled', !isPending);
                    $('#hideReportedCommentActionBtn').prop('disabled', !isPending);

                    viewCommentReportModalInstance?.show();
                }
            } else if ($viewSupportTicketButton.length) {
                event.preventDefault();
                currentTicketToView = supportTicketData.find(t => t.id === $viewSupportTicketButton.data('ticket-id'));
                if (currentTicketToView) {
                    $('#ticketDetailName').text(currentTicketToView.name);
                    $('#ticketDetailEmail').text(currentTicketToView.email);
                    $('#ticketDetailEmailLink').attr('href', `mailto:${currentTicketToView.email}`);
                    $('#ticketDetailDate').text(formatDate(currentTicketToView.submissionDate));
                    $('#ticketDetailStatus').text(currentTicketToView.status).attr('class', `badge ${getSupportTicketStatusBadgeClass(currentTicketToView.status)}`);
                    $('#ticketDetailMessage').text(currentTicketToView.message);
                    $('#markTicketAsSolvedBtn').data('ticket-id', currentTicketToView.id).prop('disabled', currentTicketToView.status === 'Solucionado');
                    viewSupportTicketModalInstance?.show();
                }
            } else if ($clearRecipeReportsButton.length) {
                event.preventDefault();
                recipeToClearReportsInfo = { recipeId: parseInt($clearRecipeReportsButton.data('item-id')), recipeName: $clearRecipeReportsButton.data('item-name') };
                $('#clearRecipeReportsName').text(recipeToClearReportsInfo.recipeName);
                confirmClearRecipeReportsModalInstance?.show(); // Mostrar el modal de confirmación
            } else if ($editRecipeButton.length) {
                event.preventDefault(); // Aunque es un enlace, prevenimos por si acaso
                window.location.href = `formReceta.html?edit=${$editRecipeButton.data('item-id')}`;
            }
        });

        $('#confirmDeleteBtn').on('click', function() {
             if (itemToDelete) {
                if (itemToDelete.itemType === 'recipe') recipeData = recipeData.filter(r => r.id !== itemToDelete.itemId);
                else if (itemToDelete.itemType === 'user') userData = userData.filter(u => u.id !== itemToDelete.itemId);
                renderAllTables(); 
                confirmDeleteModalInstance?.hide();
                itemToDelete = null;
            }
        });
        
        // Listener para botón "Ocultar Comentario" dentro del modal de detalle de reporte
        $('#hideReportedCommentActionBtn').on('click', function() {
            if (currentReportToView) { 
                reportedCommentToManageInfo = { 
                    reportId: currentReportToView.id, 
                    commentId: currentReportToView.commentId, 
                    recipeTitle: currentReportToView.recipeTitle,
                    action: 'hide'
                };
                $('#hideReportedCommentModalBodyText').html(`¿Estás seguro de que quieres <strong>ocultar</strong> el comentario reportado en la receta "<strong>${escapeHTML(reportedCommentToManageInfo.recipeTitle)}</strong>"? El comentario no será visible para los usuarios pero se mantendrá para registro.`);
                confirmHideReportedCommentModalInstance?.show();
                viewCommentReportModalInstance?.hide(); // Ocultar modal de detalle
            }
        });
        
        // Listener para confirmación final de "Ocultar Comentario"
        $('#finalHideReportedCommentBtn').on('click', function() {
            if (reportedCommentToManageInfo && reportedCommentToManageInfo.action === 'hide') {
                const reportIndex = commentReportData.findIndex(r => r.id === reportedCommentToManageInfo.reportId);
                if (reportIndex !== -1) {
                    commentReportData[reportIndex].status = "Comentario Ocultado";
                    // commentReportData[reportIndex].commentContent = "[Comentario ocultado por moderación]"; // Opcional
                }
                renderCommentReports(commentReportData);
                confirmHideReportedCommentModalInstance?.hide();
                reportedCommentToManageInfo = null;
                currentReportToView = null;
            }
        });

        // Listener para "Marcar Reporte como Revisado"
        $('#markCommentReportAsReviewedBtn').on('click', function() {
            if (currentReportToView) {
                handleReportAction(currentReportToView.id, 'Revisado');
            }
        });

        $('#markTicketAsSolvedBtn').on('click', function() {
            const ticketId = $(this).data('ticket-id');
            if (ticketId) {
                const ticketIndex = supportTicketData.findIndex(t => t.id === ticketId);
                if (ticketIndex !== -1) {
                    supportTicketData[ticketIndex].status = "Solucionado";
                    renderSupportTickets(supportTicketData); 
                    $('#viewSupportTicketModal #ticketDetailStatus').text("Solucionado").attr('class', `badge ${getSupportTicketStatusBadgeClass("Solucionado")}`);
                    $(this).prop('disabled', true); 
                }
            }
        });
        $('#finalClearRecipeReportsBtn').on('click', function() {
            if (recipeToClearReportsInfo) {
                const recipeIndex = recipeData.findIndex(r => r.id === recipeToClearReportsInfo.recipeId);
                if (recipeIndex !== -1) {
                    recipeData[recipeIndex].reports = 0; 
                    renderRecipes(recipeData); 
                    console.log(`Denuncias para receta "${recipeToClearReportsInfo.recipeName}" (ID ${recipeToClearReportsInfo.recipeId}) limpiadas.`);
                }
                confirmClearRecipeReportsModalInstance?.hide();
                recipeToClearReportsInfo = null;
            }
        });
    }
    
    function handleReportAction(reportId, newStatus) {
        if (reportId) {
            const reportIndex = commentReportData.findIndex(r => r.id === reportId);
            if (reportIndex !== -1) {
                commentReportData[reportIndex].status = newStatus;
                console.log(`Simulación: Reporte ${reportId} actualizado a estado "${newStatus}".`);
                renderCommentReports(commentReportData);
            }
            viewCommentReportModalInstance?.hide(); 
            currentReportToView = null;
        }
    }

    function showPermissionDeniedModal(message = "No tienes permiso para realizar esta acción.") { $('#permissionDeniedMessage').text(message); permissionDeniedModalInstance?.show(); }
    function formatDate(dateString) { try { return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return dateString || 'Fecha inválida'; } }
    function getStatusBadgeClass(status) { return status === 'Publicado' ? 'bg-success text-white' : 'bg-warning text-dark'; }
    function getRoleBadgeClass(role) { switch(role) { case 'SuperAdministrador': return 'bg-primary text-white'; case 'Administrador': return 'bg-danger text-white'; default: return 'bg-secondary text-white'; } }
    function getReportStatusBadgeClass(status) { switch(status?.toLowerCase()) { case 'pendiente': return 'bg-warning text-dark'; case 'revisado': return 'bg-success text-white'; case 'ignorado': return 'bg-secondary text-white'; case 'comentario eliminado': return 'bg-info text-dark'; case 'comentario ocultado': return 'bg-info text-dark'; default: return 'bg-light text-dark'; } }
    function getSupportTicketStatusBadgeClass(status) { switch(status?.toLowerCase()) { case 'pendiente': return 'bg-warning text-dark'; case 'solucionado': return 'bg-success text-white'; default: return 'bg-light text-dark'; } }
    function escapeHTML(str) { if (str === null || typeof str === 'undefined') return ''; if (typeof str !== 'string') str = String(str); return $('<div>').text(str).html(); }
    
    function sortTable(column, tableBodyId) {
        if (!tableBodyId) { console.warn("sortTable: tableBodyId no definido"); return; } 
        const oldTableId = currentSort.tableId; // Guardar tabla anterior para limpiar su icono
        currentSort.direction = (currentSort.column === column && currentSort.tableId === tableBodyId && currentSort.direction === 'asc') ? 'desc' : 'asc';
        currentSort.column = column;
        currentSort.tableId = tableBodyId; 
        updateSortIcons(oldTableId); // Pasar la tabla anterior

        let dataToSort, renderFunction;
        switch (tableBodyId) {
            case 'recipeTableBody': dataToSort = [...(recipeData || [])]; renderFunction = renderRecipes; break;
            case 'userTableBody': dataToSort = [...(userData || [])]; renderFunction = renderUsers; break;
            case 'commentReportsTableBody': dataToSort = [...(commentReportData || [])]; renderFunction = renderCommentReports; break;
            case 'supportTicketsTableBody': dataToSort = [...(supportTicketData || [])]; renderFunction = renderSupportTickets; break;
            default: console.warn(`sortTable: tableBodyId desconocido - ${tableBodyId}`); return;
        }
        dataToSort.sort((a, b) => {
            let valA = a[column], valB = b[column];
            if (valA === undefined || valA === null) valA = ''; 
            if (valB === undefined || valB === null) valB = '';
            if (typeof valA === 'string' && column !== 'date' && column !== 'joindate' && column !== 'reportDate' && column !== 'submissionDate') valA = valA.toLowerCase(); // No convertir fechas a minúsculas
            if (typeof valB === 'string' && column !== 'date' && column !== 'joindate' && column !== 'reportDate' && column !== 'submissionDate') valB = valB.toLowerCase();
            
            if (column === 'reports' || column === 'id') { // Tratar 'id' también como numérico
                 valA = parseFloat(valA) || 0;
                 valB = parseFloat(valB) || 0;
            } else if (['date', 'joindate', 'reportDate', 'submissionDate'].includes(column)) { // Ordenar por fecha real
                valA = new Date(valA).getTime() || 0;
                valB = new Date(valB).getTime() || 0;
            }

            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        renderFunction(dataToSort);
    }
    
    function updateSortIcons(previousTableIdForCleanup = null) {
        // Limpiar icono de la tabla anteriormente activa si es diferente a la actual
        if (previousTableIdForCleanup && previousTableIdForCleanup !== currentSort.tableId && document.getElementById(previousTableIdForCleanup)) {
            const prevTabPaneId = previousTableIdForCleanup.replace('TableBody', ''); // e.g., recipes, users
            $(`#${prevTabPaneId}`).find('.sortable i').attr('class', 'fas fa-sort ms-2 text-muted');
        }
        
        // Limpiar todos los iconos de la tabla actualmente activa (antes de poner el nuevo)
        if (currentSort.tableId && document.getElementById(currentSort.tableId)) {
            const currentTabPaneId = currentSort.tableId.replace('TableBody', '');
            $(`#${currentTabPaneId}`).find('.sortable i').attr('class', 'fas fa-sort ms-2 text-muted');
        }
       
        // Poner el icono activo en la columna y tabla actual
        if (currentSort.tableId && currentSort.column && document.getElementById(currentSort.tableId)) {
            const activeTableTabPaneId = currentSort.tableId.replace('TableBody', '');
            const $activeThIcon = $(`#${activeTableTabPaneId}`).find(`.sortable[data-column="${currentSort.column}"] i`);
            if ($activeThIcon.length) $activeThIcon.attr('class', `fas fa-sort-${currentSort.direction === 'asc' ? 'up' : 'down'} ms-2 text-primary`);
        }
    }

    function initialTableMessages() {
        if (!recipeData || recipeData.length === 0) $('#recipeTableBody').html('<tr><td colspan="7" class="text-center text-muted p-3">No hay recetas para mostrar.</td></tr>');
        if (!userData || userData.length === 0) $('#userTableBody').html('<tr><td colspan="7" class="text-center text-muted p-3">No hay usuarios para mostrar.</td></tr>');
        if (!commentReportData || commentReportData.length === 0) $('#commentReportsTableBody').html('<tr><td colspan="6" class="text-center text-muted p-3">No hay reportes de comentarios.</td></tr>');
        if (!supportTicketData || supportTicketData.length === 0) $('#supportTicketsTableBody').html('<tr><td colspan="6" class="text-center text-muted p-3">No hay tickets de soporte.</td></tr>');
    }
    
    init();
});