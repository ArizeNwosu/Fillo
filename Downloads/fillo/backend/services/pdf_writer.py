from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Any

import pikepdf
from anyio import to_thread

from backend.schemas.form_schema import FieldDefinition, FormSchema
from backend.services.storage import StorageService


def _fill_field_value(field_obj: pikepdf.Dictionary, field_def: FieldDefinition, value: Any) -> None:
    """
    Directly set the value of a PDF form field using pikepdf.
    This properly fills the interactive form fields instead of drawing overlays.
    """
    if value in (None, ""):
        return

    field_type = field_def.type

    if field_type in {"text", "date", "number", "phone", "ssn"}:
        # Text fields: set /V (value) as string
        field_obj["/V"] = str(value)
        # Also set /AP (appearance) to None to force PDF viewer to regenerate appearance
        if "/AP" in field_obj:
            del field_obj["/AP"]

    elif field_type in {"checkbox", "radio"}:
        # Checkbox/radio: set /V to /Yes or /Off
        truthy = str(value).lower() in {"true", "1", "yes", "on"}
        truthy = truthy or value is True

        if truthy:
            # Look for available states in /AP/N dictionary
            if "/AP" in field_obj and "/N" in field_obj["/AP"]:
                states = field_obj["/AP"]["/N"]
                # Common checkbox states: /Yes, /On, /Checked
                if "/Yes" in states:
                    field_obj["/V"] = pikepdf.Name("/Yes")
                    field_obj["/AS"] = pikepdf.Name("/Yes")  # Appearance state
                elif "/On" in states:
                    field_obj["/V"] = pikepdf.Name("/On")
                    field_obj["/AS"] = pikepdf.Name("/On")
                else:
                    # Use first non-Off state
                    for state_key in states.keys():
                        if state_key != "/Off":
                            field_obj["/V"] = state_key
                            field_obj["/AS"] = state_key
                            break
            else:
                # Default to /Yes
                field_obj["/V"] = pikepdf.Name("/Yes")
        else:
            field_obj["/V"] = pikepdf.Name("/Off")
            if "/AS" in field_obj:
                field_obj["/AS"] = pikepdf.Name("/Off")


def _find_field_by_id(pdf: pikepdf.Pdf, field_id: str) -> pikepdf.Dictionary | None:
    """
    Find a form field in the PDF by matching the field ID.
    Searches through /AcroForm/Fields and page annotations.

    Handles field IDs that may have prefixes like "f_1001" vs PDF field names like "1001"
    """
    # Strip common prefixes to match PDF field names
    # Field IDs might be "f_1001" but PDF has "1001"
    field_id_stripped = field_id.removeprefix("f_").removeprefix("field_")

    # Try AcroForm fields first
    if "/AcroForm" in pdf.Root and "/Fields" in pdf.Root.AcroForm:
        for field in pdf.Root.AcroForm.Fields:
            field_obj = field
            if isinstance(field_obj, pikepdf.Dictionary):
                # Check if field name matches (field ID is often the /T name)
                if "/T" in field_obj:
                    field_name = str(field_obj["/T"])
                    # Try exact match, stripped match, or suffix match
                    if (field_name == field_id or
                        field_name == field_id_stripped or
                        field_name.endswith(f"_{field_id}") or
                        field_name.endswith(f"_{field_id_stripped}")):
                        return field_obj

    # Also check page annotations directly
    for page in pdf.pages:
        if "/Annots" in page:
            for annot in page.Annots:
                annot_obj = annot
                if isinstance(annot_obj, pikepdf.Dictionary):
                    if "/T" in annot_obj:
                        field_name = str(annot_obj["/T"])
                        # Try exact match, stripped match, or suffix match
                        if (field_name == field_id or
                            field_name == field_id_stripped or
                            field_name.endswith(f"_{field_id}") or
                            field_name.endswith(f"_{field_id_stripped}")):
                            return annot_obj

    print(f"[DEBUG] Failed to find field {field_id} (stripped: {field_id_stripped}), listing all PDF field names...")
    # Debug: List all field names
    all_field_names = []
    if "/AcroForm" in pdf.Root and "/Fields" in pdf.Root.AcroForm:
        for field in pdf.Root.AcroForm.Fields:
            if isinstance(field, pikepdf.Dictionary) and "/T" in field:
                all_field_names.append(str(field["/T"]))
    for page in pdf.pages:
        if "/Annots" in page:
            for annot in page.Annots:
                if isinstance(annot, pikepdf.Dictionary) and "/T" in annot:
                    name = str(annot["/T"])
                    if name not in all_field_names:
                        all_field_names.append(name)
    print(f"[DEBUG] Available fields in PDF: {all_field_names[:10]}...")  # First 10 only

    return None


def _write_pdf_sync(
    form_id: str,
    schema: FormSchema,
    current_values: dict[str, Any],
    orig_path: str,
    storage: StorageService,
    flatten: bool,
    output_kind: str,
) -> str:
    """
    Fill PDF form fields directly using pikepdf (no overlay approach).
    This is the proper way to fill interactive PDF forms.
    """
    pdf = pikepdf.open(orig_path)

    print(f"[DEBUG] Filling PDF with {len(current_values)} values")

    # Map field IDs to their definitions
    field_map = {field.id: field for field in schema.fields}

    # Iterate through values and fill matching fields
    filled_count = 0
    for field_id, value in current_values.items():
        if field_id not in field_map:
            print(f"[WARN] Field {field_id} not in schema")
            continue

        field_def = field_map[field_id]
        field_obj = _find_field_by_id(pdf, field_id)

        if field_obj is not None:
            try:
                _fill_field_value(field_obj, field_def, value)
                filled_count += 1
                print(f"[DEBUG] Filled field {field_id} = {value}")
            except Exception as e:
                print(f"[WARN] Failed to fill field {field_id}: {e}")
        else:
            print(f"[WARN] Could not find field object for {field_id} in PDF")

    print(f"[DEBUG] Successfully filled {filled_count}/{len(current_values)} fields")

    # Optionally flatten (remove interactivity, bake values into content)
    if flatten:
        # Flatten by removing form fields but keeping appearances
        if "/AcroForm" in pdf.Root:
            del pdf.Root.AcroForm

    # Save to bytes
    output = BytesIO()
    pdf.save(output, linearize=True)
    output.seek(0)
    pdf_bytes = output.read()

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
    Async wrapper for filling PDF form fields.
    """
    orig_path = storage.path_from_uri(orig_pdf_uri)
    kind = output_kind or f"forms/{form_id}"
    return await to_thread.run_sync(
        _write_pdf_sync,
        form_id,
        schema,
        current_values,
        str(orig_path),
        storage,
        flatten,
        kind,
    )
