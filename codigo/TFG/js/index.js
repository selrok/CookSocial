// js/index.js
$(document).ready(function() {
    // Mensaje inicial para confirmar que este script se está ejecutando
    console.log("index.js: DOM ready. Iniciando script.");

    // --- PASO 1: VERIFICAR DEPENDENCIAS Y DATOS INICIALES ---
    if (typeof jQuery === 'undefined') { console.error("FATAL ERROR: jQuery no está cargado."); alert("Error crítico: Falta jQuery."); return; }
    console.log("index.js: jQuery detectado.");
    if (typeof bootstrap === 'undefined' || typeof bootstrap.Modal !== 'function') { console.warn("Advertencia: Bootstrap JS no está completamente cargado."); }
    else { console.log("index.js: Bootstrap JS detectado."); }
    
    if (typeof mockIndexData === 'undefined' || !mockIndexData || !mockIndexData.allRecipes) {
        console.error("CRITICAL ERROR: mockIndexData o mockIndexData.allRecipes no está definido o es null. Verifica que js_data/index-data.js se carga ANTES que index.js, no tenga errores y defina 'mockIndexData'.");
        $('#popularRecipesContainer, #trendingRecipesContainer, #featuredChefsContainer').html('<p class="text-center text-danger p-3">Error crítico: No se pudieron cargar los datos base de recetas.</p>');
        return; 
    }
    console.log("index.js: mockIndexData cargado. Recetas base:", mockIndexData.allRecipes.length);

    // MODIFICADO: Verificar la nueva función de get-dietas.js
    if (typeof fetchDietTypesFromAPI === 'undefined' || typeof fetchDietTypesFromAPI !== 'function' ) { 
        console.error("CRITICAL ERROR: fetchDietTypesFromAPI no está definida. Asegúrate de que js/ajax/get-dietas.js se carga ANTES que index.js y define 'fetchDietTypesFromAPI'.");
        $('#dietFilter').prop('disabled', true).html('<option value="">Error servicio dietas</option>');
    } else {
        console.log("index.js: fetchDietTypesFromAPI (de get-dietas.js) detectado.");
    }

    const baseRecipes = mockIndexData.allRecipes ? [...mockIndexData.allRecipes] : [];
    const chefs = mockIndexData.chefs || [];

    const $mainSearchInput = $('#mainSearchInput');
    const $timeMaxSlider = $('#timeMaxSlider');
    const $timeMaxValueDisplay = $('#timeMaxValueDisplay');
    const $categoryFilter = $('#categoryFilter');
    const $dietFilterSelect = $('#dietFilter'); 
    const $difficultyFilter = $('#difficultyFilter');
    const $sortOrderFilter = $('#sortOrderFilter');
    const $applyFiltersBtn = $('#applyFiltersBtn');
    const $popularContainer = $('#popularRecipesContainer');
    const $trendingContainer = $('#trendingRecipesContainer');
    const $featuredChefsContainer = $('#featuredChefsContainer');

    function formatTimeForDisplaySlider(minutes) {
        const numMinutes = parseInt(minutes);
        if (numMinutes === 0) return "Cualquiera"; 
        if (numMinutes >= 180) return "+3 horas"; 
        const h = Math.floor(numMinutes / 60);
        const m = numMinutes % 60;
        let timeString = "";
        if (h > 0) timeString += `${h}h `;
        if (m > 0) timeString += `${m}min`;
        return timeString.trim() || "0 min";
    }

    function filterAndRenderRecipes() {
        console.log("index.js: filterAndRenderRecipes() INICIO.");
        const searchTerm = $mainSearchInput.val().toLowerCase().trim();
        const maxTimeSelected = parseInt($timeMaxSlider.val());
        const selectedCategory = $categoryFilter.val();
        const selectedDiet = $dietFilterSelect.val(); 
        const selectedDifficulty = $difficultyFilter.val();
        const sortOrder = $sortOrderFilter.val();

        console.log("index.js: Filtros aplicados:", {searchTerm, maxTimeSelected, selectedCategory, selectedDiet, selectedDifficulty, sortOrder});
        let filteredRecipes = [...baseRecipes]; 

        if (searchTerm) {
            filteredRecipes = filteredRecipes.filter(recipe => 
                (recipe.title && recipe.title.toLowerCase().includes(searchTerm)) ||
                (recipe.author && recipe.author.toLowerCase().includes(searchTerm)) ||
                (recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.some(ing => String(ing).toLowerCase().includes(searchTerm)))
            );
        }

        if (maxTimeSelected > 0 && maxTimeSelected < 180) { 
            filteredRecipes = filteredRecipes.filter(recipe => {
                const recipeTime = recipe.timeInMinutes;
                return typeof recipeTime === 'number' && recipeTime <= maxTimeSelected;
            });
        }
        
        if (selectedCategory) filteredRecipes = filteredRecipes.filter(r => r.category === selectedCategory);
        // Ajuste importante aquí para el filtro de dieta:
        // Asegúrate que el 'value' de las opciones de dieta (ej. 'vegetarian', 'vegan')
        // coincida con lo que tienes en recipe.diet en mockIndexData.allRecipes
        if (selectedDiet) {
             console.log("Filtrando por dieta:", selectedDiet);
             filteredRecipes = filteredRecipes.filter(r => {
                 console.log(`  Receta ${r.title}, dieta: ${r.diet}, coincide? ${r.diet === selectedDiet}`);
                 return r.diet === selectedDiet;
             });
        }
        if (selectedDifficulty) filteredRecipes = filteredRecipes.filter(r => r.difficulty === selectedDifficulty);

        switch (sortOrder) {
            case 'time_asc': filteredRecipes.sort((a, b) => (a.timeInMinutes || 0) - (b.timeInMinutes || 0)); break;
            case 'time_desc': filteredRecipes.sort((a, b) => (b.timeInMinutes || 0) - (a.timeInMinutes || 0)); break;
            case 'recent': filteredRecipes.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate)); break;
            case 'popularity': default: filteredRecipes.sort((a, b) => (b.likes || 0) - (a.likes || 0)); break;
        }
        
        console.log("index.js: Número de recetas después de filtrar y ordenar:", filteredRecipes.length);
        
        renderRecipeCards($popularContainer, filteredRecipes, "No hay recetas populares que coincidan.");
        
        const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const trendingFromFiltered = filteredRecipes.filter(recipe => new Date(recipe.publishDate) >= oneWeekAgo).slice(0, 9); 
        renderRecipeCards($trendingContainer, trendingFromFiltered, "No hay tendencias que coincidan.");
        console.log("index.js: filterAndRenderRecipes() FIN.");
    }

    function renderRecipeCards($container, recipesToRender, emptyMessage) {
        $container.empty();
        if (recipesToRender && recipesToRender.length > 0) {
            recipesToRender.forEach(recipe => $container.append(createRecipeCard(recipe)));
        } else {
            $container.html(`<p class="text-center text-muted placeholder-recipes">${emptyMessage}</p>`);
        }
    }

    function createRecipeCard(recipe) {
        const $card = $('<div>').addClass('col');
        const recipeLink = `recipe.html?id=${recipe.id || ''}`;
        const authorProfileLink = `profile.html?userId=${recipe.authorId || ''}`;
        const cardHtml = `
            <div class="card h-100 shadow-sm">
                <a href="${recipeLink}" class="text-decoration-none">
                    <img src="${recipe.image || 'resources/default-recipe.jpg'}" class="card-img-top" alt="${escapeHTML(recipe.title || 'Receta sin título')}">
                </a>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">
                        <a href="${recipeLink}" class="text-dark text-decoration-none stretched-link">${escapeHTML(recipe.title || 'Receta')}</a>
                    </h5>
                    <p class="card-text text-muted small mb-2">
                        Por: <a href="${authorProfileLink}" class="text-orange text-decoration-none">${escapeHTML(recipe.author || 'Autor desconocido')}</a>
                    </p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="rating text-danger">
                            <i class="fas fa-heart"></i> ${recipe.likes || 0}
                        </span>
                        <span class="badge bg-light text-dark">
                            <i class="far fa-clock"></i> ${escapeHTML(recipe.time || 'N/A')}
                        </span>
                    </div>
                </div>
            </div>`;
        $card.html(cardHtml);
        return $card;
    }

    function createChefCard(chef) {
        const $card = $('<div>').addClass('col');
        const chefProfileLink = `profile.html?userId=${chef.id || ''}`;
        const cardHtml = `
            <div class="card h-100 shadow-sm">
                <div class="card-body text-center">
                    <a href="${chefProfileLink}" class="text-decoration-none">
                        <img src="${chef.avatar || 'resources/default-avatar.png'}" alt="${escapeHTML(chef.name || 'Chef')}" class="avatar mb-3 img-thumbnail p-1">
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

    function escapeHTML(str) {
        if (str === null || typeof str === 'undefined') return '';
        return $('<div>').text(String(str)).html();
    }
    
    $timeMaxSlider.on('input', function() { $timeMaxValueDisplay.text(formatTimeForDisplaySlider($(this).val())); });
    $timeMaxSlider.trigger('input'); 

    $applyFiltersBtn.on('click', filterAndRenderRecipes);
    $mainSearchInput.on('keypress', function(e) { if (e.which === 13) filterAndRenderRecipes(); });
    $('#categoryFilter, #dietFilter, #difficultyFilter, #sortOrderFilter, #timeMaxSlider').on('change', filterAndRenderRecipes);

    // --- MODIFICADO: Lógica para cargar tipos de dieta ---
    function loadAndPopulateDietTypes() {
        // MODIFICADO: Verificar si la función fetchDietTypesFromAPI está disponible
        if (typeof fetchDietTypesFromAPI === 'undefined' || typeof fetchDietTypesFromAPI !== 'function' || !$dietFilterSelect.length) {
            console.warn("index.js: No se puede poblar select de dietas: fetchDietTypesFromAPI o elemento select no encontrado.");
            if ($dietFilterSelect.length && ($dietFilterSelect.children('option').length === 0 || $dietFilterSelect.find('option[value=""]').text().toLowerCase().includes("cargando"))) {
                 $dietFilterSelect.html('<option value="" selected>Dieta (Todas)</option><option value="" disabled>Error al cargar</option>').prop('disabled', false);
            }
            // Devolver una promesa rechazada para que .always() se ejecute en loadInitialContent
            return $.Deferred().reject({ message: "Servicio de dietas no disponible" }).promise();
        }

        $dietFilterSelect.prop('disabled', true).html('<option value="">Cargando dietas...</option>');
        console.log("index.js: Iniciando carga de tipos de dieta vía fetchDietTypesFromAPI()...");

        // MODIFICADO: Llamar a la nueva función
        return fetchDietTypesFromAPI()
            .then(function(response) { 
                console.log("index.js (AJAX .then): Respuesta de tipos de dieta RECIBIDA:", response);
                $dietFilterSelect.empty().prop('disabled', false); 
                
                $dietFilterSelect.append($('<option>', { value: '', text: 'Dieta (Todas)' }).prop('selected', true));

                if (response && response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
                    console.log("index.js: Poblando select de dietas con", response.data.length, "elementos.");
                    
                    $.each(response.data, function(index, dieta) {
                        console.log(`  Procesando dieta ${index}:`, dieta);
                        
                        // ASUNCIÓN CLAVE: La API devuelve 'id' que se usará como `value`
                        // y 'nombre_dieta' para el texto.
                        // Es CRUCIAL que el `dieta.id` devuelto por la API
                        // coincida con los valores de 'diet' en tus `mockIndexData.allRecipes`
                        // (ej. si la API devuelve id=1 y nombre="Vegetariana", pero en tus recetas usas diet="vegetarian",
                        // tendrás que mapear esto o hacer que la API devuelva 'vegetarian' como id/slug).
                        // En tu PHP de ejemplo (get_diet_types.php) devuelves 'id' y 'nombre_dieta'.
                        // Y en tu mockData tienes 'diet: "omnivore"', 'diet: "vegetarian"', etc.
                        // ¡Estos deben coincidir o el filtro de dieta no funcionará!
                        // Idealmente, la API debería devolver un `slug` (ej. "vegetarian") que sea el mismo que usas en `mockIndexData`.
                        
                        let optionValue = dieta.id; // Directamente el ID de la base de datos
                        let optionText = dieta.nombre_dieta;

                        // SI TU API DEVUELVE ID NUMÉRICO PERO NECESITAS SLUGS PARA FILTRAR:
                        // Necesitarías una lógica de mapeo aquí o, mejor, que tu API devuelva el slug.
                        // Ejemplo de mapeo (NO IDEAL, MEJOR EN API):
                        // if (dieta.id == 1 && dieta.nombre_dieta.toLowerCase().includes("omnívora")) optionValue = "omnivore";
                        // else if (dieta.id == 2 && dieta.nombre_dieta.toLowerCase().includes("vegetariana")) optionValue = "vegetarian";
                        // etc.

                        // Lo que tienes en `index-data.js` es 'diet: "omnivore"', 'diet: "vegetarian"', 'diet: "vegan"'.
                        // Por lo tanto, tu API get_diet_types.php debe devolver estos strings como el 'id' (o un campo 'slug')
                        // para que el filtro funcione directamente.
                        // Si tu `tipos_dieta_receta.id` en la DB son strings como "vegetarian", entonces `optionValue = dieta.id` está bien.
                        // Si son números, necesitarás el mapeo o modificar la API.
                        // Por simplicidad para esta prueba, vamos a asumir que tu PHP ya devuelve el slug/string correcto en `dieta.id` o añades un `dieta.slug`.
                        // Si la API devuelve un ID numérico, este console.log es importante:
                        console.log(`    Añadiendo opción: value="${escapeHTML(String(optionValue))}", text="${escapeHTML(optionText)}" -- ¡ASEGÚRATE QUE EL VALOR COINCIDA CON recipe.diet EN mockIndexData!`);


                        if(optionValue && optionText) {
                            $dietFilterSelect.append($('<option>', {
                                value: escapeHTML(String(optionValue)), // Asegurar que sea string
                                text: escapeHTML(optionText)
                            }));
                        } else {
                            console.warn("    Opción de dieta omitida por falta de valor o texto:", dieta);
                        }
                    });
                } else {
                    const message = response ? (response.message || (response.data && response.data.length === 0 ? "No hay dietas." : "Respuesta vacía o no exitosa.")) : "Respuesta indefinida.";
                    console.warn("index.js: No se cargaron tipos de dieta válidos. Mensaje:", message);
                }
            })
            .catch(function(jqXHR) { 
                let userMessage;
                if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.message) {
                    console.error("index.js (AJAX .catch): Error del servidor (JSON):", jqXHR.responseJSON.message);
                    userMessage = jqXHR.responseJSON.message;
                } else if (jqXHR && jqXHR.statusText) { 
                    console.error("index.js (AJAX .catch): Fallo de red/HTTP. Status:", jqXHR.status, "Texto:", jqXHR.statusText, "Respuesta:", jqXHR.responseText);
                    userMessage = `Error de red: ${jqXHR.statusText} (${jqXHR.status})`;
                } else {
                     console.error("index.js (AJAX .catch): Error desconocido al cargar dietas. Info:", jqXHR);
                     userMessage = "Error desconocido al cargar dietas.";
                }
                $dietFilterSelect.prop('disabled', false).html(`<option value="">${escapeHTML(userMessage)}</option>`);
            });
    }
    
    function loadInitialContent() {
        console.log("index.js: loadInitialContent() llamado.");
        
        const dietTypesPromise = loadAndPopulateDietTypes(); 

        dietTypesPromise.always(function(dataOrjqXHR, textStatus, jqXHROrErrorThrown) { 
            console.log("index.js: Promesa de loadAndPopulateDietTypes finalizada. Status del always:", textStatus, ". Renderizando contenido principal...");
            // Forzar el renderizado incluso si las dietas fallaron, para mostrar el resto.
            filterAndRenderRecipes(); 
            
            $featuredChefsContainer.empty();
            if (chefs && chefs.length > 0) {
                chefs.slice(0, 9).forEach(chef => $featuredChefsContainer.append(createChefCard(chef)));
            } else {
                $featuredChefsContainer.html('<p class="text-center text-muted placeholder-chefs">No hay chefs destacados.</p>');
            }
        });
    }

    loadInitialContent(); 
    console.log("index.js: Script completamente configurado y listeners listos.");
});