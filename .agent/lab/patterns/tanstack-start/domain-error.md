# TanStack Start — Domain Error Pattern

How to handle errors in TanStack Start server functions, mapping our DomainError/AppError pattern.

## Error Codes

TanStack Start uses these standard error codes (mirrors Django/Next.js):

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `PERMISSION_DENIED` | 403 | User lacks permission |
| `CONFLICT` | 409 | Resource conflict (duplicate) |
| `BUSINESS_ERROR` | 422 | Business logic violation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Response Envelope

All server functions return this envelope structure:

```typescript
// Success response
{
  success: true,
  data: T,          // Actual data
  error: null,
  meta?: {          // Optional pagination
    page: number
    perPage: number
    total: number
  }
}

// Error response
{
  success: false,
  data: null,
  error: {
    code: string,           // Error code
    message: string,        // Human-readable message
    details?: unknown       // Optional additional info
  }
}
```

## DomainError Class

```typescript
// src/lib/error.ts
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

// Pre-defined error factory functions
export const errors = {
  notFound: (resource: string, id?: string) =>
    new DomainError('NOT_FOUND', `${resource}${id ? ` ${id}` : ''} not found`, 404),
  
  validation: (message: string, details?: unknown) =>
    new DomainError('VALIDATION_ERROR', message, 400, details),
  
  permissionDenied: (action: string) =>
    new DomainError('PERMISSION_DENIED', `Permission denied: ${action}`, 403),
  
  conflict: (resource: string, identifier?: string) =>
    new DomainError('CONFLICT', `${resource}${identifier ? ` ${identifier}` : ''} already exists`, 409),
  
  business: (message: string, details?: unknown) =>
    new DomainError('BUSINESS_ERROR', message, 422, details),
  
  internal: (message = 'Internal server error') =>
    new DomainError('INTERNAL_ERROR', message, 500),
} as const
```

## Server Function Error Handling

```tsx
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { errors } from '../lib/error'

const PostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
})

export const createPost = createServerFn({ method: 'POST' })
  .inputValidator(PostSchema)
  .handler(async ({ data }) => {
    try {
      // Check for duplicate title
      const existing = await db.posts.find({ where: { title: data.title } })
      if (existing) {
        throw errors.conflict('Post', `with title "${data.title}"`)
      }
      
      const post = await db.posts.create({ data })
      
      return {
        success: true,
        data: post,
        error: null,
      }
    } catch (error) {
      if (error instanceof DomainError) {
        throw error // Re-throw DomainErrors as-is
      }
      console.error('Create post failed:', error)
      throw errors.internal('Failed to create post')
    }
  })

export const getPost = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const post = await db.posts.find(data.id)
    
    if (!post) {
      throw errors.notFound('Post', data.id)
    }
    
    return {
      success: true,
      data: post,
      error: null,
    }
  })
```

## Client-Side Error Handling

```tsx
import { createPost } from '../server/functions/posts.functions'

async function handleCreatePost(data) {
  try {
    const result = await createPost({ data })
    
    if (!result.success) {
      // Handle error from response envelope
      switch (result.error.code) {
        case 'NOT_FOUND':
          showNotification('Post not found', 'error')
          break
        case 'VALIDATION_ERROR':
          showValidationErrors(result.error.details)
          break
        case 'PERMISSION_DENIED':
          router.navigate({ to: '/login' })
          break
        default:
          showNotification(result.error.message, 'error')
      }
      return
    }
    
    // Success
    router.navigate({ to: '/posts/$postId', params: { postId: result.data.id } })
  } catch (error) {
    // Network or serialization error
    showNotification('Network error. Please try again.', 'error')
  }
}
```

## Using with TanStack Query Mutations

```tsx
import { useMutation } from '@tanstack/react-query'
import { createPost } from '../server/functions/posts.functions'

function CreatePostForm() {
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: (result) => {
      if (!result.success) {
        // Handle business error
        if (result.error.code === 'CONFLICT') {
          showNotification(result.error.message, 'warning')
          return
        }
      }
      
      // Success — invalidate posts list
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (error) => {
      // Network error
      showNotification('Failed to create post', 'error')
    },
  })
  
  return (
    <form onSubmit={() => mutation.mutate({ title: 'New', content: '...' })}>
      {/* form fields */}
    </form>
  )
}
```

## Error Boundary Integration

TanStack Start's `errorComponent` catches thrown errors:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { DomainError, errors } from '../lib/error'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await db.posts.find(params.postId)
    if (!post) {
      throw errors.notFound('Post', params.postId)
    }
    return { post }
  },
  errorComponent: ({ error }) => {
    if (error instanceof DomainError) {
      return (
        <ErrorPage
          code={error.code}
          message={error.message}
          statusCode={error.statusCode}
        />
      )
    }
    return <ErrorPage code="INTERNAL_ERROR" message="Unexpected error" />
  },
})
```

## Context7 Sources

- TanStack Start Server Functions: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- TanStack Start Error Handling: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions#error-handling--redirects
