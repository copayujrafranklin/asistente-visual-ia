# backend-api/main.py
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import base64

# Configuración del modelo en la nube (YOLOv8x para máxima precisión académica)
API_URL = "https://huggingface.co"
# Token público temporal para desarrollo académico
HEADERS = {"Authorization": "Bearer hf_MvXvXvXvXvXvXvXvXvXvXvXvXvXvXvXvXv"} 

class ServidorAsistente(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Habilita los permisos CORS obligatorios para que JavaScript no se bloquee
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            respuesta = {"estado": "activo", "mensaje": "Servidor de Asistencia Visual en la nube operando"}
            self.wfile.write(json.dumps(respuesta).encode("utf-8"))

    def do_POST(self):
        if self.path == "/analizar":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            datos_json = json.loads(post_data.decode('utf-8'))
            
            # Extraer el string Base64 puro enviado por el navegador
            base64_string = datos_json.get("imagen_base64", "")
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]
            
            try:
                # Convertir el texto de la imagen a bytes puros para enviarlo a la IA
                imagen_bytes = base64.b64decode(base64_string)
                
                # Realizar la petición HTTP asíncrona al servidor de Inteligencia Artificial
                req = urllib.request.Request(API_URL, data=imagen_bytes, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=5) as response:
                    resultado_ia = json.loads(response.read().decode('utf-8'))
                
                # Procesar las detecciones y mapear la orientación espacial
                detecciones_procesadas = []
                for item in resultado_ia:
                    if item.get("score", 0) > 0.40: # Umbral de confianza del 40%
                        objeto = item.get("label", "objeto")
                        box = item.get("box", {})
                        
                        # Mapeo espacial simplificado (0 a 1 en el eje X)
                        centro_x = (box.get("xmin", 0) + box.get("xmax", 0)) / 2
                        if centro_x < 0.33:
                            posicion = "a tu izquierda"
                        elif centro_x > 0.66:
                            posicion = "a tu derecha"
                        else:
                            posicion = "al frente"
                            
                        detecciones_procesadas.append({
                            "objeto": objeto,
                            "posicion": posicion,
                            "alerta_voz": f"Obstáculo: {objeto} {posicion}."
                        })
                
                # Responder exitosamente al frontend
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                
                respuesta_final = {"exito": True, "detecciones": detecciones_procesadas}
                self.wfile.write(json.dumps(respuesta_final).encode("utf-8"))
                
            except Exception as e:
                self.send_response(500)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"exito": False, "error": str(e)}).encode("utf-8"))

if __name__ == "__main__":
    puerto = 8000
    print(f"Servidor híbrido encendido en http://localhost:{puerto} (Cero dependencias)")
    server = HTTPServer(('0.0.0.0', puerto), ServidorAsistente)
    server.serve_forever()
