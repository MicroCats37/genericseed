"""
Schema transformation utilities for the file hydration protocol.

AsForm[MySchema] → Generates a new Schema identical to MySchema but with all
                   UploadedFile fields replaced by str (file token strings).

hydrate_form(form_data, files, MySchema) → Takes the parsed AsForm instance
                                            + list of UploadedFiles and returns
                                            a fully hydrated MySchema instance.
                                            Also sanitizes empty strings → None
                                            for DB homogeneity.

Usage:
    class DocumentoSchema(Schema):
        name: str
        dni: UploadedFile

    @api.post("/doc")
    def create(request, data: Form[AsForm[DocumentoSchema]], files: File[list[UploadedFile]]):
        payload = hydrate_form(data, files, DocumentoSchema)
        payload.dni  # → UploadedFile real ✅
"""

import re
from typing import Any, Type, TypeVar
from pydantic import create_model, model_validator
from pydantic.fields import FieldInfo
from ninja import Schema
from django.core.files.uploadedfile import UploadedFile

T = TypeVar("T", bound=Schema)

# Tipos que deben convertirse a str en la versión Form
_FILE_TYPES = (UploadedFile,)

# Patrón para identificar tokens de archivo: file_uuid (no tocar en sanitización)
FILE_KEY_PATTERN = re.compile(r"^file_[A-Za-z0-9_-]+$")

# Cache para no regenerar el mismo schema dos veces
_form_schema_cache: dict[type, type] = {}


class BaseSchema(Schema):
    """
    Schema base del proyecto. Todos los schemas de negocio deben heredar de este.

    Comportamiento automático:
        - Convierte strings vacíos ("" / "   ") → None antes de validar.
        - Respeta tokens de archivo (file_uuid) para no romper la hidratación.
        - Funciona para endpoints JSON puros y FormData con archivos.

    Uso:
        class DocumentoSchema(BaseSchema):
            name: str
            dni: UploadedFile
    """

    model_config = {"arbitrary_types_allowed": True}

    @model_validator(mode="before")
    @classmethod
    def sanitize_strings(cls, data: Any) -> Any:
        return _sanitize_empty_strings(data)


class DataForm(Schema):
    """
    Wrapper para recibir el campo 'data' JSON que envía buildApiPayload.
    Usar como: data: Form[DataForm] en el endpoint.
    """
    data: str


def AsForm(schema_cls: Type[T]) -> Type[Schema]:
    """
    Genera dinámicamente una versión "Form-safe" del schema dado.
    Todos los campos UploadedFile se convierten a str.

    Ejemplo:
        class DocumentoSchema(Schema):
            name: str
            dni: UploadedFile

        AsForm[DocumentoSchema] genera en runtime:
            class DocumentoSchemaForm(Schema):
                name: str
                dni: str   ← Ninja lo parsea del FormData como token string
    """
    if schema_cls in _form_schema_cache:
        return _form_schema_cache[schema_cls]

    new_fields: dict[str, Any] = {}

    for field_name, field_info in schema_cls.model_fields.items():
        annotation = field_info.annotation

        # Si el tipo es UploadedFile (o subclase), lo reemplazamos con str
        if annotation is not None and _is_file_type(annotation):
            new_fields[field_name] = (str, _clone_field_as_str(field_info))
        else:
            new_fields[field_name] = (annotation, field_info)

    form_schema = create_model(
        f"{schema_cls.__name__}Form",
        __base__=Schema,
        **new_fields,
    )

    _form_schema_cache[schema_cls] = form_schema
    return form_schema


