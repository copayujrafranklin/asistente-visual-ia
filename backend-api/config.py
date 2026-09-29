# backend-api/config.py

UMBRAL_CONFIANZA = 0.50          # Certeza mínima de la IA para anunciar un objeto (50%)
PUERTO_SERVIDOR = 8000           # Puerto donde correrá nuestra API
RANGO_ALERTA_INMINENTE = 0.60    # Si el objeto ocupa más del 60% de la pantalla
RANGO_ALERTA_CERCANA = 0.30      # Si el objeto ocupa entre el 30% y 60%
