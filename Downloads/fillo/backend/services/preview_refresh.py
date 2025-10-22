from __future__ import annotations

from typing import Any

from backend.schemas.form_schema import FormSchema
from backend.services import pdf_writer_hybrid as pdf_writer
from backend.services.previewer import broadcast_preview, generate_previews
from backend.services.storage import storage_service


async def refresh_preview(
    form_id: str,
    schema: FormSchema,
    current_values: dict[str, Any],
    orig_pdf_uri: str,
) -> None:
    try:
        print(f"[DEBUG] Starting preview refresh for form {form_id}")
        preview_source_uri = orig_pdf_uri
        if current_values:
            preview_source_uri = await pdf_writer.write_filled_pdf(
                form_id,
                schema,
                current_values,
                orig_pdf_uri,
                storage_service,
                flatten=False,
                output_kind=f"forms/{form_id}/preview",
            )
        print(f"[DEBUG] Generating previews from {preview_source_uri}")
        pngs = await generate_previews(form_id, preview_source_uri, storage_service)
        print(f"[DEBUG] Generated {len(pngs)} preview images: {pngs}")
        await broadcast_preview(form_id, pngs, current_values)
        print(f"[DEBUG] Broadcast complete for form {form_id}")
    except Exception as exc:  # noqa: BLE001
        print(f"[ERROR] preview generation failed for {form_id}: {exc}")
        import traceback
        traceback.print_exc()
