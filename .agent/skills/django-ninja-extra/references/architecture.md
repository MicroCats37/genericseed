# Feature-First (Screaming) Architecture

This pattern optimizes for high cohesion and low coupling by organizing a Django module around its internal business features.

## 📁 Directory Structure

```
modulos/<module_name>/
├── features/               # Internal non-Django modules
│   └── <feature_name>/
│       ├── models/         # Feature-specific models
│       ├── schemas/        # Feature-specific Pydantic schemas
│       └── services/       # Business logic (Write/Complex Read)
├── models/                 # Centralized Model exports
├── schemas/                # Centralized Schema exports
├── services/               # Centralized Service exports
└── controllers/            # Django Ninja Extra Controllers
```

## 🧠 Centralized Exports Pattern

To keep the rest of the application (and Django's app registry) simple, we export everything through the module's root packages.

### Example: `modulos/identidad/models/__init__.py`
```python
from ..features.user.models import User
from ..features.profile.models import Profile

__all__ = ["User", "Profile"]
```

## 🚀 Benefits
- **Locality**: Related logic stays together.
- **Scalability**: Files don't grow indefinitely.
- **Readability**: The folder structure "screams" what the module does.
- **Decoupling**: Features can be moved or replaced with minimal impact on other parts of the module.
