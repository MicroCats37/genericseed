# Antigravity Lab Architecture

> Spec-Driven & Domain-Centric System for generic

---

## 🏗️ System Components

The architecture is built on three pillars: **The Lab** (Source of Truth), **SDD Pipeline** (Process), and **Engram** (State).

### 1. The Lab (`.agent/lab/`)
A 4-layered documentation system that dictates how the code should be built.

- **Layer 1: Knowledge** (`knowledge/`) — Pure technical facts.
- **Layer 2: Patterns** (`patterns/`) — Implementation recipes.
- **Layer 3: Specs** (`specs/`) — Architectural contracts (Generic).
- **Layer 4: Projects** (`projects/`) — Domain Context Concentrator (Specific).

### 2. SDD Pipeline (Spec-Driven Development)
A strict sequential workflow for all implementations:
1. `explore` → Investigation & API discovery.
2. `propose` → Intent & scope definition.
3. `spec` → Delta rules (REQUIRED/FORBIDDEN).
4. `design` → Component tree & state architecture.
5. `tasks` → Atomic checklist.
6. `apply` → Code implementation.
7. `verify` → Quality/Spec audit.
8. `archive` → Final state sync.

### 3. Engram Persistence
Cross-session state management using topic-based memory.
- All SDD artifacts are stored with the key `sdd/{feature}/{phase}`.
- Allows seamless switching between reasoning models (Pro/Opus) and execution models (Flash).

---

## 🚦 Navigation Protocol

Before any architectural decision or code generation, the AI follows this path:
1. **Business Context**: `projects/{current}/DOMAIN.md` + `API-INVENTORY.md`.
2. **Technical Contract**: `specs/{framework}/INDEX.md`.
3. **Implementation Recipe**: `patterns/{tech}/INDEX.md`.

---

## 🛠️ Global Tools & Scripts

| Tool | Purpose |
|------|---------|
| `Engram` | Persistent state & memory. |
| `Context7` | Up-to-date documentation for external libs. |
| `Pencil` | UI/UX design generation and file edits (.pen). |

---

## 🏁 Summary Stats

- **Architecture Mode**: Lab-Centric / SDD.
- **Execution Model**: Sequential Pipeline (One phase per turn).
- **Core Strategy**: Separation of Business Logic (`projects/`) and Technical Contracts (`specs/`).
