# The .lab: Enterprise AI Knowledge & Specs
**Version: 1.0.0**

This directory is the "Source of Truth" for our technical architecture. It is designed to be token-efficient, framework-agnostic in its facts, and framework-specific in its decisions.

## 🏛 Layered Architecture

1.  **knowledge/**: Technical facts and canonical patterns for core libraries. (E.g. Axios, Zod, React 19).
2.  **specs/**: Architectural contracts defining *how* we use technologies in specific frameworks (E.g. Next.js).
3.  **skills/**: AI-executable blueprints that connect knowledge + specs to specific project actions.

## 🚦 Navigation
- [Knowledge Index](file:///c:/Users/Usuario/Desktop/generic/.lab/knowledge/INDEX.md)
- [Next.js Specs Index](file:///c:/Users/Usuario/Desktop/generic/.lab/specs/nextjs/INDEX.md)

## ✍ Governance Rules
- **English Only**: All documents are written in English for maximum token efficiency.
- **Forbidden/Required**: Specs MUST explicitly show forbidden old patterns (React 18) vs required new ones (React 19).
- **Self-Contained**: Specs should be readable as cheat sheets, with links to knowledge for deep dives only.
