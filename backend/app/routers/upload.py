from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Merchant
from ..schemas import CsvUploadResponse
from ..auth import get_current_merchant
from ..adapters.csv_upload import CsvUploadAdapter

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/csv", response_model=CsvUploadResponse)
async def upload_transactions_csv(
    file: UploadFile = File(...),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    content = await file.read()
    try:
        csv_str = content.decode("utf-8")
    except Exception:
        csv_str = content.decode("latin-1")

    try:
        adapter = CsvUploadAdapter(csv_content=csv_str)
        result = adapter.ingest_data(db, current_merchant.id)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")

    return {
        "success": True,
        "rows_processed": result["rows_processed"],
        "transactions_added": result["transactions_added"],
        "items_added": result["items_added"],
        "message": f"Successfully ingested {result['rows_processed']} rows and created {result['transactions_added']} transactions."
    }
