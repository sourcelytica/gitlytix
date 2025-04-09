from sqlmodel import Session, create_engine, SQLModel
from sqlalchemy.orm import sessionmaker
from clickhouse_sqlalchemy import engines

from app.core.config import settings

# Use ClickHouse's HTTP interface with SQLModel
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI), echo=True)

# Use SQLModel's session maker
SessionLocal = sessionmaker(bind=engine)

def get_db():
    with Session(engine) as session:
        yield session

# Ensure all tables are created
def init_db():
    from app.models import Stats
    
    #SQLModel.metadata.create_all(engine)

