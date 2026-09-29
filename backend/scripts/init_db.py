"""Database initialization script to create all schema tables."""

from pathlib import Path
import sys

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.models.database import Base, engine
from app.models.models import EconomicIndicator, MarketPrice


def init_db() -> None:
    """Create all database tables via SQLAlchemy metadata."""
    print(f"Initializing database at: {engine.url}")
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully.")


if __name__ == "__main__":
    init_db()
