from functools import wraps
import warnings
from typing import Callable, Any, Union, List
from ninja.errors import HttpError
from .security import verify_user_permissions


def requiere_permiso(
    permisos: Union[Any, List[Any]], requerir_todos: bool = True
) -> Callable:
    """Deprecated: Use CheckPermission class instead."""
    warnings.warn(
        "requiere_permiso is deprecated. Use CheckPermission(permisos) in controller permissions instead.",
        DeprecationWarning,
        stacklevel=2,
    )
    """
    Decorador para proteger funciones de Django Ninja.
    Uso: @requiere_permiso(Permisos.VER_DATOS, requerir_todos=False)
    """
    if not isinstance(permisos, list):
        permisos = [permisos]

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(request, *args: Any, **kwargs: Any) -> Any:
            user = getattr(request, "auth", None)

            if not verify_user_permissions(user, permisos, requerir_todos):
                # Si no está autenticado, verify_user_permissions devuelve False
                if not user or not user.is_authenticated:
                    raise HttpError(401, "No autenticado")
                raise HttpError(
                    403, "No tienes los permisos necesarios para esta acción"
                )

            return func(request, *args, **kwargs)

        return wrapper

    return decorator