def hydrate_form(form_data: Schema, files: list[UploadedFile], target_schema: Type[T]) -> T:
    """
    Toma la instancia del schema Form (con strings de tokens) +
    el array de UploadedFiles y devuelve el schema real completamente hidratado.

    Validaciones explícitas:
        - Token referenciado en JSON pero archivo no enviado → HttpError 400
        - Campo UploadedFile con valor que no es un token string → HttpError 400
        - Archivos enviados pero ningún campo los referencia → HttpError 400

    Proceso:
        1. Construye un mapa {token: UploadedFile} a partir del nombre del archivo.
        2. Itera los campos UploadedFile del target_schema.
        3. Sustituye el token string por el UploadedFile real.
        4. Verifica que no haya archivos huérfanos.
        5. Valida el resultado contra target_schema.
    """
    from ninja.errors import HttpError

    # 1. Construir mapa token → UploadedFile
    token_map: dict[str, UploadedFile] = {}
    for f in files:
        if f.name and "___" in f.name:
            token, real_name = f.name.split("___", 1)
            f.name = real_name  # Restaurar nombre real
            token_map[token] = f
        else:
            # Archivo sin token → no puede ser mapeado, es un payload inválido
            raise HttpError(
                400,
                f"Archivo con formato de nombre inválido: '{f.name}'. "
                "Se esperaba 'token___nombre_real.ext'.",
            )

    raw = form_data.model_dump()
    claimed_tokens: set[str] = set()

    # 2. Iterar campos UploadedFile del schema objetivo
    for field_name, field_info in target_schema.model_fields.items():
        if not _is_file_type(field_info.annotation):
            continue

        value = raw.get(field_name)

        # El campo debe ser un string token (viene del Form parseado por Ninja)
        if not isinstance(value, str):
            raise HttpError(
                400,
                f"El campo '{field_name}' debe ser un token de archivo (string), "
                f"pero se recibió: {type(value).__name__}.",
            )

        # El token debe existir en los archivos enviados
        if value not in token_map:
            raise HttpError(
                400,
                f"Referencia de archivo rota: el campo '{field_name}' referencia "
                f"el token '{value}' pero no se encontró en los archivos enviados.",
            )

        raw[field_name] = token_map[value]
        claimed_tokens.add(value)

    # 3. Verificar que no hayan archivos enviados pero no referenciados (huérfanos)
    orphan_tokens = set(token_map.keys()) - claimed_tokens
    if orphan_tokens:
        raise HttpError(
            400,
            f"Se enviaron archivos que no están referenciados en ningún campo: "
            f"{', '.join(orphan_tokens)}.",
        )

    # 4. Sanitizar strings vacíos → None antes de validar
    raw = _sanitize_empty_strings(raw)

    # 5. Validar contra el schema real (Pydantic captura el resto)
    return target_schema.model_validate(raw)


# ─── Helpers internos ────────────────────────────────────────────────────────

def parse_form_json(data_field: str | None, files: Any, target_schema: Type[T]) -> T:
    """
    Parsea el campo 'data' de un FormData (formato buildApiPayload),
    hidrata archivos usando hydrate_form y valida contra el schema.

    Formato esperado del FormData:
        data: '{"dni":"...","foto_frontal":"file_uuid"}'
        files: [UploadedFile con nombre "file_uuid___original.jpg"]

    Uso: payload = parse_form_json(request.POST.get("data"), request.FILES, ConocidoIn)
    """
    import json
    from ninja.errors import HttpError

    if not data_field:
        raise HttpError(400, "El campo 'data' es requerido en el formulario.")

    try:
        raw = json.loads(data_field)
    except (ValueError, TypeError):
        raise HttpError(400, "El campo 'data' no contiene un JSON válido.")

    form_schema_cls = AsForm(target_schema)
    form_data = form_schema_cls.model_validate(raw)

    # Convertir a lista plana de UploadedFile (soporta múltiples formatos de entrada)
    file_list: list = []
    if isinstance(files, list):
        file_list = files
    elif hasattr(files, "getlist"):
        for key in files.keys():
            file_list.extend(files.getlist(key))
    elif isinstance(files, dict):
        for v in files.values():
            if isinstance(v, list):
                file_list.extend(v)
            else:
                file_list.append(v)

    return hydrate_form(form_data, file_list, target_schema)

def _sanitize_empty_strings(node: Any) -> Any:
    """
    Recorre recursivamente un dict/list y convierte strings vacíos
    o con solo espacios en None, para mantener homogeneidad en la DB.
    Los tokens de archivo (file_xxx) se omiten y pasan intactos.
    """
    if isinstance(node, dict):
        return {k: _sanitize_empty_strings(v) for k, v in node.items()}
    if isinstance(node, list):
        return [_sanitize_empty_strings(i) for i in node]
    if isinstance(node, str):
        # No tocar tokens de archivo
        if FILE_KEY_PATTERN.match(node):
            return node
        return None if not node.strip() else node
    return node


def _is_file_type(annotation: Any) -> bool:
    """Devuelve True si el tipo es UploadedFile o subclase."""
    try:
        return isinstance(annotation, type) and issubclass(annotation, _FILE_TYPES)
    except TypeError:
        return False


def _clone_field_as_str(field_info: FieldInfo) -> FieldInfo:
    """Clona un FieldInfo preservando metadata pero forzando type str."""
    return FieldInfo(
        default=field_info.default,
        description=field_info.description,
        title=field_info.title,
        examples=field_info.examples,
    )
