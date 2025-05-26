// js/recipe.js

document.addEventListener('DOMContentLoaded', () => {
    const recipeDetailContainer = document.getElementById('recipeDetailContainer');
    const commentsSection = document.getElementById('comments-section');
    
    const CURRENT_USER_ID = 'user123'; 
    const IS_USER_LOGGED_IN_RECIPE = true; 

    let currentRecipeData = null; 
    let confirmDeleteRecipeModal = null;
    let confirmReportCommentModal = null;
    let confirmReportRecipeModal = null; // NUEVO: Instancia del modal de denuncia de receta
    let commentToReport = null; 

    function renderRecipe(data) {
        currentRecipeData = data; 
        if (!recipeDetailContainer) return;

        const publishDateFormatted = new Date(data.publishDate).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        let authorActionButtonsHTML = '';
        if (data.currentUserIsAuthor) { // Solo si el usuario actual es el autor
            authorActionButtonsHTML = `
                <div class="recipe-action-buttons btn-group ms-md-auto d-flex gap-2">
                    <a href="formReceta.html?edit=${data.id}" class="btn btn-outline-secondary btn-edit-recipe" title="Editar Receta">
                        <i class="bi bi-pencil-square"></i> Editar
                    </a>
                    <button type="button" class="btn btn-delete-recipe" id="deleteRecipeBtn" title="Eliminar Receta">
                        <i class="bi bi-trash"></i><i class="bi bi-trash-fill"></i> Eliminar
                    </button>
                </div>`;
        }
        
        recipeDetailContainer.innerHTML = `
            <div class="card shadow-lg border-0 overflow-hidden">
                <div class="card-header bg-white border-0 pb-0">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h1 class="h2 mb-1 fw-bold">${escapeHTML(data.title)}</h1>
                            <p class="text-muted lead mb-2">${escapeHTML(data.description)}</p>
                        </div>
                        <div class="d-flex align-items-center recipe-header-actions">
                            <button id="reportRecipeBtn" class="btn btn-report-recipe me-2" title="Denunciar Receta">
                                <i class="bi bi-flag-fill"></i>
                            </button>
                            <button id="favoriteBtn" class="btn btn-outline-secondary border-0 fs-4 p-2 ${data.isFavorite ? 'text-orange' : ''}" title="Guardar en Favoritos">
                                <i class="${data.isFavorite ? 'fas fa-bookmark' : 'far fa-bookmark'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="recipe-image-container mb-4">
                        <img src="${data.imageUrl}" alt="${escapeHTML(data.title)}" class="recipe-image img-fluid rounded-3">
                    </div>
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                        <div class="d-flex align-items-center gap-3 mb-3 mb-md-0 recipe-author-link" style="cursor:pointer;" data-author-id="${data.author.id}">
                            <img src="${data.author.avatarUrl}" alt="${escapeHTML(data.author.name)}" class="avatar">
                            <div>
                                <h3 class="h5 mb-0">${escapeHTML(data.author.name)}</h3>
                                <small class="text-muted">Publicado el ${publishDateFormatted}</small>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <button id="followBtn" class="btn ${data.isFollowingAuthor ? 'btn-orange' : 'btn-outline-orange'}">
                                ${data.isFollowingAuthor ? 'Dejar de seguir' : 'Seguir'}
                            </button>
                            ${authorActionButtonsHTML} 
                        </div>
                    </div>
                    <div class="d-flex flex-wrap justify-content-start gap-3 mb-4 text-muted border-top border-bottom py-3">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-clock me-2 fs-5 text-orange"></i>
                            <span>${escapeHTML(data.prepTime)}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-people me-2 fs-5 text-orange"></i>
                            <span>${escapeHTML(data.servings)}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-fire me-2 fs-5 text-orange"></i>
                            <span>Dificultad: ${escapeHTML(data.difficulty)}</span>
                        </div>
                    </div>
                    <section class="mb-5">
                        <h3 class="h4 mb-3 fw-bold">Ingredientes</h3>
                        <ul class="list-group list-group-flush">
                            ${data.ingredients.map(ing => `<li class="list-group-item bg-orange-10">${escapeHTML(ing)}</li>`).join('')}
                        </ul>
                    </section>
                    <section class="mb-5">
                        <h3 class="h4 mb-3 fw-bold">Preparación</h3>
                        <ol class="list-group list-group-numbered">
                            ${data.preparationSteps.map(step => `<li class="list-group-item bg-orange-10">${escapeHTML(step)}</li>`).join('')}
                        </ol>
                    </section>
                    ${data.chefTips ? `
                    <section class="mb-5">
                        <h3 class="h4 mb-3 fw-bold">Consejos del chef</h3>
                        <div class="chef-tips p-4 rounded-3">
                            <p class="mb-0">${escapeHTML(data.chefTips)}</p>
                        </div>
                    </section>` : ''}
                </div>
                <div class="card-footer bg-white d-flex flex-wrap justify-content-between align-items-center border-0 pt-0 pb-3">
                    <div class="d-flex align-items-center">
                        <button id="likeRecipeBtn" class="btn btn-like-recipe ${data.userHasLiked ? 'liked' : ''}" title="${data.userHasLiked ? 'Quitar Me Gusta' : 'Me Gusta'}">
                            <i class="bi bi-suit-heart"></i>
                            <i class="bi bi-suit-heart-fill"></i>
                        </button>
                        <span id="likesCountDisplay" class="ms-1 text-muted">${data.likesCount} me gusta</span>
                    </div>
                </div>
            </div>`;

        if (commentsSection) commentsSection.style.display = 'block';
        setupRecipeActionListeners();
        if (typeof loadComments === 'function') {
            loadComments(data.id);
        }

        const deleteModalElement = document.getElementById('confirmDeleteRecipeModal');
        if (deleteModalElement) {
            confirmDeleteRecipeModal = bootstrap.Modal.getOrCreateInstance(deleteModalElement);
        }
        const reportCommentModalElement = document.getElementById('confirmReportCommentModal');
        if (reportCommentModalElement) {
            confirmReportCommentModal = bootstrap.Modal.getOrCreateInstance(reportCommentModalElement);
        }
        // NUEVO: Inicializar modal de denuncia de receta
        const reportRecipeModalElement = document.getElementById('confirmReportRecipeModal');
        if (reportRecipeModalElement) {
            confirmReportRecipeModal = bootstrap.Modal.getOrCreateInstance(reportRecipeModalElement);
        }
    }

    function setupRecipeActionListeners() {
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) { 
            favoriteBtn.addEventListener('click', () => {
                currentRecipeData.isFavorite = !currentRecipeData.isFavorite;
                favoriteBtn.innerHTML = `<i class="${currentRecipeData.isFavorite ? 'fas fa-bookmark' : 'far fa-bookmark'}"></i>`;
                favoriteBtn.classList.toggle('text-orange', currentRecipeData.isFavorite);
            });
        }

        const followBtn = document.getElementById('followBtn');
        if (followBtn) { 
            followBtn.addEventListener('click', () => {
                currentRecipeData.isFollowingAuthor = !currentRecipeData.isFollowingAuthor;
                followBtn.textContent = currentRecipeData.isFollowingAuthor ? 'Dejar de seguir' : 'Seguir';
                followBtn.classList.toggle('btn-orange', currentRecipeData.isFollowingAuthor);
                followBtn.classList.toggle('btn-outline-orange', !currentRecipeData.isFollowingAuthor);
            });
        }
        
        const recipeAuthorLink = document.querySelector('.recipe-author-link');
        if (recipeAuthorLink) { 
            recipeAuthorLink.addEventListener('click', function() {
                window.location.href = currentRecipeData.author.profileLink || "profile.html";
            });
        }

        const deleteRecipeBtn = document.getElementById('deleteRecipeBtn');
        if (deleteRecipeBtn) { 
            deleteRecipeBtn.addEventListener('click', () => {
                confirmDeleteRecipeModal?.show();
            });
        }
        const confirmDeleteRecipeBtn = document.getElementById('confirmDeleteRecipeBtn');
        if (confirmDeleteRecipeBtn) {
            confirmDeleteRecipeBtn.addEventListener('click', () => {
                console.log(`Simulación: Eliminando receta ID ${currentRecipeData.id}`);
                confirmDeleteRecipeModal?.hide();
                recipeDetailContainer.innerHTML = `<div class="alert alert-success text-center">Receta "${escapeHTML(currentRecipeData.title)}" eliminada. Serás redirigido en 3 segundos.</div>`;
                setTimeout(() => { window.location.href = 'index.html'; }, 3000);
            });
        }

        const likeRecipeBtn = document.getElementById('likeRecipeBtn');
        const likesCountDisplay = document.getElementById('likesCountDisplay');
        if (likeRecipeBtn && likesCountDisplay) { 
            likeRecipeBtn.addEventListener('click', () => {
                currentRecipeData.userHasLiked = !currentRecipeData.userHasLiked;
                currentRecipeData.likesCount += currentRecipeData.userHasLiked ? 1 : -1;
                likeRecipeBtn.classList.toggle('liked', currentRecipeData.userHasLiked);
                likeRecipeBtn.title = currentRecipeData.userHasLiked ? 'Quitar Me Gusta' : 'Me Gusta';
                likesCountDisplay.textContent = `${currentRecipeData.likesCount} me gusta`;
            });
        }

        // NUEVO: Listener para el botón de denunciar receta
        const reportRecipeBtn = document.getElementById('reportRecipeBtn');
        if (reportRecipeBtn) {
            reportRecipeBtn.addEventListener('click', () => {
                confirmReportRecipeModal?.show();
            });
        }
    }
    
    const commentsListContainer = document.getElementById('commentsListContainer');
    const addCommentForm = document.getElementById('addCommentForm');

    if (IS_USER_LOGGED_IN_RECIPE && addCommentForm) {
        addCommentForm.style.display = 'block';
    }

    function loadComments(recipeId) {
        const recipeComments = typeof mockRecipeComments !== 'undefined' 
            ? mockRecipeComments.filter(comment => comment.recipeId === recipeId)
            : [];
        renderComments(recipeComments);
    }

    function renderComments(comments) {
        if (!commentsListContainer) return;
        commentsListContainer.innerHTML = ''; 
        if (comments.length === 0) {
            const p = document.createElement('p');
            p.className = 'text-muted text-center no-comments-message';
            p.textContent = 'Aún no hay comentarios. ¡Sé el primero!';
            commentsListContainer.appendChild(p);
            return;
        }
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-item mb-3 p-3 border rounded bg-light position-relative';
            commentDiv.setAttribute('data-comment-id', comment.id);
            // Usar Bootstrap Icons para el botón de denunciar comentario también
            commentDiv.innerHTML = `
                <button class="btn btn-sm btn-outline-danger report-comment-btn position-absolute top-0 end-0 m-2" title="Denunciar comentario">
                    <i class="bi bi-flag-fill"></i>
                </button>
                <p class="mb-1"><strong class="comment-username">${escapeHTML(comment.username)}</strong></p>
                <p class="comment-content mb-0">${escapeHTML(comment.content)}</p>
            `;
            commentsListContainer.appendChild(commentDiv);
        });
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    if (addCommentForm) {
        addCommentForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const commentTextarea = document.getElementById('commentText');
            const commentContent = commentTextarea.value.trim();
            if (commentContent && currentRecipeData) {
                console.log(`Simulación: Nuevo comentario para receta ${currentRecipeData.id}: "${commentContent}"`);
                commentTextarea.value = '';
                if (typeof mockRecipeComments !== 'undefined') {
                    mockRecipeComments.push({
                        id: 'temp' + Date.now(), 
                        recipeId: currentRecipeData.id, 
                        username: 'UsuarioActualSimulado', 
                        content: commentContent, 
                        timestamp: new Date().toISOString()
                    });
                }
                loadComments(currentRecipeData.id);
            }
        });
    }

    if (commentsListContainer) {
        commentsListContainer.addEventListener('click', function(event) {
            const reportButton = event.target.closest('.report-comment-btn');
            if (reportButton) {
                const commentItem = reportButton.closest('.comment-item');
                commentToReport = commentItem.getAttribute('data-comment-id'); 
                confirmReportCommentModal?.show();
            }
        });
    }

    const confirmReportCommentBtn = document.getElementById('confirmReportCommentBtn');
    if (confirmReportCommentBtn) {
        confirmReportCommentBtn.addEventListener('click', () => {
            if (commentToReport) {
                console.log(`Simulación: Denunciando comentario ID: ${commentToReport}.`);
                const reportFeedback = document.createElement('div');
                reportFeedback.className = 'alert alert-info alert-dismissible fade show mt-2';
                reportFeedback.setAttribute('role', 'alert');
                reportFeedback.innerHTML = `El comentario ha sido reportado para revisión. <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
                const commentsCardBody = commentsListContainer.closest('.card-body');
                if (commentsCardBody) {
                    commentsCardBody.insertBefore(reportFeedback, commentsListContainer);
                } else {
                    commentsListContainer.prepend(reportFeedback);
                }
                confirmReportCommentModal?.hide();
                commentToReport = null;
            }
        });
    }

    // NUEVO: Manejar confirmación de denuncia de receta
    const confirmReportRecipeBtn = document.getElementById('confirmReportRecipeBtn');
    if (confirmReportRecipeBtn) {
        confirmReportRecipeBtn.addEventListener('click', () => {
            if (currentRecipeData) {
                console.log(`Simulación: Denunciando receta ID: ${currentRecipeData.id} ("${currentRecipeData.title}").`);
                // Aquí iría la llamada AJAX al backend para enviar la denuncia de la receta
                
                const reportFeedback = document.createElement('div');
                reportFeedback.className = 'alert alert-info alert-dismissible fade show mt-3'; // Un poco de margen superior
                reportFeedback.setAttribute('role', 'alert');
                reportFeedback.innerHTML = `La receta "${escapeHTML(currentRecipeData.title)}" ha sido reportada para revisión. <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
                
                // Insertar el feedback, por ejemplo, después del card-header de la receta
                const recipeCardHeader = recipeDetailContainer.querySelector('.card-header');
                if (recipeCardHeader) {
                    recipeCardHeader.parentNode.insertBefore(reportFeedback, recipeCardHeader.nextSibling);
                }

                confirmReportRecipeModal?.hide();
            }
        });
    }


    if (typeof mockRecipeData !== 'undefined') {
        renderRecipe(mockRecipeData);
    } else {
        if(recipeDetailContainer) recipeDetailContainer.innerHTML = '<p class="text-center text-danger">Error: No se pudieron cargar los datos de la receta.</p>';
    }
});