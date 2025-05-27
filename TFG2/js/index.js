// TFG/js/index.js
$(document).ready(function() {
    console.log("index.js: DOM ready. Iniciando script para CookSocial.");

    // --- SECCIÓN: SELECTORES DE UI PARA ESTADO DE LOGIN (Navbar) ---
    // Estos son los elementos del DOM que se mostrarán u ocultarán según si el usuario está logueado.
    const $userAuthButtons = $('#user-auth-buttons');       // Contenedor de botones "Iniciar Sesión" y "Registrarse"
    const $userProfileButtons = $('#user-profile-buttons'); // Contenedor de botones "Publicar Receta", "Notificaciones", "Mi Perfil", "Salir"
    const $navAdminLink = $('#nav-admin-link');             // Elemento <li> que contiene el enlace "Administrar"

    // --- SECCIÓN: FUNCIÓN PARA ACTUALIZAR LA INTERFAZ DE USUARIO (UI) SEGÚN EL ESTADO DE LOGIN ---
    /**
     * Actualiza la visibilidad de los elementos del navbar y otros componentes de la UI
     * basados en si el usuario está logueado y sus datos.
     * @param {object | null} sessionData - El objeto de respuesta de AuthService.checkSession().
     *                                      Contiene { is_logged_in: boolean, data: object (datos del usuario) } o null.
     */
    function updateLoginStatusUI(sessionData) {
        console.log("updateLoginStatusUI: Recibidos datos de sesión para UI:", sessionData);

        if (sessionData && sessionData.is_logged_in && sessionData.data && sessionData.data.user_id) {
            // --- Usuario ESTÁ logueado ---
            const userData = sessionData.data; // Acceso más fácil a los datos del usuario
            console.log("UI Update: Usuario SÍ está logueado. Usuario:", userData.username, "ID Rol:", userData.id_rol);

            // Ocultar botones de "Iniciar Sesión" / "Registrarse"
            if ($userAuthButtons.length) { 
                $userAuthButtons.hide(); 
            } else { 
                console.warn("Elemento #user-auth-buttons no encontrado en el DOM."); 
            }

            // Mostrar botones de "Publicar Receta", "Notificaciones", "Mi Perfil", "Salir"
            if ($userProfileButtons.length) {
                $userProfileButtons.show();
                // Opcional: Personalizar el texto del botón "Mi Perfil" con el nombre de usuario
                // const $profileLinkText = $userProfileButtons.find('a[href="profile.html"] span.d-none.d-md-inline').first();
                // if ($profileLinkText.length) {
                //     $profileLinkText.text(userData.nombre_completo || userData.username);
                // }
            } else { 
                console.warn("Elemento #user-profile-buttons no encontrado en el DOM."); 
            }
            
            // Mostrar/ocultar el enlace "Administrar" según el rol del usuario
            // (Ajusta los ID de rol según tu tabla `roles`: ej. 1=SuperAdmin, 2=Admin)
            if ($navAdminLink.length) {
                if (userData.id_rol == 1 || userData.id_rol == 2) { // Solo visible para roles admin
                    $navAdminLink.show();
                } else {
                    $navAdminLink.hide();
                }
            } else { 
                console.warn("Elemento #nav-admin-link no encontrado en el DOM."); 
            }

        } else {
            // --- Usuario NO está logueado ---
            console.log("UI Update: Usuario NO está logueado.");

            // Mostrar botones de "Iniciar Sesión" / "Registrarse"
            if ($userAuthButtons.length) { 
                $userAuthButtons.show(); 
            } else { 
                console.warn("#user-auth-buttons no encontrado"); 
            }

            // Ocultar botones de "Publicar Receta", "Notificaciones", "Mi Perfil", "Salir"
            if ($userProfileButtons.length) { 
                $userProfileButtons.hide(); 
            } else { 
                console.warn("#user-profile-buttons no encontrado"); 
            }

            // Ocultar el enlace "Administrar"
            if ($navAdminLink.length) { 
                $navAdminLink.hide(); 
            } else { 
                console.warn("#nav-admin-link no encontrado"); 
            }
        }
    }
    
    // --- SECCIÓN: MANEJO DEL BOTÓN DE LOGOUT DEL NAVBAR ---
    // Se asigna el evento click al botón con ID "logoutButton".
    // Este botón debe estar dentro de #user-profile-buttons y se muestra solo a usuarios logueados.
    if ($('#logoutButton').length) {
        $('#logoutButton').on('click', function(e) {
            e.preventDefault(); // Prevenir cualquier acción por defecto del botón (si fuera un link)
            console.log("Botón Logout clickeado.");

            // Verificar que AuthService y su método logout estén disponibles
            if (typeof AuthService !== 'undefined' && AuthService.logout) {
                AuthService.logout() // Llama al método logout del servicio AJAX
                    .done(function(response) { // Se ejecuta si la petición AJAX al backend fue exitosa
                        if (response && response.success) { // Si el backend confirma el logout
                            console.log("Logout exitoso en el servidor:", response.message);
                            updateLoginStatusUI({ is_logged_in: false, data: null }); // Actualizar la UI a estado "no logueado"
                            NotificationsModule.clearNotificationsUI(); // Limpiar el módulo de notificaciones
                            // Opcional: Redirigir a la página de inicio o de login
                            // window.location.href = 'index.html'; 
                            // window.location.reload(); // Para forzar recarga y limpieza completa (a veces necesario)
                        } else {
                            // Si el backend devuelve success:false por alguna razón
                            alert("Error al cerrar sesión en el servidor: " + (response.message || "Error desconocido."));
                        }
                    })
                    .fail(function(jqXHR) { // Se ejecuta si la petición AJAX falla (error de red, 404, 500)
                        alert("Error de comunicación al intentar cerrar sesión. Revisa la consola.");
                        console.error("Error AJAX en logout:", jqXHR.status, jqXHR.statusText, jqXHR.responseText);
                    });
            } else {
                console.error("AuthService.logout no está disponible.");
                alert("Error: La función de logout no está disponible en este momento.");
            }
        });
    }

    // --- SECCIÓN: VERIFICACIÓN DE SESIÓN AL CARGAR LA PÁGINA Y CARGA DE CONTENIDO ---
    /**
     * Orquesta el chequeo de la sesión del usuario y luego inicia la carga del contenido de la página.
     * Es el punto de entrada principal para la lógica de la página después de que el DOM está listo.
     */
    function performSessionCheckAndLoadContent() {
        // Verificar que el AuthService y su método checkSession existan
        if (typeof AuthService !== 'undefined' && AuthService.checkSession) {
            console.log("index.js: Iniciando verificación de sesión con AuthService.checkSession()...");
            AuthService.checkSession() // Llama al backend para ver si hay una sesión activa
                .done(function(response) { // Se ejecuta si la llamada AJAX a checkSession fue exitosa
                    console.log("index.js: Respuesta de checkSession API recibida:", response);
                    // 'response' debería ser el objeto JSON devuelto por api/auth.php?action=check_session
                    // que incluye { success: boolean, is_logged_in: boolean, data: object (datos del usuario) }
                    updateLoginStatusUI(response); // Actualiza la UI del navbar y otros elementos según la respuesta
                    
                    // Si el usuario está logueado y NotificationsModule está disponible, inicializar notificaciones.
                    if (response && response.is_logged_in && response.data) {
                        if (typeof NotificationsModule !== 'undefined' && NotificationsModule.init) {
                            console.log("index.js: Usuario logueado, inicializando NotificationsModule...");
                            NotificationsModule.init(response.data); // Pasa los datos del usuario al módulo de notificaciones
                        } else {
                            console.warn("index.js: NotificationsModule.init no está disponible para inicializar.");
                        }
                    } else {
                        // Si el usuario no está logueado, asegurarse de que la UI de notificaciones esté limpia.
                        if (typeof NotificationsModule !== 'undefined' && NotificationsModule.clearNotificationsUI) {
                             console.log("index.js: Usuario no logueado, limpiando UI de notificaciones.");
                             NotificationsModule.clearNotificationsUI();
                        }
                    }
                })
                .fail(function(jqXHR) { // Se ejecuta si la llamada AJAX a checkSession falló
                    console.error("index.js: Error al verificar la sesión:", jqXHR.status, jqXHR.statusText, jqXHR.responseText);
                    updateLoginStatusUI({ is_logged_in: false, data: null }); // Asumir que no está logueado en caso de error
                    if (typeof NotificationsModule !== 'undefined' && NotificationsModule.clearNotificationsUI) {
                        NotificationsModule.clearNotificationsUI(); // Limpiar notificaciones si hay error
                    }
                })
                .always(function() { // Se ejecuta SIEMPRE después de .done() o .fail()
                    // Este es el lugar seguro para iniciar la carga del contenido principal de la página,
                    // ya que ahora sabemos el estado de autenticación del usuario (o al menos lo hemos intentado).
                    console.log("index.js: Chequeo de sesión finalizado (éxito o fallo). Cargando contenido principal de la página...");
                    loadInitialPageContent(); // Llama a la función que carga recetas, filtros, etc.
                });
        } else {
            // Si AuthService.checkSession no está disponible, es un error de configuración/carga de scripts.
            console.error("index.js: AuthService.checkSession no está disponible. Asumiendo no logueado y cargando contenido.");
            updateLoginStatusUI({ is_logged_in: false, data: null }); // Mostrar UI como no logueado
            if (typeof NotificationsModule !== 'undefined' && NotificationsModule.clearNotificationsUI) {
                NotificationsModule.clearNotificationsUI();
            }
            loadInitialPageContent(); // Intentar cargar contenido igualmente.
        }
    }
    
    // Iniciar el proceso: verificar sesión y luego cargar el contenido de la página.
    performSessionCheckAndLoadContent();


    // --- SECCIÓN: LÓGICA DE CARGA DE CONTENIDO PRINCIPAL DE LA PÁGINA (filtros, recetas, etc.) ---
    /**
     * Carga y renderiza el contenido dinámico de la página index.html
     * (tipos de dieta, recetas populares, tendencias, chefs).
     * Se llama DESPUÉS de que el chequeo de sesión haya finalizado.
     */
    function loadInitialPageContent() {
        console.log("index.js: loadInitialPageContent() iniciado.");

        // Verificar dependencias críticas para esta función
        if (typeof mockIndexData === 'undefined' || !mockIndexData || !mockIndexData.allRecipes) {
            console.error("Error crítico en loadInitialPageContent: mockIndexData (con allRecipes) no está definido.");
            // Mostrar un error en los contenedores de recetas si los datos base no están.
            $('#popularRecipesContainer, #trendingRecipesContainer, #featuredChefsContainer')
                .html('<p class="text-center text-danger col-12">Error: No se pudieron cargar los datos base de recetas.</p>');
            return; 
        }
        // Verificar si la función para cargar dietas desde API está disponible (de get-dietas.js)
        if (typeof fetchDietTypesFromAPI === 'undefined' && typeof loadAndPopulateDietTypes === 'function') { 
            // Esto es una advertencia, ya que loadAndPopulateDietTypes debería manejarlo.
            console.warn("index.js (loadInitialPageContent): fetchDietTypesFromAPI no está definida. El filtro de dietas podría no cargarse desde la API correctamente si loadAndPopulateDietTypes depende de ella directamente.");
        }

        // Selectores para los contenedores de contenido
        const $popularContainer = $('#popularRecipesContainer');
        const $trendingContainer = $('#trendingRecipesContainer');
        const $featuredChefsContainer = $('#featuredChefsContainer');
        const chefs = mockIndexData.chefs || []; 
        
        // Configuración del Slider de Tiempo (si los elementos existen en el DOM)
        const $timeMaxSlider = $('#timeMaxSlider');
        const $timeMaxValueDisplay = $('#timeMaxValueDisplay');
        if ($timeMaxSlider.length && $timeMaxValueDisplay.length) {
            $timeMaxSlider.on('input', function() { $timeMaxValueDisplay.text(formatTimeForDisplaySlider($(this).val())); });
            $timeMaxSlider.trigger('input'); // Para establecer el valor visual inicial
        }

        // Asignar Listeners para los Filtros (si los elementos existen)
        $('#applyFiltersBtn').on('click', filterAndRenderRecipes);
        $('#mainSearchInput').on('keypress', function(e) { if (e.which === 13) { e.preventDefault(); filterAndRenderRecipes(); } });
        $('#categoryFilter, #dietFilter, #difficultyFilter, #sortOrderFilter, #timeMaxSlider').on('change', filterAndRenderRecipes);

        // Carga de Tipos de Dieta y luego Renderizado del resto del Contenido
        let dietTypesPromise;
        if (typeof loadAndPopulateDietTypes === 'function') { // loadAndPopulateDietTypes es la función que llama a fetchDietTypesFromAPI
            console.log("index.js (loadInitialPageContent): Llamando a loadAndPopulateDietTypes...");
            dietTypesPromise = loadAndPopulateDietTypes(); // Esta función debe devolver una Promesa
        } else {
            console.warn("index.js (loadInitialPageContent): La función loadAndPopulateDietTypes no está disponible.");
            dietTypesPromise = $.Deferred().resolve().promise(); // Crear una promesa ya resuelta para que .always() funcione
            const $dietFilterSelect = $('#dietFilter');
            if ($dietFilterSelect.length) { // Si el select existe, mostrar un error o estado por defecto
                 $dietFilterSelect.html('<option value="" selected>Dieta (Todas)</option><option value="" disabled>Servicio de dietas no disponible</option>').prop('disabled', false);
            }
        }

        // Cuando la carga de dietas (o su intento) finalice, renderizar las recetas y chefs.
        dietTypesPromise.always(function() { 
            console.log("index.js (loadInitialPageContent): Promesa de carga de dietas (o fallback) finalizada. Renderizando contenido principal...");
            filterAndRenderRecipes(); // Renderizar recetas (populares, tendencias)
            
            // Renderizar Chefs Destacados
            if ($featuredChefsContainer.length) {
                $featuredChefsContainer.empty(); // Limpiar antes de añadir
                if (chefs && chefs.length > 0) {
                    chefs.slice(0, 6).forEach(chef => $featuredChefsContainer.append(createChefCard(chef)));
                } else {
                    $featuredChefsContainer.html('<p class="text-center text-muted col-12">No hay chefs destacados por el momento.</p>');
                }
            }
        });
    } // Fin de loadInitialPageContent

    // --- SECCIÓN: DEFINICIONES DE FUNCIONES AUXILIARES Y DE RENDERIZADO ---
    // (Estas funciones son llamadas por loadInitialPageContent y los listeners de filtros)

    function formatTimeForDisplaySlider(minutesValue) {
        const minutes = parseInt(minutesValue, 10);
        if (isNaN(minutes) || minutes === 0) return "Cualquiera";
        if (minutes >= 180) return "+3 horas";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        let timeString = "";
        if (h > 0) timeString += `${h}h `;
        if (m > 0) timeString += `${m}min`;
        return timeString.trim() || "0 min";
    }

    function escapeHTML(str) {
        if (str === null || typeof str === 'undefined') return '';
        // Usar un div temporal para que el navegador maneje el escape. Es seguro.
        return $('<div></div>').text(String(str)).html();
    }

    function createRecipeCard(recipe) { /* tarjeta de receta */ 
        const $card = $('<div>').addClass('col');
        const recipeLink = `recipe.html?id=${recipe.id || ''}`;
        const authorProfileLink = `profile.html?userId=${recipe.authorId || ''}`;
        const cardHtml = `
            <div class="card h-100 shadow-sm recipe-card">
                <a href="${recipeLink}" class="text-decoration-none">
                    <img src="${escapeHTML(recipe.image || 'resources/default-recipe.jpg')}" class="card-img-top" alt="${escapeHTML(recipe.title || 'Receta sin título')}">
                </a>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">
                        <a href="${recipeLink}" class="text-dark text-decoration-none stretched-link">${escapeHTML(recipe.title || 'Receta')}</a>
                    </h5>
                    <p class="card-text text-muted small mb-2">
                        Por: <a href="${authorProfileLink}" class="text-orange text-decoration-none">${escapeHTML(recipe.author || 'Autor desconocido')}</a>
                    </p>
                    <div class="recipe-card-footer mt-auto d-flex justify-content-between align-items-center">
                        <span class="rating text-danger"><i class="fas fa-heart me-1"></i>${recipe.likes || 0}</span>
                        <span class="badge bg-light text-dark"><i class="far fa-clock me-1"></i>${escapeHTML(recipe.time || 'N/A')}</span>
                    </div>
                </div>
            </div>`;
        $card.html(cardHtml);
        return $card;
    }

    function createChefCard(chef) { /* tarjeta de chef */
        const $card = $('<div>').addClass('col');
        const chefProfileLink = `profile.html?userId=${chef.id || ''}`;
        const cardHtml = `
            <div class="card h-100 shadow-sm chef-card">
                <div class="card-body text-center d-flex flex-column align-items-center">
                    <a href="${chefProfileLink}" class="text-decoration-none">
                        <img src="${escapeHTML(chef.avatar || 'resources/default-avatar.png')}" alt="${escapeHTML(chef.name || 'Chef')}" class="avatar mb-3 img-thumbnail p-1 rounded-circle" style="width: 80px; height: 80px; object-fit: cover;">
                    </a>
                    <h5 class="card-title mb-1">
                        <a href="${chefProfileLink}" class="text-dark text-decoration-none stretched-link">${escapeHTML(chef.name || 'Chef Anónimo')}</a>
                    </h5>
                    <p class="card-text text-muted small">${escapeHTML(chef.followers || '0')} seguidores</p>
                </div>
            </div>`;
        $card.html(cardHtml);
        return $card;
    }

    function renderRecipeCards($container, recipesToRender, emptyMessage) {
        if (!$container || !$container.length) {
            console.warn("renderRecipeCards: Contenedor no encontrado para renderizar recetas.");
            return;
        }
        $container.empty();
        if (recipesToRender && recipesToRender.length > 0) {
            recipesToRender.forEach(recipe => $container.append(createRecipeCard(recipe)));
        } else {
            $container.html(`<div class="col-12"><p class="text-center text-muted p-3">${emptyMessage}</p></div>`);
        }
    }
    
    function filterAndRenderRecipes() {
        console.log("index.js: filterAndRenderRecipes() llamado para filtrar y mostrar recetas.");
        const baseRecipes = (typeof mockIndexData !== 'undefined' && mockIndexData.allRecipes) ? [...mockIndexData.allRecipes] : [];
        
        const $mainSearchInput = $('#mainSearchInput');
        const $timeMaxSlider = $('#timeMaxSlider');
        const $categoryFilter = $('#categoryFilter');
        const $dietFilterSelect = $('#dietFilter'); 
        const $difficultyFilter = $('#difficultyFilter');
        const $sortOrderFilter = $('#sortOrderFilter');
        const $popularContainer = $('#popularRecipesContainer');
        const $trendingContainer = $('#trendingRecipesContainer');

        const searchTerm = $mainSearchInput.length ? $mainSearchInput.val().toLowerCase().trim() : "";
        const maxTimeSelected = $timeMaxSlider.length ? parseInt($timeMaxSlider.val(), 10) : 0;
        const selectedCategory = $categoryFilter.length ? $categoryFilter.val() : "";
        const selectedDiet = $dietFilterSelect.length ? $dietFilterSelect.val() : "";
        const selectedDifficulty = $difficultyFilter.length ? $difficultyFilter.val() : "";
        const sortOrder = $sortOrderFilter.length ? $sortOrderFilter.val() : "popularity";

        let filteredRecipes = [...baseRecipes];
        if (searchTerm) { filteredRecipes = filteredRecipes.filter(r => (r.title && r.title.toLowerCase().includes(searchTerm)) || (r.author && r.author.toLowerCase().includes(searchTerm))); }
        if (maxTimeSelected > 0 && maxTimeSelected < 180) { filteredRecipes = filteredRecipes.filter(r => typeof r.timeInMinutes === 'number' && r.timeInMinutes <= maxTimeSelected); }
        if (selectedCategory) { filteredRecipes = filteredRecipes.filter(r => r.category === selectedCategory); }
        if (selectedDiet) { filteredRecipes = filteredRecipes.filter(r => r.diet === selectedDiet); }
        if (selectedDifficulty) { filteredRecipes = filteredRecipes.filter(r => r.difficulty === selectedDifficulty); }
        
        switch (sortOrder) {
            case 'time_asc': filteredRecipes.sort((a, b) => (a.timeInMinutes || Infinity) - (b.timeInMinutes || Infinity)); break;
            case 'time_desc': filteredRecipes.sort((a, b) => (b.timeInMinutes || 0) - (a.timeInMinutes || 0)); break;
            case 'recent': filteredRecipes.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()); break;
            case 'popularity': default: filteredRecipes.sort((a, b) => (b.likes || 0) - (a.likes || 0)); break;
        }

        if ($popularContainer.length) renderRecipeCards($popularContainer, filteredRecipes.slice(0, 6), "No se encontraron recetas populares con estos filtros.");
        
        if ($trendingContainer.length) {
            const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const trendingFromFiltered = filteredRecipes
                .filter(r => new Date(r.publishDate) >= oneWeekAgo)
                .sort((a,b) => (b.likes || 0) - (a.likes || 0)) // Ejemplo: tendencia = recientes + populares
                .slice(0, 6); 
            renderRecipeCards($trendingContainer, trendingFromFiltered, "No se encontraron tendencias recientes con estos filtros.");
        }
        console.log("index.js: filterAndRenderRecipes() finalizado.");
    }

    function loadAndPopulateDietTypes() {
        const $dietFilterSelect = $('#dietFilter');
        if (!$dietFilterSelect.length) { 
            console.warn("loadAndPopulateDietTypes: Select #dietFilter no encontrado.");
            return $.Deferred().resolve().promise(); // No hacer nada si el select no existe
        }
        if (typeof fetchDietTypesFromAPI !== 'function') {
            console.warn("loadAndPopulateDietTypes: La función fetchDietTypesFromAPI no está definida. (de get-dietas.js)");
            $dietFilterSelect.html('<option value="" selected>Dieta (Todas)</option><option value="" disabled>Error al cargar dietas</option>').prop('disabled', false);
            return $.Deferred().reject({ message: "Servicio de carga de dietas no disponible." }).promise();
        }
        
        console.log("loadAndPopulateDietTypes: Iniciando carga de tipos de dieta desde API...");
        $dietFilterSelect.prop('disabled', true).html('<option value="">Cargando dietas...</option>');
        
        return fetchDietTypesFromAPI() // Esta función es de get-dietas.js y devuelve una promesa $.ajax
            .done(function(response) {
                console.log("loadAndPopulateDietTypes: Respuesta de API de tipos de dieta:", response);
                $dietFilterSelect.empty().prop('disabled', false); 
                $dietFilterSelect.append($('<option>', { value: '', text: 'Dieta (Todas)' }).prop('selected', true));
                if (response && response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
                    $.each(response.data, function(index, dieta) {
                        // Usar dieta.id (o dieta.slug_dieta si tu API lo provee y es lo que usas en mockData)
                        $dietFilterSelect.append($('<option>', { 
                            value: escapeHTML(String(dieta.id)), // o dieta.slug_dieta
                            text: escapeHTML(dieta.nombre_dieta) 
                        }));
                    });
                } else {
                    console.warn("loadAndPopulateDietTypes: No se cargaron datos de dietas válidos o la respuesta no fue exitosa.", response ? response.message : "Sin mensaje de respuesta.");
                    $dietFilterSelect.append($('<option value="" disabled>No hay tipos de dieta</option>'));
                }
            })
            .fail(function(jqXHR) {
                console.error("loadAndPopulateDietTypes: Falló la petición AJAX para cargar tipos de dieta.", jqXHR);
                $dietFilterSelect.prop('disabled', false).html('<option value="">Error al cargar dietas</option>');
                // La promesa ya está rechazada, .always() en la cadena principal se ejecutará.
            });
    }

}); // Fin de $(document).ready() para index.js