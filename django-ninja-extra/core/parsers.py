import json
from typing import Type, TypeVar
from ninja import Schema
from ninja.errors import HttpError
from .utils import hydrate_and_clean_payload

T = TypeVar("T", bound=Schema)

def parse_form_json(data_field: str, files: dict, schema: Type[T]) -> T:
    """
    Parsea el campo 'data' de un FormData, hidrata archivos y valida contra un Schema.
    Uso: payload = parse_form_json(request.POST.get('data'), request.FILES, MiSchema)
    """
    if not data_field:
        raise HttpError(400, "El campo 'data' es requerido en el formulario.")

    try:
        raw = json.loads(data_field)
    except (ValueError, TypeError):
        raise HttpError(400, "El campo 'data' no contiene un JSON válido.")

    # Usamos la utilidad central para hidratar y limpiar
    hydrated = hydrate_and_clean_payload(raw, files)

    # Validación final contra el Schema de Pydantic
    try:
        return schema.model_validate(hydrated)
    except Exception as e:
        # Esto será capturado por tu handler de PydanticValidationError en core/exceptions.py
        raise e
