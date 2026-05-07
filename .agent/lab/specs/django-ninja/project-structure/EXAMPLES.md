# Project Structure: Worked Examples — Hexagonal Architecture

## Example 1: Complete App Structure (`mesa_partes`)

```
mesa_partes/
├── __init__.py
├── apps.py
├── domain/                 # NÚCLEO HEXAGONAL (Reglas de Negocio)
│   ├── exceptions.py       
│   ├── interfaces.py       # Puertos
│   └── services.py         # Casos de uso
├── infrastructure/         # ADAPTADORES SECUNDARIOS (Base de datos, APIs externas)
│   ├── models.py           # Django ORM
│   ├── repositories.py     # Implementa interfaces.py
│   └── selectors.py        # Consultas de lectura
└── presentation/           # ADAPTADORES PRIMARIOS (La cara hacia afuera)
    ├── controllers.py      # Ninja Extra @api_controller
    └── schemas.py          # Pydantic Schemas
core/                       # DI Container y utilidades compartidas
├── di.py                   # Setup de inyección
└── exceptions.py           
```

## Example 2: Domain Layer (`domain/interfaces.py` & `domain/services.py`)

```python
# domain/interfaces.py
from typing import Protocol

class IDocumentoRepository(Protocol):
    def guardar(self, datos: dict) -> dict: ...

# domain/services.py
from ninja_extra.di import inject
from .interfaces import IDocumentoRepository
from .exceptions import DatosInvalidosError

class DocumentoService:
    @inject
    def __init__(self, repo: IDocumentoRepository):
        self.repo = repo

    def procesar_nuevo_documento(self, datos: dict):
        if not datos.get("titulo"):
            raise DatosInvalidosError("Falta el título")
        return self.repo.guardar(datos)
```

## Example 3: Infrastructure Layer (`infrastructure/repositories.py`)

```python
# infrastructure/models.py
from django.db import models

class DocumentoORM(models.Model):
    titulo = models.CharField(max_length=200)

# infrastructure/repositories.py
from ..domain.interfaces import IDocumentoRepository
from .models import DocumentoORM

class DjangoDocumentoRepository(IDocumentoRepository):
    def guardar(self, datos: dict) -> dict:
        doc = DocumentoORM.objects.create(**datos)
        return {"id": doc.id, "titulo": doc.titulo}
```

## Example 4: Presentation Layer (`presentation/controllers.py`)

```python
# presentation/schemas.py
from ninja import Schema

class DocumentoIn(Schema):
    titulo: str

class DocumentoOut(Schema):
    id: int
    titulo: str

# presentation/controllers.py
from ninja_extra import api_controller, route
from ninja_extra.di import inject
from ..domain.services import DocumentoService
from .schemas import DocumentoIn, DocumentoOut

@api_controller('/documentos', tags=['Mesa de Partes'])
class DocumentoController:
    @inject
    def __init__(self, service: DocumentoService):
        self.service = service

    @route.post('', response={201: DocumentoOut})
    def crear(self, payload: DocumentoIn):
        # El controlador NO tiene lógica, solo delega
        return self.service.procesar_nuevo_documento(payload.dict())
```

## Example 5: DI Container (`settings.py` + `modulos/di.py`)

```python
# settings.py
NINJA_EXTRA = {
    "INJECTOR_MODULES": [
        "mesa_partes.modulos.di.AppModule",
    ]
}

# mesa_partes/modulos/di.py
from injector import Module, singleton
from mesa_partes.domain.interfaces import IDocumentoRepository
from mesa_partes.infrastructure.repositories import DjangoDocumentoRepository

class AppModule(Module):
    def configure(self, binder):
        binder.bind(IDocumentoRepository, to=DjangoDocumentoRepository, scope=singleton)
```

## See Also
- [Spec: Project Structure](./SPEC.md)
- [Knowledge: Hexagonal Architecture](../../../knowledge/django-ninja/hexagonal-architecture.md)