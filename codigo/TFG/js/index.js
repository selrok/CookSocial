// TFG/js/index.js
$(document).ready(function() {
    console.log("index.js: DOM ready. Esperando evento 'sessionChecked' desde notifications.js.");

    // Escuchar el evento personalizado disparado por notifications.js
    $(document).on('sessionChecked', function(event, sessionResponse) {
        console.log("index.js: Evento 'sessionChecked' recibido. Datos de sesión:", sessionResponse);
        loadInitialPageContent(sessionResponse); 
    });

    // --- SECCIÓN: LÓGICA DE CARGA DE CONTENIDO ESPECÍFICO DE INDEX.HTML ---
    function loadInitialPageContent(sessionData) {
        // Verificar dependencias para el contenido del index
        if (typeof mockIndexData === 'undefined' || !mockIndexData || !mockIndexData.allRecipes) {
            console.error("index.js: Error crítico - mockIndexData no disponible.");
            $('#popularRecipesContainer, #trendingRecipesContainer, #featuredChefsContainer')
                .html('<p class="text-center text-danger col-12">Error: No se pudieron cargar los datos base.</p>');
            return; 
        }

        // Verificar si las funciones para cargar tipos de dieta existen
        if (typeof fetchDietTypesFromAPI === 'undefined' || typeof loadAndPopulateDietTypes !== 'function') {
            console.warn("index.js: Funciones para cargar tipos de dieta no disponibles. El filtro de dietas podría no funcionar desde API.");
        }

        // Selectores para los elementos de contenido de la página index
        const $popularContainer = $('#popularRecipesContainer');
        const $trendingContainer = $('#trendingRecipesContainer');
        const $featuredChefsContainer = $('#featuredChefsContainer');
        const chefs = mockIndexData.chefs || [];
        
        // Configuración del Slider de Tiempo y Listeners de Filtros
        const $timeMaxSlider = $('#timeMaxSlider');
        const $timeMaxValueDisplay = $('#timeMaxValueDisplay');
        
        if ($timeMaxSlider.length && $timeMaxValueDisplay.length) {
            $timeMaxSlider.on('input', function() {
                $timeMaxValueDisplay.text(formatTimeForDisplaySlider($(this).val()));
            });
            $timeMaxSlider.trigger('input');
        }

        $('#applyFiltersBtn').on('click', filterAndRenderRecipes);
        $('#mainSearchInput').on('keypress', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                filterAndRenderRecipes();
            }
        });
        
        $('#categoryFilter, #dietFilter, #difficultyFilter, #sortOrderFilter, #timeMaxSlider')
            .on('change', filterAndRenderRecipes);

        // Carga de Tipos de Dieta (debe devolver una promesa)
        let dietTypesPromise;
        if (typeof loadAndPopulateDietTypes === 'function') {
            dietTypesPromise = loadAndPopulateDietTypes();
        } else {
            dietTypesPromise = $.Deferred().resolve().promise();
            const $dietFilterSelect = $('#dietFilter');
            if ($dietFilterSelect.length) {
                $dietFilterSelect.html(
                    '<option value="" selected>Dieta (Todas)</option>' +
                    '<option value="" disabled>Servicio no disponible</option>'
                ).prop('disabled', false);
            }
        }

        // Cuando las dietas se cargan (o el intento falla), renderizar el resto
        dietTypesPromise.always(function() {
            filterAndRenderRecipes();
            
            // Renderizar Chefs Destacados
            if ($featuredChefsContainer.length) {
                $featuredChefsContainer.empty();
                if (chefs && chefs.length > 0) {
                    chefs.slice(0, 9).forEach(chef => {
                        $featuredChefsContainer.append(createChefCard(chef));
                    });
                } else { 
                    $featuredChefsContainer.html(
                        '<p class="text-center text-muted col-12">No hay chefs destacados en este momento.</p>'
                    ); 
                }
            }
        });
    }

    // --- FUNCIONES AUXILIARES ---
    function formatTimeForDisplaySlider(minutesValue) {
        const m = parseInt(minutesValue, 10);
        if (isNaN(m) || m === 0) return "Cualquiera";
        if (m >= 180) return "+3h";
        
        const h = Math.floor(m / 60);
        const rM = m % 60;
        let tS = "";
        
        if (h > 0) tS += `${h}h `;
        if (rM > 0) tS += `${rM}min`;
        
        return tS.trim() || "0min";
    }

        function createRecipeCard(recipe) {
        const $c = $('<div>').addClass('col');
        const rL = `recipe.html?id=${recipe.id || ''}`;
        const aL = `profile.html?userId=${recipe.authorId || ''}`;
        const cH = `
            <div class="card h-100 shadow-sm recipe-card">
                <a href="${rL}" class="text-decoration-none">
                    <img src="${escapeHTML(recipe.image || 'resources/default-recipe.jpg')}" 
                         class="card-img-top" 
                         alt="${escapeHTML(recipe.title || 'R')}">
                </a>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">
                        <a href="${rL}" class="text-dark stretched-link text-decoration-none"> 
                            ${escapeHTML(recipe.title || 'R')}
                        </a>
                    </h5>
                    <p class="card-text text-muted small mb-2">
                        Por:
                        <a href="${aL}" class="text-orange text-decoration-none"> 
                            ${escapeHTML(recipe.author || 'Autor X')}
                        </a>
                    </p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="rating text-danger">
                            <i class="fas fa-heart me-1"></i>${recipe.likes || 0}
                        </span>
                        <span class="badge bg-light text-dark">
                            <i class="far fa-clock me-1"></i>${escapeHTML(recipe.time || 'N/A')}
                        </span>
                    </div>
                </div>
            </div>
        `;
        $c.html(cH);
        return $c;
    }

        function createChefCard(chef) {
        const $c = $('<div>').addClass('col');
        const cL = `profile.html?userId=${chef.id || ''}`;
        // Asegúrate de que los enlaces <a> tengan la clase 'text-decoration-none'
        const cH = `
            <div class="card h-100 shadow-sm chef-card">
                <div class="card-body text-center d-flex flex-column align-items-center">
                    <a href="${cL}" class="text-decoration-none"> 
                        <img src="${escapeHTML(chef.avatar || 'resources/default-avatar.png')}" 
                             alt="${escapeHTML(chef.name || 'Chef')}" 
                             class="avatar mb-3 img-thumbnail p-1 rounded-circle" 
                             style="width:80px;height:80px;object-fit:cover;">
                    </a>
                    <h5 class="card-title mb-1">
                        <a href="${cL}" class="text-dark stretched-link text-decoration-none"> 
                            ${escapeHTML(chef.name || 'Chef X')}
                        </a>
                    </h5>
                    <p class="card-text text-muted small">
                        ${escapeHTML(chef.followers || '0')} seguidores
                    </p>
                </div>
            </div>
        `;
        $c.html(cH);
        return $c;
    }

    function renderRecipeCards($con, recipes, msg) {
        if (!$con || !$con.length) return;
        
        $con.empty();
        
        if (recipes && recipes.length > 0) {
            recipes.forEach(r => $con.append(createRecipeCard(r)));
        } else {
            $con.html(`<div class="col-12"><p class="text-center text-muted p-3">${msg}</p></div>`);
        }
    }
    
    function filterAndRenderRecipes() {
        const baseR = (typeof mockIndexData !== 'undefined' && mockIndexData.allRecipes) 
            ? [...mockIndexData.allRecipes] 
            : [];
        
        const $mainSearch = $('#mainSearchInput');
        const $timeSlider = $('#timeMaxSlider');
        const $catFilter = $('#categoryFilter');
        const $dietFilter = $('#dietFilter');
        const $diffFilter = $('#difficultyFilter');
        const $sortFilter = $('#sortOrderFilter');
        const $popCon = $('#popularRecipesContainer');
        const $trendCon = $('#trendingRecipesContainer');
        
        let fR = [...baseR];
        
        // Obtener valores de los filtros
        const sT = $mainSearch.length ? $mainSearch.val().toLowerCase().trim() : "";
        const maxT = $timeSlider.length ? parseInt($timeSlider.val(), 10) : 0;
        const selCat = $catFilter.length ? $catFilter.val() : "";
        const selDiet = $dietFilter.length ? $dietFilter.val() : "";
        const selDiff = $diffFilter.length ? $diffFilter.val() : "";
        const sortO = $sortFilter.length ? $sortFilter.val() : "popularity";
        
        // Aplicar filtros
        if (sT) {
            fR = fR.filter(r => 
                (r.title && r.title.toLowerCase().includes(sT)) || 
                (r.author && r.author.toLowerCase().includes(sT))
            );
        }
        
        if (maxT > 0 && maxT < 180) {
            fR = fR.filter(r => typeof r.timeInMinutes === 'number' && r.timeInMinutes <= maxT);
        }
        
        if (selCat) fR = fR.filter(r => r.category === selCat);
        if (selDiet) fR = fR.filter(r => r.diet === selDiet);
        if (selDiff) fR = fR.filter(r => r.difficulty === selDiff);
        
        // Ordenar resultados
        switch (sortO) {
            case 'time_asc':
                fR.sort((a, b) => (a.timeInMinutes || Infinity) - (b.timeInMinutes || Infinity));
                break;
            case 'time_desc':
                fR.sort((a, b) => (b.timeInMinutes || 0) - (a.timeInMinutes || 0));
                break;
            case 'recent':
                fR.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
                break;
            case 'popularity':
            default:
                fR.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
        }
        
        // Renderizar resultados
        if ($popCon.length) {
            renderRecipeCards($popCon, fR, "No hay recetas populares con estos filtros.");
        }
        
        if ($trendCon.length) {
            const oWA = new Date();
            oWA.setDate(oWA.getDate() - 7);
            const t = fR.filter(r => new Date(r.publishDate) >= oWA)
                      .sort((a, b) => (b.likes || 0) - (a.likes || 0));
            renderRecipeCards($trendCon, t, "No hay tendencias recientes.");
        }
    }

    function loadAndPopulateDietTypes() {
        const $dFS = $('#dietFilter');
        if (!$dFS.length) {
            return $.Deferred().resolve().promise();
        }
        
        if (typeof fetchDietTypesFromAPI !== 'function') {
            console.warn("index.js: loadAndPopulateDietTypes - fetchDietTypesFromAPI no def.");
            $dFS.html('<option value="">Dieta(Todas)</option><option value="" disabled>Error</option>')
               .prop('disabled', false);
            return $.Deferred().reject().promise();
        }
        
        $dFS.prop('disabled', true).html('<option value="">Cargando...</option>');
        
        return fetchDietTypesFromAPI()
            .done(function(resp) {
                $dFS.empty().prop('disabled', false)
                    .append($('<option>', { value: '', text: 'Dieta (Todas)' }).prop('selected', true));
                
                if (resp && resp.success && resp.data && resp.data.length > 0) {
                    $.each(resp.data, function(i, d) {
                        $dFS.append($('<option>', {
                            value: escapeHTML(String(d.id)),
                            text: escapeHTML(d.nombre_dieta)
                        }));
                    });
                } else {
                    $dFS.append($('<option value="" disabled>No dietas</option>'));
                }
            })
            .fail(function() {
                $dFS.prop('disabled', false).html('<option value="">Error</option>');
            });
    }
});