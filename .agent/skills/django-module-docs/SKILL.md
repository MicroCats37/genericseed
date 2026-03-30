---
name: django-module-docs
description: |
  Specialized skill for documenting Django modules following the clean architecture 
  (Model -> Service -> Controller). Use this to generate or update `DOCS.md` 
  within each module folder.
---

# Django Module Documentation (Clean Architecture)

This skill ensures that every module has a technical `DOCS.md` that reflects its current state, logic, and public API.

## 📁 File Location
`backend/modulos/<module_name>/DOCS.md`

## 📝 Documentation Template

```markdown
# Module: <ModuleName>

Brief description of the module's responsibility.

## 🏗️ Data Architecture (Models)
Summary of the main models and their relationships.
- **ModelName**: Purpose and key fields.

## ⚙️ Business Logic (Services)
Description of the complex logic residing in `services.py`.
- **ServiceMethodName**: What it solves and critical business rules.

## 🔌 API Endpoints (Controllers)
List of main endpoints and their purpose.
- **[METHOD] /path**: Brief description.
- **Auth/Permissions**: What's required.

## 🧪 Testing State
Brief overview of test coverage or specific edge cases tested.
```

## 🧠 Trigger Principles
- **Post-Refactor**: Always update `DOCS.md` after modifying models, services, or controllers.
- **New Module**: Create `DOCS.md` immediately after setting up the basic structure.
- **Sync**: Ensure the documentation matches the code implementation (Pydantic schemas, status codes).

## 🛠️ Implementation Rule
When the user asks to "document the module" or "complete the module", verify:
1. All models are listed with their purpose.
2. Service layer logic is explained (the "Why", not just "What").
3. Controllers are mapped to the API spec.
```
