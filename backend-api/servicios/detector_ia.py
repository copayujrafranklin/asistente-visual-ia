# backend-api/servicios/detector_ia.py

from ultralytics import YOLO
from config import UMBRAL_CONFIANZA, RANGO_ALERTA_INMINENTE, RANGO_ALERTA_CERCANA
import os

class DetectorIA:
    def __init__(self):
        # 1. Obtener la ruta absoluta del modelo yolov8n.pt
        ruta_actual = os.path.dirname(os.path.abspath(__file__))
        ruta_modelo = os.path.join(ruta_actual, "..", "modelos", "yolov8n.pt")
        
        # 2. Cargar el modelo neuronal en memoria RAM una sola vez
        print(f"Cargando modelo YOLOv8 desde: {ruta_modelo}")
        self.modelo = YOLO(ruta_modelo)
        
        # Diccionario de traducción al español para los obstáculos más comunes del MVP
        self.traducciones = {
            "person": "persona", "bicycle": "bicicleta", "car": "auto", "motorcycle": "moto",
            "bench": "banca", "dog": "perro", "backpack": "mochila", "umbrella": "paraguas",
            "handbag": "bolso", "tie": "corbata", "suitcase": "maleta", "bottle": "botella",
            "cup": "taza", "chair": "silla", "couch": "sillón", "potted plant": "maceta",
            "dining table": "mesa", "tv": "televisor", "laptop": "computadora", "cell phone": "celular"
        }

    def analizar_fotograma(self, imagen_cv2):
        """
        Ejecuta la inferencia de la IA sobre la matriz de la imagen y 
        retorna una lista estructurada con la posición y distancia de los objetos.
        """
        if imagen_cv2 is None:
            return []

        # 3. Obtener las dimensiones de la pantalla capturada
        alto, ancho, _ = imagen_cv2.shape
        tercio_ancho = ancho / 3  # Dividimos la pantalla en 3 cuadrantes (Izquierda, Centro, Derecha)

        # 4. Ejecutar la predicción de la red neuronal
        resultados = self.modelo(imagen_cv2, conf=UMBRAL_CONFIANZA, verbose=False)
        objetos_detectados = []

        for resultado in resultados:
            for box in resultado.boxes:
                # Obtener coordenadas de la caja delimitadora [x1, y1, x2, y2]
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # Obtener el nombre del objeto en inglés y su confianza
                nombre_en = self.modelo.names[int(box.cls[0])]
                nombre_es = self.traducciones.get(nombre_en, nombre_en) # Traducir si existe en la lista

                # --- CÁLCULO DE ORIENTACIÓN ESPACIAL ---
                centro_x = (x1 + x2) / 2
                if centro_x < tercio_ancho:
                    posicion = "a tu izquierda"
                elif centro_x > (tercio_ancho * 2):
                    posicion = "a tu derecha"
                else:
                    posicion = "al frente"

                # --- CÁLCULO DE PROXIMIDAD RELATIVA ---
                # Medimos qué porcentaje del alto total de la pantalla ocupa el objeto
                alto_objeto = y2 - y1
                proporcion_pantalla = alto_objeto / alto

                if proporcion_pantalla >= RANGO_ALERTA_INMINENTE:
                    distancia = "muy cerca, peligro inminente"
                elif proporcion_pantalla >= RANGO_ALERTA_CERCANA:
                    distancia = "cerca"
                else:
                    distancia = "distante"

                # Construir el reporte verbal simplificado para el requerimiento del MVP
                descripcion_verbal = f"{nombre_es} {posicion}, {distancia}."

                objetos_detectados.append({
                    "objeto": nombre_es,
                    "posicion": posicion,
                    "proximidad": distancia,
                    "alerta_voz": descripcion_verbal
                })

        return objetos_detectados
