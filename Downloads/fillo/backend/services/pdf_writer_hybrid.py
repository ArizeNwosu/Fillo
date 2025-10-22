from __future__ import annotations

from io import BytesIO
from typing import Any

import pikepdf
from anyio import to_thread
from PyPDF2 import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from backend.schemas.form_schema import FieldDefinition, FormSchema
from backend.services.storage import StorageService


def _draw_checkbox(c: canvas.Canvas, field: FieldDefinition, value: Any, page_height: float) -> None:
    """Draw a checkbox on the canvas"""
    if value in (None, ""):
        return

    truthy = str(value).lower() in {"true", "1", "yes", "on"}
    truthy = truthy or value is True

    if truthy:
        x1, y1, x2, y2 = field.rect
        # PDF coordinates: (0,0) is bottom-left, y increases upward
        # ReportLab Canvas: (0,0) is bottom-left, y increases upward (same!)
        # So we need to use y1 (bottom of field box) directly

        # Calculate center of checkbox for better positioning
        box_width = x2 - x1
        box_height = y2 - y1
        center_x = x1 + (box_width / 2)
        center_y = y1 + (box_height / 2)

        # Draw checkmark using ZapfDingbats font
        # Character "4" (✓), "8" (✗), or "3" (✓ bold)
        font_size = min(box_height * 0.8, 12)  # Scale to checkbox size, max 12pt
        c.setFont("ZapfDingbats", font_size)
        # Center the checkmark (offset by ~1/3 of font size for proper centering)
        c.drawString(center_x - (font_size / 3), center_y - (font_size / 3), "4")


def _generate_checkbox_overlay(schema: FormSchema, current_values: dict[str, Any], orig_reader: PdfReader) -> BytesIO:
    """Generate an overlay with just checkboxes/radio buttons drawn"""
    output = BytesIO()
    writer = PdfWriter()

    for page_index, page in enumerate(orig_reader.pages, start=1):
        media_box = page.mediabox
        width = float(media_box.width)
        height = float(media_box.height)
        packet = BytesIO()
        c = canvas.Canvas(packet, pagesize=(width or letter[0], height or letter[1]))
        page_fields = [f for f in schema.fields if f.page == page_index and f.type in {"checkbox", "radio"}]

        for field in page_fields:
            value = current_values.get(field.id)
            if value:
                _draw_checkbox(c, field, value, height)

        c.save()
        packet.seek(0)
        overlay_reader = PdfReader(packet)
        base_page = orig_reader.pages[page_index - 1]

        # Only merge overlay if it has pages
        if len(overlay_reader.pages) > 0:
            base_page.merge_page(overlay_reader.pages[0])
        writer.add_page(base_page)

    writer.write(output)
    output.seek(0)
    return output


def _write_pdf_sync_hybrid(
    form_id: str,
    schema: FormSchema,
    current_values: dict[str, Any],
    orig_path: str,
    storage: StorageService,
    flatten: bool,
    output_kind: str,
) -> str:
    """
    Hybrid approach: Use pikepdf for text fields, overlay for checkboxes
    """
    print(f"[DEBUG] Starting hybrid PDF fill with {len(current_values)} values")

    # Step 1: Fill text fields using pikepdf
    pdf = pikepdf.open(orig_path)
    field_map = {field.id: field for field in schema.fields}

    text_filled = 0
    for field_id, value in current_values.items():
        if field_id not in field_map:
            continue

        field_def = field_map[field_id]

        # Only handle text fields with pikepdf
        if field_def.type not in {"text", "date", "number", "phone", "ssn"}:
            continue

        # Strip prefix and find field
        # The schema sanitizes PDF field names (spaces→underscores, etc.)
        # We need to try multiple variants to match the original PDF field name
        field_id_stripped = field_id.removeprefix("f_").removeprefix("field_")
        # Also try reversing sanitization: underscores back to spaces
        field_id_unsanitized = field_id_stripped.replace("_", " ")

        # Find field in PDF
        field_obj = None
        if "/AcroForm" in pdf.Root and "/Fields" in pdf.Root.AcroForm:
            for field in pdf.Root.AcroForm.Fields:
                if isinstance(field, pikepdf.Dictionary) and "/T" in field:
                    field_name = str(field["/T"])
                    # Try multiple matching strategies:
                    # 1. Exact match with original ID
                    # 2. Match with stripped ID (no f_ prefix)
                    # 3. Match with unsanitized ID (underscores → spaces)
                    # 4. Prefix match (e.g., "1020 Radio Button 1" starts with "1020")
                    if (field_name == field_id or
                        field_name == field_id_stripped or
                        field_name == field_id_unsanitized or
                        field_name.startswith(f"{field_id} ") or
                        field_name.startswith(f"{field_id_stripped} ") or
                        field_name.startswith(f"{field_id_unsanitized} ")):
                        field_obj = field
                        break

        if field_obj:
            field_obj["/V"] = str(value)
            if "/AP" in field_obj:
                del field_obj["/AP"]
            text_filled += 1
            print(f"[DEBUG] Filled text field {field_id} = {value}")

    # Save pikepdf output to temp file
    temp_output = BytesIO()
    pdf.save(temp_output, linearize=True)
    temp_output.seek(0)
    pdf.close()

    print(f"[DEBUG] Filled {text_filled} text fields with pikepdf")

    # Step 2: Add checkbox overlay using PyPDF2
    temp_output.seek(0)
    orig_reader = PdfReader(temp_output)
    final_output = _generate_checkbox_overlay(schema, current_values, orig_reader)

    print(f"[DEBUG] Added checkbox overlay")

    # Step 3: Optionally flatten
    if flatten:
        pdf_bytes = final_output.read()
        with pikepdf.Pdf.open(BytesIO(pdf_bytes)) as pdf:
            if "/AcroForm" in pdf.Root:
                del pdf.Root.AcroForm
            flattened = BytesIO()
            pdf.save(flattened, linearize=True)
            flattened.seek(0)
            pdf_bytes = flattened.read()
    else:
        pdf_bytes = final_output.read()

    # Save to storage
    uri = storage.save_bytes_sync(pdf_bytes, kind=output_kind, suffix=".pdf")
    return uri


async def write_filled_pdf(
    form_id: str,
    schema: FormSchema,
    current_values: dict[str, Any],
    orig_pdf_uri: str,
    storage: StorageService,
    *,
    flatten: bool = True,
    output_kind: str | None = None,
) -> str:
    """
    Async wrapper for hybrid PDF filling.
    """
    orig_path = storage.path_from_uri(orig_pdf_uri)
    kind = output_kind or f"forms/{form_id}"
    return await to_thread.run_sync(
        _write_pdf_sync_hybrid,
        form_id,
        schema,
        current_values,
        str(orig_path),
        storage,
        flatten,
        kind,
    )
