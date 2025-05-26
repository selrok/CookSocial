// /js/ajax/get-dietas.js

/**
 * Realiza una petición AJAX para obtener los tipos de dieta desde la API.
 * @returns {Promise} Una promesa de jQuery que se resolverá con la respuesta del servidor
 *                    o se rechazará si hay un error.
 */
function fetchDietTypesFromAPI() {
    console.log("get-dietas.js: Iniciando fetchDietTypesFromAPI()...");
    // La URL debe apuntar a tu script PHP real que devuelve los tipos de dieta.
    // Asumiendo que es la misma que usaste en el ejemplo anterior.
    // Si tu index.html está en la raíz de 'TFG', la ruta 'api/get_diet_types.php' debería funcionar.
    // Si index.html está en otra parte (ej. http://localhost/index.html y TFG está dentro),
    // la ruta podría necesitar 'TFG/api/get_diet_types.php'
    // Por ahora, asumimos que está en TFG/ y index.html está también en TFG/
    const apiUrl = '../TFG/api/get_diet_types.php'; 

    return $.ajax({
        url: apiUrl,
        type: 'GET',
        dataType: 'json' // jQuery intentará parsear la respuesta como JSON automáticamente
    })
    .done(function(response) {
        console.log("get-dietas.js (AJAX .done): Respuesta recibida de la API:", response);
        // No es necesario hacer mucho aquí, el .then() en index.js manejará la respuesta.
        // Solo para logging.
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.error("get-dietas.js (AJAX .fail): Error en la petición a la API.",
            "Status:", textStatus,
            "Error:", errorThrown,
            "Respuesta del servidor:", jqXHR.responseText
        );
        // La promesa ya estará rechazada, el .catch() en index.js lo manejará.
    });
}