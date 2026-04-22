# Zod Knowledge Index

## Documents
| Doc | Topic | When to Read |
|-----|-------|-------------|
| [01-inference.md](file:///c:/Users/Usuario/Desktop/generic/.lab/knowledge/zod/01-inference.md) | Inference | z.infer & types |
| [02-refinements.md](file:///c:/Users/Usuario/Desktop/generic/.lab/knowledge/zod/02-refinements.md) | Refinements | Custom validation logic |
| [03-transformations.md](file:///c:/Users/Usuario/Desktop/generic/.lab/knowledge/zod/03-transformations.md) | Transforms | Data normalization |
| [04-composition.md](file:///c:/Users/Usuario/Desktop/generic/.lab/knowledge/zod/04-composition.md) | Composition | Merging & Extending schemas |
| [05-forms-integration.md](file:///c:/Users/Usuario/Desktop/generic/.lab/knowledge/zod/05-forms-integration.md) | Forms | RHF integration |

## Quick Reference
- Use `z.infer<typeof schema>` as source of truth for types.
- Never write manual TypeScript interfaces for validated objects.
- Integration: Use with RHF via `@hookform/resolvers/zod`.
