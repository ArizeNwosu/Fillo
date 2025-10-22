from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.form import Form
from backend.schemas.form_schema import FillRequest, FillResponse, FormSchema
from backend.services import pdf_writer_hybrid as pdf_writer
from backend.services.db import get_session
from backend.services.preview_refresh import refresh_preview
from backend.services.storage import storage_service

router = APIRouter()


@router.post("/fill", response_model=FillResponse)
async def fill_form(
    payload: FillRequest,
    db: AsyncSession = Depends(get_session),
) -> FillResponse:
    try:
        form_uuid = uuid.UUID(payload.form_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid form_id") from exc

    form_stmt = select(Form).where(Form.id == form_uuid)
    form_result = await db.execute(form_stmt)
    form_row = form_result.scalar_one_or_none()
    if not form_row:
        raise HTTPException(status_code=404, detail="Form not found")

    schema = FormSchema.model_validate(form_row.parsed_schema)
    filled_pdf_uri = await pdf_writer.write_filled_pdf(
        payload.form_id,
        schema,
        form_row.current_values or {},
        form_row.orig_pdf_url,
        storage_service,
        flatten=payload.flatten,
    )

    form_row.filled_pdf_url = filled_pdf_uri
    form_row.status = "filled"
    db.add(form_row)
    await db.commit()
    await db.refresh(form_row)

    asyncio.create_task(
        refresh_preview(payload.form_id, schema, form_row.current_values or {}, form_row.orig_pdf_url)
    )

    return FillResponse(filled_pdf_url=filled_pdf_uri, status=form_row.status)
