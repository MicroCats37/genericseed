"""
Paginacion nativa de django-ninja-extra.

Uso en endpoints:

    from core.pagination import paginate, PageNumberPaginationExtra, PaginatedResponseSchema

    @router.get("/", response=PaginatedResponseSchema[BungalowOut])
    @paginate(PageNumberPaginationExtra)
    def list_bungalows(request, **kwargs):
        return Bungalow.objects.all()

Acepta query params en cada request: ?page=1&page_size=20
"""
from ninja_extra.pagination import (
    paginate,
    PageNumberPaginationExtra,
    PaginatedResponseSchema,
)

__all__ = [
    "paginate",
    "PageNumberPaginationExtra",
    "PaginatedResponseSchema",
]
