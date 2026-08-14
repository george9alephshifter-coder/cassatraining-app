from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importaciones internas de tu paquete backend
from config import settings
from database import engine, Base
import models as models
from routers import calificaciones

# 1. Crear las tablas en PostgreSQL si aún no existen
Base.metadata.create_all(bind=engine)

# 2. Inicializar la aplicación FastAPI (una sola vez)
app = FastAPI(
    title="Veritas Academic API",
    description="Backend para la gestión académica y calificaciones",
    version="1.0.0"
)

# 3. Configurar CORS leyendo la lista de orígenes permitidos
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Incluir los routers/módulos de la API
app.include_router(calificaciones.router)

# 5. Endpoint de prueba de salud de la API
@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "Backend conectado y configurado correctamente"}