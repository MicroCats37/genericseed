---
name: django-ninja-extra
description: |
  Advanced patterns for Django Ninja Extra and Feature-First Architecture.
  Provides Class-Based Controllers, JWT integration, and distributed module logic.
---

# Django Ninja Extra & Distributed Architecture

> **Scalable Patterns for Modern Django APIs.**

This skill defines the architectural standards for this project, moving away from "flat" apps towards **Feature-First (Screaming) Architecture**.

---

## 🏗️ Core Architecture
We organize code by **Features** within Django modules to maintain high cohesion.

- [**Architecture Guide**](./references/architecture.md) - Distributed features, folder layout, and centralized exports.

---

## 🚀 API Development (Ninja Extra)
We prefer **Class-Based Controllers** over standard routers for production-grade APIs.

- [**Controllers Reference**](./references/controllers.md) - `@api_controller`, registration, and decorators.
- [**Schemas & Validation**](./references/schemas.md) - `ModelSchema` (ninja-schema) and Pydantic patterns.
- [**Auth & Permissions**](./references/authentication.md) - `JWTAuth` and permission classes.

---

## 🧠 Philosophy: "Screaming" Modules
1. **The directory structure tells a story**: `features/auth/` clearly defines functionality better than a generic `views.py`.
2. **Controllers are thin**: They orchestrate; they don't calculate.
3. **Services are thick**: Business logic lives in feature services.
4. **Consistency is key**: Every module in `backend/modulos/` follows this blueprint.

---

## 🛠️ Usage Trigger
- When creating a new endpoint: Use `@api_controller`.
- When adding logic: Create or update a service in `features/<name>/services/`.
- When adding a model: Place it in `features/<name>/models/` and export in the root `models/__init__.py`.
