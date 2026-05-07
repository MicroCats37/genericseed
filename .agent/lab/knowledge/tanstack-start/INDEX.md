# TanStack Start Knowledge Base

Comprehensive technical documentation for TanStack Start framework.

## Contents

### Routing
- **[routing.md](./routing.md)** — File-based routing conventions, dynamic segments, nested layouts, Link component, type-safe navigation

### Server Functions
- **[server-functions.md](./server-functions.md)** — `createServerFn` pattern, Zod validation, middleware, RPC calling

### Data Loading
- **[data-loading.md](./data-loading.md)** — Loaders, beforeLoad, ensureQueryData, SSR modes, TanStack Query integration

### Middleware
- **[middleware.md](./middleware.md)** — Client/server middleware composition, context injection, redirect patterns

---

## Quick Reference

```tsx
// File conventions
__root.tsx      // Root layout
_index.tsx      // Exact path match
$param.tsx      // Dynamic segment
_layout.tsx     // Nested layout wrapper
$.tsx           // Catch-all / splat

// SSR modes
ssr: true           // Full SSR (default)
ssr: 'data-only'    // Server loader, client render
ssr: false          // Client-only (SPA mode)
```

## Source

- **TanStack Start**: https://tanstack.com/start
- **TanStack Router**: https://tanstack.com/router
- **TanStack Query**: https://tanstack.com/query
