# Schemas & Data Validation (Strict Rules)

Using `ninja-schema` and Pydantic v2 for robust data contracts.

## 📏 Core Schema Rules

### 1. Mandatory `ModelSchema`
Always use `ModelSchema` to leverage the existing Django model definitions. Define the internal `Config` (Pydantic v2) or `Meta` class properly.

```python
from ninja_schema import ModelSchema
from .models import Client

class ClientBase(ModelSchema):
    class Config:
        model = Client
        model_fields = ['id', 'name', 'email']
```

### 2. Dualality: In vs Out
**Never** use the same schema for both input and output. Separation of concerns is mandatory.

- **[Name]In**: For POST/PUT payloads.
- **[Name]Out**: For API responses.

### 3. Handling Foreign Keys
- **Input (In)**: Request only the ID with strict typing.
- **Output (Out)**: Nest the relationship using another Schema to provide full context.

```python
# ✅ GOOD: Handing FKs
class VisitIn(ModelSchema):
    client_id: int  # Just the ID for input
    bungalow_id: int | None = None

    class Config:
        model = Visit
        model_fields = ['check_in', 'check_out']

class VisitOut(ModelSchema):
    client: ClientOut  # Nested object for output
    bungalow: BungalowOut | None

    class Config:
        model = Visit
        model_fields = ['id', 'check_in', 'check_out', 'total_price']
```

### 4. Advanced & Modern Typing
Use native Python 3.10+ typing for clarity and speed.

- Use `| None` instead of `Optional`.
- Use `list[str]` instead of `List[str]`.
- All fields should have meaningful type hints.

## 🧠 Schema Organization
- **Feature Level**: Place schemas in `modulos/<module>/features/<feature>/schemas/`.
- **Module Level**: Export them in `modulos/<module>/schemas/__init__.py`.
- **Validation**: Ensure `from_attributes = True` is set in output schemas to support Django ORM objects.
