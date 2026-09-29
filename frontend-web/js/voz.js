// frontend-web/js/voz.js

class ControlVoz {
    constructor() {
        // Accedemos al motor nativo de síntesis de voz del navegador
        this.sintetizador = window.speechSynthesis;
        this.idioma = 'es-ES'; // Configuración estándar en español para el MVP (RF-18)
        this.velocidadHabla = 1.1; // Velocidad ligeramente acelerada para alertas más ágiles
    }

    /**
     * Convierte una cadena de texto en voz clara y natural en tiempo real.
     * @param {string} mensaje Texto descriptivo generado por el backend de IA.
     */
    hablar(mensaje) {
        if (!mensaje || !this.sintetizador) return;

        // 1. Cancelar cualquier mensaje que se esté reproduciendo en este instante.
        // Esto evita que las alertas viejas se acumulen y se solapen con las alertas en tiempo real.
        this.sintetizador.cancel();

        // 2. Instanciar un nuevo objeto de locución fonética
        const emisionVoz = new SpeechSynthesisUtterance(mensaje);
        
        // 3. Configurar los parámetros de personalización (Cumple RF-16)
        emisionVoz.lang = this.idioma;
        emisionVoz.rate = this.velocidadHabla;
        emisionVoz.pitch = 1.0; // Tono de voz neutral y natural

        // 4. Enviar la alerta al altavoz del dispositivo
        this.sintetizador.speak(emisionVoz);
    }

    /**
     * Detiene de inmediato cualquier salida de audio activa en el sistema.
     */
    detener() {
        if (this.sintetizador) {
            this.sintetizador.cancel();
            console.log("Audio del asistente pausado completamente.");
        }
    }
}
