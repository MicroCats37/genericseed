# Authentication & Permissions

Patterns for `django-ninja-jwt` and Ninja Extra permission classes.

## 🔐 JWT Setup

```python
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.controller import NinjaJWTDefaultController

api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController) # Adds /token, /token/refresh
```

## 🛡️ Controller Permissions

```python
from ninja_extra.permissions import IsAuthenticated, IsAdminUser

@api_controller('/admin-data', auth=JWTAuth(), permissions=[IsAdminUser])
class AdminController:
    ...
```

## 🧠 Custom Permissions

```python
from ninja_extra.permissions import BasePermission

class IsOwner(BasePermission):
    def has_permission(self, request, controller):
        return True # logic here
    
    def has_object_permission(self, request, controller, obj):
        return obj.user == request.user
```
