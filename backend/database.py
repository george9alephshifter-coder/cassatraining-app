import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
# Correcto
from .config import settings

# 1. Connection string pointing to local PostgreSQL and school_db
# Replace 'YOUR_PASSWORD' with the password you typed into psql
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres.zxkzshentjtrmgfjtwuf:S96Au52Phv1bx30@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
    #"postgresql://postgres:S96Au52Phv1bx30@db.zxkzshentjtrmgfjtwuf.supabase.co:5432/postgres"
)

# 2. Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# 3. Create the SessionLocal class for DB sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create the Base class for your models to inherit from
Base = declarative_base()

# 5. Dependency helper function to handle DB sessions per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()