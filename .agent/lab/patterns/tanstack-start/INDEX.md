# TanStack Start — Patterns

Implementation patterns for TanStack Start applications.

## Contents

### Authentication
- **[with-auth.md](./with-auth.md)** — Auth middleware, session-based auth, protecting routes and server functions

### Error Handling
- **[domain-error.md](./domain-error.md)** — Typed errors, error codes, response envelope

### TanStack Query Integration
- **[tanstack-query-integration.md](./tanstack-query-integration.md)** — Server functions as mutations, optimistic updates, cache sync

### Server Routes
- **[server-routes.md](./server-routes.md)** — Raw HTTP handlers, when to use vs server functions

---

## Quick Reference

```tsx
// Protect route with beforeLoad
beforeLoad: async ({ location }) => {
  const user = await getCurrentUserFn()
  if (!user) throw redirect({ to: '/login', search: { redirect: location.href } })
  return { user }
}

// Server function with auth middleware
export const getData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return await fetchSecureData(context.session.userId)
  })
```

## Source

- **TanStack Start**: https://tanstack.com/start
