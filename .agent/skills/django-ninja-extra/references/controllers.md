# Django Ninja Extra Controllers

Controllers in Ninja Extra allow for Class-Based API organization, which improves code reuse and state management.

## 🏗️ Basic Controller Structure

```python
from ninja_extra import api_controller, http_get, http_post
from ..features.user.services import UserService

@api_controller('/users', tags=['Users'])
class UserController:
    @http_get('')
    def list_users(self, request):
        """List all users using the feature service."""
        return UserService.get_all_active()

    @http_get('/{id}', response=UserSchema)
    def get_user(self, id: int):
        return UserService.get_by_id(id)
```

## 🛠️ Decorators Reference
- `@http_get`, `@http_post`, `@http_put`, `@http_patch`, `@http_delete`.
- Same arguments as standard Ninja (`response`, `auth`, `url_name`, etc.).

## 🔌 Registration
Controllers must be registered in the `NinjaExtraAPI` instance.

```python
from ninja_extra import NinjaExtraAPI
from .controllers.user_controller import UserController

api = NinjaExtraAPI(title="Club API")
api.register_controllers(UserController)
```

## 🧠 Best Practice: No Logic in Controllers
Controllers should only:
1. Parse/Validate input (via Schemas).
2. Call a Service method.
3. Return the Service's result or handle specific HTTP exceptions.
