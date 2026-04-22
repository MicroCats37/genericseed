import os
import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Elimina DB, migraciones generadas y __pycache__ para un reinicio limpio."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Omite la confirmación interactiva.",
        )

    def handle(self, *args, **options):
        # ── Confirmación ────────────────────────────────────────
        if not options["no_input"]:
            self.stdout.write(self.style.WARNING(
                "\n⚠️  Esto eliminará:\n"
                "   • db.sqlite3\n"
                "   • Todos los archivos de migración (excepto __init__.py)\n"
                "   • Todos los __pycache__ del proyecto\n"
            ))
            confirm = input("¿Confirmas el reset completo? (s/n): ")
            if confirm.lower() != "s":
                self.stdout.write(self.style.WARNING("Operación cancelada."))
                return

        base = Path(settings.BASE_DIR)

        # ── 1. Borrar base de datos ──────────────────────────────
        db_path = base / "db.sqlite3"
        if db_path.exists():
            db_path.unlink()
            self.stdout.write(self.style.SUCCESS(f"✓ DB eliminada: {db_path}"))
        else:
            self.stdout.write(self.style.WARNING("  DB no encontrada, omitiendo."))

        # ── 2. Borrar migraciones generadas ─────────────────────
        # Busca en 'modulos/' y 'core/' (donde viven las apps del proyecto)
        search_roots = [base / "modulos", base / "core"]

        self.stdout.write("\nBuscando migraciones...")
        total_removed = 0

        for search_root in search_roots:
            if not search_root.exists():
                continue
            for root, dirs, files in os.walk(search_root):
                root_path = Path(root)
                if root_path.name == "migrations":
                    for f in root_path.glob("*.py"):
                        if f.name != "__init__.py":
                            f.unlink()
                            self.stdout.write(f"  - Eliminado: {f.relative_to(base)}")
                            total_removed += 1
                    # Limpiar __pycache__ de la carpeta migrations
                    cache = root_path / "__pycache__"
                    if cache.exists():
                        shutil.rmtree(cache)

        self.stdout.write(self.style.SUCCESS(
            f"✓ {total_removed} archivos de migración eliminados."
        ))

        # ── 3. Borrar __pycache__ generales ─────────────────────
        self.stdout.write("\nLimpiando __pycache__...")
        cache_count = 0
        for root, dirs, files in os.walk(base):
            for d in dirs:
                if d == "__pycache__":
                    target = Path(root) / d
                    shutil.rmtree(target)
                    cache_count += 1
            # Evitar entrar en .venv
            dirs[:] = [d for d in dirs if d not in (".venv", ".git", "node_modules")]

        self.stdout.write(self.style.SUCCESS(f"✓ {cache_count} carpetas __pycache__ eliminadas."))

        # ── Instrucciones finales ────────────────────────────────
        self.stdout.write(self.style.HTTP_INFO(
            "\n✅ Reset completado. Ejecuta ahora:\n"
            "   uv run python manage.py makemigrations --settings=config.settings.development\n"
            "   uv run python manage.py migrate --settings=config.settings.development\n"
        ))
