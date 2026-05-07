# TanStack Start — Middleware

TanStack Start middleware is composable with separate client and server phases. It can be attached to routes via `beforeLoad` or to server functions via `.middleware()`.

## Basic Pattern

```tsx
import { createMiddleware } from '@tanstack/react-start'

export const authMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    // Client-side: add auth header to outgoing requests
    const token = getToken()
    return next({
      headers: { Authorization: `Bearer ${token}` },
    })
  })
  .server(async ({ next, request }) => {
    // Server-side: validate and inject context
    const session = await auth.getSession({ headers: request.headers })
    
    if (!session) {
      throw new Error('Unauthorized')
    }
    
    return next({ context: { session } })
  })
```

## Context Injection

Use `next({ context: { ... } })` to inject data that flows to route `beforeLoad`, loader, and server function handlers:

```tsx
// Middleware injects context
export const authMiddleware = createMiddleware()
  .server(async ({ next, request }) => {
    const session = await auth.getSession({ headers: request.headers })
    
    return next({ 
      context: { 
        user: session.user,
        workspaceId: session.workspaceId,
      } 
    })
  })

// Route receives typed context
export const Route = createFileRoute('/dashboard')({
  beforeLoad: authMiddleware, // Attach middleware
  
  loader: async ({ context }) => {
    // context is typed: { user: User, workspaceId: string }
    return await fetchDashboard(context.workspaceId)
  },
})
```

## sendContext — Client to Server Data

`sendContext` transmits client data to server middleware:

```tsx
import { createMiddleware } from '@tanstack/react-start'

export const workspaceMiddleware = createMiddleware()
  .client(async ({ next, context }) => {
    // Send current workspace to server
    return next({
      sendContext: { workspaceId: context.currentWorkspaceId },
    })
  })
  .server(async ({ next, context }) => {
    // Receive workspace from client
    console.log('Workspace:', context.workspaceId)
    
    return next({ context: { workspaceId: context.workspaceId } })
  })
```

## Composition

Chain middleware with `.middleware()`:

```tsx
import { createMiddleware } from '@tanstack/react-start'

const loggingMiddleware = createMiddleware()
  .server(async ({ next }) => {
    console.log('Request received')
    return next()
  })

const authMiddleware = createMiddleware()
  .middleware([loggingMiddleware]) // Compose logging first
  .server(async ({ next }) => {
    const session = await auth.getSession()
    if (!session) throw new Error('Unauthorized')
    return next({ context: { session } })
  })

// Attach to route
export const Route = createFileRoute('/dashboard')({
  beforeLoad: authMiddleware,
})
```

## Attaching to Server Functions

```tsx
import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../middleware/auth.middleware'

export const getSecureData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context contains session from middleware
    return await fetchUserData(context.session.userId)
  })
```

## Redirect Pattern

Throw `redirect()` from `beforeLoad` or middleware:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUser()
    
    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    
    return { user }
  },
})
```

## Middleware on Routes vs Server Functions

| Aspect | Route `beforeLoad` | Server Function `.middleware()` |
|--------|-------------------|-------------------------------|
| Runs | Before route loads | When function is called |
| Access | Route params, search, context | Request headers, context |
| Use | Auth checks, redirect, context injection | Auth validation, request modification |
| Client phase | ✅ Yes | ✅ Yes |
| Server phase | ✅ Yes | ✅ Yes |

## Context7 Sources

- TanStack Start Middleware: https://tanstack.com/start/latest/docs/framework/react/guide/middleware
- TanStack Start Auth: https://tanstack.com/start/latest/docs/framework/react/guide/authentication
