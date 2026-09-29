# backend-api/servicios/procesador_imagen.py

import base64
import cv2
import numpy as np

def decodificar_imagen_base64(base64_string: str):
    """
    Toma un string en formato Base64 enviado por el frontend,
    remueve los encabezados de los navegadores y lo convierte
    en una matriz de imagen compatible con OpenCV.
    """
    try:
        # 1. Si el string viene con el prefijo "data:image/jpeg;base64,", lo eliminamos
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # 2. Decodificar el texto Base64 a bytes puros
        datos_encriptados = base64.b64decode(base64_string)
        
        # 3. Convertir los bytes en un arreglo numérico unidimensional (NumPy)
        arreglo_np = np.frombuffer(datos_encriptados, dtype=np.uint8)
        
        # 4. Decodificar el arreglo en una matriz de imagen a color (Matriz BGR de OpenCV)
        imagen_cv2 = cv2.imdecode(arreglo_np, cv2.IMREAD_COLOR)
        
        return imagen_cv2
    except Exception as e:
        # Si algo falla en la decodificación (datos corruptos), devolvemos None
        print(f"Error al decodificar la imagen: {str(e)}")
        return None
