from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Merchant
from ..schemas import CopilotChatRequest, CopilotChatResponse
from ..auth import get_current_merchant
from ..services.copilot import process_copilot_chat

router = APIRouter(prefix="/copilot", tags=["copilot"])

@router.post("/chat", response_model=CopilotChatResponse)
def copilot_chat(
    req: CopilotChatRequest,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    lang = req.language or current_merchant.language or "hi"
    return process_copilot_chat(
        message=req.message,
        language=lang,
        merchant_id=current_merchant.id,
        db=db,
        merchant=current_merchant,
    )
