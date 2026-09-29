// frontend-web/js/app.js

class OrquestadorApp {
    constructor() {
        // 1. Instanciar los módulos de hardware y sonido que programamos antes
        this.camara = new ControlCamara('video-camara');
        this.voz = new ControlVoz();

        // 2. Capturar los elementos visuales de la interfaz de alto contraste
        this.btnAccion = document.getElementById('btn-accion');
        this.textoBoton = document.getElementById('texto-boton');
        this.textoEstado = document.getElementById('texto-estado');

        // 3. Variables de control de estado del sistema
        this.sistemaActivo = false;
        this.temporizadorCiclo = null;
        this.urlBackend = 'http://localhost:8000/analizar'; // Dirección de nuestro servidor Python

        // 4. Ligar el evento de clic/toque del botón gigante
        this.btnAccion.addEventListener('click', () => this.conmutarSistema());
    }

    /**
     * Enciende o apaga el asistente de exploración según el estado actual.
     */
    async conmutarSistema() {
        if (!this.sistemaActivo) {
            // --- ENCENDER EL SISTEMA ---
            this.textoEstado.textContent = "Iniciando hardware de cámara...";
            this.voz.hablar("Iniciando asistente visual.");

            try {
                const camaraEncendida = await this.camara.encender();
                if (camaraEncendida) {
                    this.sistemaActivo = true;
                    this.textoBoton.textContent = "DETENER ASISTENTE";
                    this.btnAccion.style.backgroundColor = "#FF3333"; // Cambia a Rojo de advertencia
                    this.btnAccion.style.color = "#FFFFFF";
                    this.textoEstado.textContent = "Exploración en tiempo real activa. Escaneando entorno.";
                    
                    // Arrancar el lazo infinito de captura y procesamiento (Cada 700ms para mantener baja latencia)
                    this.temporizadorCiclo = setInterval(() => this.procesarFotogramaActual(), 700);
                }
            } catch (error) {
                this.textoEstado.textContent = "Error: " + error.message;
                this.voz.hablar("Error crítico. No se pudo acceder a la cámara.");
            }
        } else {
            // --- APAGAR EL SISTEMA (Cumple RNF-03 Consumo de Batería) ---
            this.sistemaActivo = false;
            clearInterval(this.temporizadorCiclo); // Detener el lazo repetitivo
            this.camara.apagar();
            this.voz.detener();
            
            this.textoBoton.textContent = "INICIAR ASISTENTE";
            this.btnAccion.style.backgroundColor = "#FFD700"; // Regresa al Amarillo de alto contraste
            this.btnAccion.style.color = "#000000";
            this.textoEstado.textContent = "Sistema en pausa. Toca la pantalla para reanudar.";
            this.voz.hablar("Asistente pausado.");
        }
    }

    /**
     * Toma una captura de la cámara, la transmite al backend y procesa la respuesta analítica.
     */
    async procesarFotogramaActual() {
        if (!this.sistemaActivo) return;

        // a. Extraer la matriz de píxeles actual en formato de texto Base64
        const fotogramaBase64 = this.camara.capturarFotogramaBase64();
        if (!fotogramaBase64) return;

        try {
            // b. Realizar la petición HTTP POST asíncrona hacia el Backend de Python (Fetch API)
            const respuesta = await fetch(this.urlBackend, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imagen_base64: fotogramaBase64
                })
            });

            if (!respuesta.ok) throw new Error("Fallo en la respuesta del servidor");

            const datosJSON = await respuesta.json();

            // c. Analizar las detecciones espaciales devueltas por la Inteligencia Artificial
            if (datosJSON.exito && datosJSON.detecciones.length > 0) {
                // Tomamos la primera detección más relevante del cuadro para no saturar al usuario
                const obstaculoPrincipal = datosJSON.detecciones[0];
                
                // Actualizar el panel visual para el jurado evaluador
                this.textoEstado.textContent = obstaculoPrincipal.alerta_voz;
                
                // Ordenar al altavoz que emita la alerta por voz en tiempo real (RF-07)
                this.voz.hablar(obstaculoPrincipal.alerta_voz);
            } else {
                // Si la IA devuelve una lista vacía, el camino está despejado
                this.textoEstado.textContent = "Camino despejado.";
            }

        } catch (error) {
            console.error("Error de comunicación en el lazo de control:", error);
            this.textoEstado.textContent = "Buscando conexión con el servidor de IA...";
        }
    }
}

// Inicializar la aplicación en memoria global una vez que el navegador cargue el HTML
window.addEventListener('DOMContentLoaded', () => {
    window.miAplicacionAsistente = new OrquestadorApp();
});
