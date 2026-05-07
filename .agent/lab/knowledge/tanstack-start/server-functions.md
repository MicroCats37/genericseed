# TanStack Start — Server Functions

Server functions (`createServerFn`) are the primary way to do backend logic in TanStack Start. They use an RPC pattern where the client calls the function and a network request is made to the server.

## Basic Pattern

```tsx
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// GET server function (default)
export const getUser = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return await db.users.find(data.id)
  })

// POST server function
export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ 
    name: z.string().min(1),
    email: z.string().email(),
  }))
  .handler(async ({ data }) => {
    return await db.users.create(data)
  })
```

## Input Validation

Use `.inputValidator()` with Zod schemas for runtime validation:

```tsx
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  published: z.boolean().default(false),
})

export const createPost = createServerFn({ method: 'POST' })
  .inputValidator(CreatePostSchema)
  .handler(async ({ data }) => {
    // data is fully typed and validated at runtime
    return await db.posts.create({ data })
  })
```

## Middleware Attachment

Server functions can have middleware attached for auth, logging, etc.:

```tsx
import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '../middleware/auth.middleware'

export const getCurrentUser = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context contains what middleware injected (e.g., session)
    return await db.users.find(context.session.userId)
  })
```

## Handler Signature

```tsx
.handler(async ({ data, context }) => {
  // data — validated input from client
  // context — injected by middleware (typed)
  // this — ServerFnCtx (request, cookies, etc.)
})
```

## Calling from Client

```tsx
// Call with typed input
const user = await getUser({ data: { id: '123' } })

// Call POST with body
const newPost = await createPost({ data: { 
  title: 'Hello World',
  content: 'My first post',
}})

// Errors are automatically serialized to client
try {
  await createPost({ data: { title: '' } }) // Validation fails
} catch (error) {
  console.log(error.message) // "Validation failed"
}
```

## Return Types and Serialization

Server functions return data that is automatically serialized to JSON:

```tsx
export const getPost = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const post = await db.posts.find(data.id)
    if (!post) return null
    return post
  })

// Client receives serialized response
const post = await getPost({ data: { id: '123' } })
// post is typed: Awaited<ReturnType<typeof getPost>>
```

## Server Functions vs Server Routes

| Feature | Server Functions (`createServerFn`) | Server Routes (`server.handlers`) |
|---------|-------------------------------------|-----------------------------------|
| Pattern | RPC — client calls like a function | Raw HTTP — REST endpoints |
| Input | Zod validated | Manual `request.json()` |
| Type Safety | Full inference | Manual typing |
| Use Case | CRUD, mutations, authenticated actions | Webhooks, file downloads, custom headers |

## Server Routes (Raw HTTP)

For true REST APIs, use `server.handlers`:

```tsx
// routes/api/webhook.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        // Process webhook
        return Response.json({ received: true })
      },
    },
  },
})
```

## Error Handling

```tsx
import { notFound } from '@tanstack/react-router'

export const getPost = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const post = await db.posts.find(data.id)
    
    if (!post) {
      throw notFound() // Triggers error boundary
    }
    
    return post
  })
```

## Context7 Sources

- TanStack Start Server Functions: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- TanStack Start Server Routes: https://tanstack.com/start/latest/docs/framework/react/guide/server-routes
- TanStack Start Execution Model: https://tanstack.com/start/latest/docs/framework/react/guide/execution-model
