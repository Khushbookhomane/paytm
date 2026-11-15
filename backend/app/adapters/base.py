from abc import ABC, abstractmethod
from typing import List, Dict, Any
from sqlalchemy.orm import Session

class BaseDataAdapter(ABC):
    """Abstract interface for merchant data ingestion."""

    @abstractmethod
    def ingest_data(self, db: Session, merchant_id: int) -> Dict[str, Any]:
        """Ingest or refresh merchant data in the database."""
        pass
