from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings  # Importamos tu configuración desacoplada

# 1. Obtenemos la URL limpia directamente validada por Pydantic
DATABASE_URL = settings.DATABASE_URL

# 2. Creamos el motor de conexión (Engine)
engine = create_engine(DATABASE_URL)

# 3. Creamos la fábrica de sesiones (SessionLocal)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Base para heredar en nuestros modelos de SQLAlchemy
Base = declarative_base()

# 5. Función auxiliar (Dependency) para abrir y cerrar la sesión automáticamente
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()