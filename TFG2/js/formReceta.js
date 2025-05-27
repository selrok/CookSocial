$(document).ready(function() {
    let dietTypes = [
        "Omnívora", "Vegetariana", "Vegana", "Flexitariana", "Paleo", 
        "Cetogénica (keto)", "Macrobiótica", "Crudivegana", "Frutariana"
    ];

    let $form = $('#recipeForm');
    let $ingredientsContainer = $('#ingredientsContainer');
    let $stepsContainer = $('#stepsContainer');
    let $addIngredientBtn = $('#addIngredientBtn');
    let $addStepBtn = $('#addStepBtn');
    let $uploadImageBtn = $('#uploadImageBtn');
    let $recipeImageInput = $('#recipeImage');
    let $imagePreviewContainer = $('#imagePreviewContainer');
    let $imagePreview = $('#imagePreview');
    let $recipeVisibilitySwitch = $('#recipeVisibility');
    let $recipeVisibilityLabel = $('label[for="recipeVisibility"]');
    let $dietTypeSelect = $('#dietType'); // Definir aquí para mejor acceso

    let ingredientCount = 1;
    let stepCount = 1;

    // Llenar select de tipos de dieta
    $dietTypeSelect.append('<option value="" selected disabled>Selecciona tipo de dieta</option>');
    $.each(dietTypes, function(index, diet) {
        $dietTypeSelect.append($('<option>', {
            value: diet.toLowerCase().replace(/[^a-z0-9]+/g, '-'), // Mejorado para manejar números y espacios
            text: diet
        }));
    });

    // Event Listeners
    $addIngredientBtn.on('click', addIngredientField);
    $addStepBtn.on('click', addStepField);
    $uploadImageBtn.on('click', function() { $recipeImageInput.trigger('click'); });
    $recipeImageInput.on('change', handleImageUpload);
    $form.on('submit', handleFormSubmit);
    $recipeVisibilitySwitch.on('change', function() {
        $recipeVisibilityLabel.text($(this).is(':checked') ? 'Pública' : 'Privada');
    });

    function addIngredientField() {
        ingredientCount++;
        let newIngredientHtml = `
            <div class="input-group mb-2">
                <input type="text" class="form-control ingredient-input" placeholder="Ingrediente ${ingredientCount}" required>
                <button type="button" class="btn btn-outline-danger remove-ingredient">
                    <i class="fas fa-minus"></i>
                </button>
            </div>`;
        $ingredientsContainer.append(newIngredientHtml);
        updateRemoveButtons('.remove-ingredient', $ingredientsContainer);
    }

    function addStepField() {
        stepCount++;
        let newStepHtml = `
            <div class="mb-3">
                <textarea class="form-control step-input" rows="2" placeholder="Paso ${stepCount}" required></textarea>
                <button type="button" class="btn btn-outline-danger remove-step mt-2">
                    <i class="fas fa-minus me-1"></i>Eliminar paso
                </button>
            </div>`;
        $stepsContainer.append(newStepHtml);
        updateRemoveButtons('.remove-step', $stepsContainer);
    }

    function updateRemoveButtons(selector, $container) {
        // Usar delegación para los botones de eliminar, ya que se añaden dinámicamente
        // Quitar listeners antiguos para evitar duplicados si se llama múltiples veces en un contexto incorrecto
        $container.off('click', selector).on('click', selector, function() {
            $(this).closest(selector === '.remove-ingredient' ? '.input-group' : '.mb-3').remove(); // Ajustar selector del padre
            if (selector === '.remove-ingredient') ingredientCount--;
            else stepCount--;
            // Re-evaluar la necesidad de deshabilitar botones
            updateSingleRemoveButtonState('.remove-ingredient', $ingredientsContainer);
            updateSingleRemoveButtonState('.remove-step', $stepsContainer);
        });
        updateSingleRemoveButtonState(selector, $container); // Estado inicial
    }

    // Función para habilitar/deshabilitar botones de eliminar individuales
    function updateSingleRemoveButtonState(selector, $container){
        const $buttons = $container.find(selector);
        $buttons.prop('disabled', $buttons.length <= 1);
    }


    function handleImageUpload(event) {
        let file = event.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function(e) {
                $imagePreview.attr('src', e.target.result);
                $imagePreviewContainer.removeClass('d-none');
                $uploadImageBtn.html('<i class="fas fa-upload me-2"></i>Cambiar imagen');
            };
            reader.readAsDataURL(file);
        }
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        
        if ($form[0].checkValidity() === false) {
            event.stopPropagation();
            $form.addClass('was-validated');
            // Podrías añadir un scroll al primer campo inválido si lo deseas
            let $firstInvalid = $form.find(':invalid').first();
            if ($firstInvalid.length) {
                $('html, body').animate({
                    scrollTop: $firstInvalid.offset().top - 100 // -100 para un poco de espacio arriba
                }, 500);
            }
            return;
        }
        
        let formData = {
            title: $('#recipeTitle').val(),
            description: $('#recipeDescription').val(),
            category: $('#recipeCategory').val(),
            prepTime: $('#prepTime').val(),
            servings: $('#servings').val(),
            dietType: $('#dietType').val(),
            difficulty: $('#difficulty').val(),
            visibility: $recipeVisibilitySwitch.is(':checked') ? 'public' : 'private',
            ingredients: $('.ingredient-input').map(function() { return $(this).val().trim(); }).get().filter(Boolean), // .filter(Boolean) para quitar vacíos
            steps: $('.step-input').map(function() { return $(this).val().trim(); }).get().filter(Boolean), // .filter(Boolean)
            chefTips: $('#chefTips').val().trim(), // NUEVO: Obtener consejos del chef
            image: $recipeImageInput[0].files[0] ? $recipeImageInput[0].files[0].name : null 
        };
        
        // Filtrar ingredientes y pasos vacíos que podrían quedar si el usuario borra el texto
        formData.ingredients = formData.ingredients.filter(ing => ing !== "");
        formData.steps = formData.steps.filter(step => step !== "");

        console.log('Datos del formulario:', formData);
        // alert('Receta enviada correctamente (simulación)'); // Comentado para evitar interrupción
        
        // Simular feedback de éxito y resetear formulario
        $form.removeClass('was-validated');
        $form[0].reset(); // Resetea los campos del formulario
        ingredientCount = 1; // Resetear contadores
        stepCount = 1;
        $('#ingredientsContainer').html(`
            <div class="input-group mb-2">
                <input type="text" class="form-control ingredient-input" placeholder="Ingrediente 1" required>
                <button type="button" class="btn btn-outline-danger remove-ingredient" disabled><i class="fas fa-minus"></i></button>
            </div>`);
        $('#stepsContainer').html(`
            <div class="mb-3">
                <textarea class="form-control step-input" rows="2" placeholder="Paso 1" required></textarea>
                <button type="button" class="btn btn-outline-danger remove-step mt-2" disabled><i class="fas fa-minus me-1"></i>Eliminar paso</button>
            </div>`);
        updateSingleRemoveButtonState('.remove-ingredient', $ingredientsContainer); // Re-aplicar estado inicial botones
        updateSingleRemoveButtonState('.remove-step', $stepsContainer);

        $imagePreviewContainer.addClass('d-none');
        $imagePreview.attr('src', '#');
        $uploadImageBtn.html('<i class="fas fa-upload me-2"></i>Subir imagen');
        $recipeVisibilitySwitch.prop('checked', true).trigger('change'); // Resetear switch y actualizar label

        // Mostrar un mensaje de éxito temporal
        const $successMessage = $('<div class="alert alert-success mt-3">Receta enviada con éxito.</div>');
        $form.after($successMessage);
        setTimeout(() => { $successMessage.fadeOut(500, () => $successMessage.remove()); }, 3000);


        // Lógica AJAX omitida para brevedad
        //let dataToSend = new FormData($form[0]); // FormData puede tomar el elemento form directamente
        // Añadir campos que no son input directos si es necesario, o asegurarse que tengan 'name'
        // formData.ingredients.forEach((ing, i) => dataToSend.append(`ingredients[${i}]`, ing));
        // formData.steps.forEach((step, i) => dataToSend.append(`steps[${i}]`, step));
        // dataToSend.append('visibility', formData.visibility);
        // ... y así para otros campos generados dinámicamente o no estándar
        
        //$.ajax({ /* ... */ });

    }

    // Inicializar estado de los botones de eliminar
    updateSingleRemoveButtonState('.remove-ingredient', $ingredientsContainer);
    updateSingleRemoveButtonState('.remove-step', $stepsContainer);
    
    // Asegurar que el label del switch esté correcto al cargar
    if ($recipeVisibilitySwitch.is(':checked')) {
        $recipeVisibilityLabel.text('Pública');
    } else {
        $recipeVisibilityLabel.text('Privada');
    }
});