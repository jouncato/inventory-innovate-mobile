from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from backend.src.contexts.inventory.domain.aggregates import InventorySession
from backend.src.contexts.inventory.domain.entities import UserValidation, ValidationAction
from backend.src.contexts.inventory.infrastructure.minio_storage_adapter import MinioStorageAdapter
from backend.src.config import settings

router = APIRouter(prefix="/api/v1", tags=["Inventario"])

# Repositorio en memoria para sesiones activas en desarrollo local
ACTIVE_SESSIONS: dict[UUID, InventorySession] = {}
storage_adapter = MinioStorageAdapter()


# Modelos DTO
class StartSessionRequest(BaseModel):
    location_id: UUID
    operator_id: str


class PresignCaptureRequest(BaseModel):
    session_id: UUID
    sequence_number: int
    image_sha256: str
    blur_score: float
    luminance: float


class ValidationRequest(BaseModel):
    session_id: UUID
    object_id: UUID
    operator_id: str
    action: ValidationAction
    corrected_product_id: UUID | None = None
    reason: str | None = None


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def start_inventory_session(req: StartSessionRequest):
    session = InventorySession.start(location_id=req.location_id, operator_id=req.operator_id)
    ACTIVE_SESSIONS[session.id] = session
    return {
        "session_id": str(session.id),
        "location_id": str(session.location_id),
        "status": session.status.value,
        "started_at": session.started_at.isoformat(),
    }


@router.post("/captures/presign")
async def get_presigned_upload_url(req: PresignCaptureRequest):
    if req.session_id not in ACTIVE_SESSIONS:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    capture_id = uuid4()
    s3_key = f"captures/{req.session_id}/{capture_id}.webp"
    upload_url = await storage_adapter.generate_presigned_upload_url(
        bucket=settings.S3_BUCKET_CAPTURES,
        key=s3_key,
        expires_in=900,
    )
    return {
        "capture_id": str(capture_id),
        "upload_url": upload_url,
        "s3_key": s3_key,
    }


@router.get("/sessions/{session_id}/exceptions")
async def list_pending_exceptions(session_id: UUID):
    session = ACTIVE_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    exceptions = []
    for obj in session.physical_objects:
        if obj.is_ambiguous:
            crop_url = None
            if obj.crop_storage_s3_key:
                crop_url = await storage_adapter.generate_presigned_download_url(
                    bucket=settings.S3_BUCKET_CROPS,
                    key=obj.crop_storage_s3_key,
                    expires_in=900,
                )
            exceptions.append({
                "object_id": str(obj.id),
                "confidence_score": obj.confidence.value,
                "status": obj.confidence.status.value,
                "bbox": {"x1": obj.bounding_box.x1, "y1": obj.bounding_box.y1, "x2": obj.bounding_box.x2, "y2": obj.bounding_box.y2},
                "crop_url": crop_url,
                "suggested_product_id": str(obj.resolved_product_id) if obj.resolved_product_id else None,
            })

    return {
        "session_id": str(session.id),
        "pending_count": len(exceptions),
        "exceptions": exceptions,
    }


@router.post("/validations")
async def submit_human_validation(req: ValidationRequest):
    session = ACTIVE_SESSIONS.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    validation = UserValidation(
        id=uuid4(),
        product_match_id=uuid4(),
        reviewed_by_user_id=req.operator_id,
        action_taken=req.action,
        original_product_id=None,
        corrected_product_id=req.corrected_product_id,
        reason=req.reason,
    )

    try:
        session.resolve_exception(object_id=req.object_id, validation=validation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "status": "success",
        "message": f"Excepción resuelta mediante acción: {req.action.value}",
        "remaining_exceptions": session.pending_exceptions_count,
    }
