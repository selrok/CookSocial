document.addEventListener('DOMContentLoaded', function() {
    // Función para mostrar/ocultar contraseña
    const togglePasswordVisibility = (button) => {
        const targetId = button.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    };

    // Configurar todos los botones de mostrar/ocultar contraseña
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            togglePasswordVisibility(this);
        });
    });

    // Validación del formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            if (!this.checkValidity()) {
                event.stopPropagation();
                this.classList.add('was-validated');
                return;
            }

            // Validar que las contraseñas coincidan
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                document.getElementById('confirmPassword').classList.add('is-invalid');
                return;
            }

            // Simular envío exitoso
            console.log('Registro exitoso para:', document.getElementById('username').value);
            alert('¡Registro exitoso! Bienvenido a CookSocial');
            
            // Aquí iría el envío real con fetch()
        });

        // Validación en tiempo real para confirmar contraseña
        const passwordInputs = ['password', 'confirmPassword'];
        passwordInputs.forEach(id => {
            document.getElementById(id).addEventListener('input', function() {
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (password && confirmPassword && password !== confirmPassword) {
                    document.getElementById('confirmPassword').classList.add('is-invalid');
                } else {
                    document.getElementById('confirmPassword').classList.remove('is-invalid');
                }
            });
        });
    }

    // Manejo del formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            
            if (!username || !password) {
                alert('Por favor completa todos los campos');
                return;
            }
            
            // Simular inicio de sesión exitoso
            console.log('Inicio de sesión para:', username);
            alert(`Bienvenido de vuelta, ${username}!`);
            
            // Aquí iría la autenticación real con fetch()
        });
    }

    // Cambiar entre pestañas mediante enlaces
    document.querySelectorAll('.switch-tab').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            const tab = new bootstrap.Tab(document.getElementById(tabId));
            tab.show();
        });
    });

    // Cambiar a pestaña de login si hay parámetro en URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'login') {
        const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
        loginTab.show();
    }
});