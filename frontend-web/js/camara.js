// frontend-web/js/camara.js

class ControlCamara {
    constructor(idElementoVideo) {
        // Guardamos la referencia al nodo HTML del video donde se mostrará el stream
        this.elementoVideo = document.getElementById(idElementoVideo);
        this.streamMedia = null;
        
        // Creamos un elemento Canvas oculto en memoria RAM. 
        // Servirá como "matriz de dibujo" para extraer los píxeles de la cámara en formato Base64.
        this.canvasOculto = document.createElement('canvas');
        this.contextoCanvas = this.canvasOculto.getContext('2d');
    }

    /**
     * Solicita permisos al sistema operativo y enciende el flujo continuo de la cámara.
     */
    async encender() {
        try {
            // Configuración óptima de captura para el MVP (Garantiza baja latencia)
            const opcionesConfiguracion = {
                video: {
                    // Solicita explícitamente la cámara trasera ('environment') si está en un celular
                    facingMode: 'environment',
                    // Resoluciones moderadas (VGA) para que la imagen pese poco y viaje rápido por la red
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false // Apagamos el micrófono para optimizar recursos de hardware
            };

            // Invocar la API nativa multimedia del navegador
            this.streamMedia = await navigator.mediaDevices.getUserMedia(opcionesConfiguracion);
            
            // Inyectar el flujo multimedia en vivo dentro de nuestro tag HTML <video>
            this.elementoVideo.srcObject = this.streamMedia;
            
            console.log("Hardware de cámara inicializado con éxito.");
            return true;
        } catch (error) {
            console.error("Fallo crítico al acceder a la cámara:", error);
            throw new Error("No se pudo acceder a la cámara. Verifica los permisos de tu navegador.");
        }
    }

    /**
     * Apaga el hardware de la cámara para liberar memoria y ahorrar batería (Cumple RNF-03).
     */
    apagar() {
        if (this.streamMedia) {
            this.streamMedia.getTracks().forEach(track => track.stop());
            this.elementoVideo.srcObject = null;
            console.log("Hardware de cámara liberado correctamente.");
        }
    }

    /**
     * Captura el fotograma actual que se está reproduciendo en el video
     * y lo transforma en una cadena de texto comprimida en formato Base64.
     */
    capturarFotogramaBase64() {
        if (!this.streamMedia || this.elementoVideo.paused) {
            return null;
        }

        // 1. Sincronizar las dimensiones del lienzo oculto con el tamaño real del stream de video
        const anchoReal = this.elementoVideo.videoWidth;
        const altoReal = this.elementoVideo.videoHeight;
        
        this.canvasOculto.width = anchoReal;
        this.canvasOculto.height = altoReal;

        // 2. Estampar/Dibujar el cuadro de video actual sobre la superficie del canvas
        this.contextoCanvas.drawImage(this.elementoVideo, 0, 0, anchoReal, altoReal);

        // 3. Exportar el lienzo de píxeles a un string comprimido JPEG en Base64
        // El factor 0.70 comprime la imagen al 70% de calidad, reduciendo el peso en red a la mitad sin perder precisión de la IA.
        const stringBase64 = this.canvasOculto.toDataURL('image/jpeg', 0.70);
        
        return stringBase64;
    }
}
