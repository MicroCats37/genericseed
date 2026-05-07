# TanStack Start — Authentication Pattern

TanStack Start has no built-in auth — implement using sessions, middleware, and server functions.

## Session Pattern (Cookies + Server Function)

### 1. Session Manager

```tsx
// src/server/session.server.ts
import { createServerFn } from '@tanstack/react-start'
import { useAppSession } from '../utils/session' // vinxi session

export const getCurrentUserFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await useAppSession()
    
    if (!session.data.userId) {
      return null
    }
    
    return {
      id: session.data.userId,
      email: session.data.userEmail,
      role: session.data.role,
    }
  })

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ email: z.string(), password: z.string() }))
  .handler(async ({ data }) => {
    const user = await authenticateUser(data.email, data.password)
    
    if (!user) {
      throw new Error('Invalid credentials')
    }
    
    const session = await useAppSession()
    await session.update({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
    })
    
    return { success: true, user: { id: user.id, email: user.email } }
  })

export const logoutFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const session = await useAppSession()
    await session.clear()
    throw redirect({ to: '/login' })
  })
```

### 2. Protect Routes with beforeLoad

```tsx
// src/routes/_authed.tsx — Protected layout
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUserFn } from '../server/session.server'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()
    
    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    
    return { user }
  },
  component: AuthedLayout,
})

function AuthedLayout({ children }) {
  return <>{children}</>
}

// Usage: routes under /_authed/ are automatically protected
// src/routes/_authed/dashboard.tsx
// src/routes/_authed/settings.tsx
```

### 3. Protected Route Component

```tsx
// src/routes/_authed/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  // User context from _authed beforeLoad
  const { user } = Route.useRouteContext()
  
  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <UserDashboard userId={user.id} />
    </div>
  )
}
```

## Auth Middleware for Server Functions

```tsx
// src/server/middleware/auth.middleware.ts
import { createMiddleware } from '@tanstack/react-start'
import { getCurrentUserFn } from '../session.server'

export const authMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    return next({
      headers: { Authorization: `Bearer ${getToken()}` },
    })
  })
  .server(async ({ next }) => {
    const user = await getCurrentUserFn()
    
    if (!user) {
      throw new Error('Unauthorized')
    }
    
    return next({ context: { session: user } })
  })

export const requireRole = (role: string) =>
  createMiddleware({ type: 'function' })
    .middleware([authMiddleware])
    .server(async ({ next, context }) => {
      if (context.session.role !== role) {
        throw new Error(`Forbidden: requires ${role} role`)
      }
      return next({ context: { ...context, requiredRole: role } })
    })
```

### Using with Server Functions

```tsx
import { createServerFn } from '@tanstack/react-start'
import { authMiddleware, requireRole } from '../middleware/auth.middleware'

export const getAdminData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware, requireRole('admin')])
  .handler(async ({ context }) => {
    return await fetchAdminPanel(context.session.userId)
  })
```

## Mapping to Our RBAC Pattern

This maps to our existing Django/Next.js auth patterns:

| Pattern | TanStack Start | Django | Next.js |
|---------|---------------|--------|---------|
| Session | `useAppSession()` | `SessionMiddleware` | `iron-session` |
| Current User | `getCurrentUserFn()` | `get_current_user()` | `getServerSession()` |
| Route Guard | `beforeLoad` + `redirect` | `@login_required` | `withAuth()` |
| Server Guard | `.middleware([authMiddleware])` | `permission_required()` | `requireAuth()` |
| Role Check | Custom middleware | `user.has_perm()` | `hasRole()` |

## Login/Logout UI

```tsx
// src/routes/_authed.tsx or __root.tsx
import { Link, useNavigate } from '@tanstack/react-router'
import { logoutFn } from '../server/session.server'

function AuthUI() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate({ from: '/' })
  
  const handleLogout = async () => {
    await logoutFn()
    await navigate({ to: '/login' })
  }
  
  return (
    <div class="flex gap-4">
      {user ? (
        <>
          <span>{user.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </div>
  )
}
```

## Context7 Sources

- TanStack Start Auth: https://tanstack.com/start/latest/docs/framework/react/guide/authentication
- TanStack Start Middleware: https://tanstack.com/start/latest/docs/framework/react/guide/middleware
