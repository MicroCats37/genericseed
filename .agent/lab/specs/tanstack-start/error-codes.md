# TanStack Start — Error Codes

Standardized error code registry for all TanStack Start applications. MIRRORS Django and Next.js error codes.

## Error Code Registry

| Code | HTTP Status | Description | Use Case |
|------|-------------|-------------|----------|
| `NOT_FOUND` | 404 | Resource not found | Item doesn't exist |
| `VALIDATION_ERROR` | 400 | Input validation failed | Zod/strict check fails |
| `PERMISSION_DENIED` | 403 | User lacks permission | Authenticated but unauthorized |
| `CONFLICT` | 409 | Resource conflict | Duplicate unique field |
| `BUSINESS_ERROR` | 422 | Business logic violation | Business rule check fails |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Unexpected exceptions |

## HTTP Status Mapping

| Code | HTTP Status | Thrown By |
|------|-------------|-----------|
| `NOT_FOUND` | 404 | `throw notFound()` or `errors.notFound()` |
| `VALIDATION_ERROR` | 400 | Zod validation failure |
| `PERMISSION_DENIED` | 403 | `beforeLoad` redirect or `throw response.error()` |
| `CONFLICT` | 409 | Duplicate constraint violation |
| `BUSINESS_ERROR` | 422 | Domain logic check |
| `INTERNAL_ERROR` | 500 | Catch-all for unexpected errors |

## Error Class Definition

```typescript
// src/lib/error.ts

export type ErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'CONFLICT'
  | 'BUSINESS_ERROR'
  | 'INTERNAL_ERROR'

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

// Pre-built error factory functions
export const errors = {
  notFound: (resource: string, id?: string) =>
    new DomainError(
      'NOT_FOUND',
      `${resource}${id ? ` '${id}'` : ''} not found`,
      404
    ),
  
  validation: (message: string, details?: unknown) =>
    new DomainError('VALIDATION_ERROR', message, 400, details),
  
  permissionDenied: (action: string) =>
    new DomainError(
      'PERMISSION_DENIED',
      `Permission denied: ${action}`,
      403
    ),
  
  conflict: (resource: string, identifier?: string) =>
    new DomainError(
      'CONFLICT',
      `${resource}${identifier ? ` '${identifier}'` : ''} already exists`,
      409
    ),
  
  business: (message: string, details?: unknown) =>
    new DomainError('BUSINESS_ERROR', message, 422, details),
  
  internal: (message = 'An unexpected error occurred') =>
    new DomainError('INTERNAL_ERROR', message, 500),
} as const
```

## Usage Examples

### NOT_FOUND

```typescript
export const getPost = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const post = await postRepository.findById(data.id)
    
    if (!post) {
      throw errors.notFound('Post', data.id)
    }
    
    return response.success(post)
  })
```

### VALIDATION_ERROR

```typescript
// Zod handles automatically — thrown when inputValidator fails
export const createPost = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    // If we reach here, validation passed
    // But we can add additional validation
    if (data.title.length < 5) {
      throw errors.validation('Title must be at least 5 characters')
    }
    return response.success(await postRepository.create(data))
  })
```

### PERMISSION_DENIED

```typescript
export const updatePost = createServerFn({ method: 'PUT' })
  .inputValidator(UpdatePostSchema)
  .handler(async ({ data, context }) => {
    const post = await postRepository.findById(data.id)
    
    if (!post) {
      throw errors.notFound('Post', data.id)
    }
    
    // Check ownership
    if (post.authorId !== context.session.userId) {
      throw errors.permissionDenied('edit this post')
    }
    
    return response.success(await postRepository.update(data))
  })
```

### CONFLICT

```typescript
export const createPost = createServerFn({ method: 'POST' })
  .inputValidator(CreatePostSchema)
  .handler(async ({ data }) => {
    // Check for duplicate title
    const existing = await postRepository.findByTitle(data.title)
    
    if (existing) {
      throw errors.conflict('Post', `with title "${data.title}"`)
    }
    
    return response.success(await postRepository.create(data))
  })
```

### BUSINESS_ERROR

```typescript
export const publishPost = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const post = await postRepository.findById(data.id)
    
    if (!post) {
      throw errors.notFound('Post', data.id)
    }
    
    if (post.published) {
      throw errors.business('Post is already published')
    }
    
    // Check if post has minimum content
    if (post.content.length < 100) {
      throw errors.business(
        'Post must have at least 100 characters to publish',
        { currentLength: post.content.length }
      )
    }
    
    return response.success(await postRepository.publish(data.id))
  })
```

### INTERNAL_ERROR

```typescript
export const complexOperation = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      await doComplexThing()
    } catch (error) {
      // Log the actual error
      console.error('Complex operation failed:', error)
      // Throw generic internal error
      throw errors.internal('Operation could not be completed')
    }
  })
```

## Error Response Helper

```typescript
// src/lib/response.ts

import { errors } from './error'

export const response = {
  success: <T>(data: T, meta?: PaginationMeta) => ({
    success: true as const,
    data,
    error: null,
    ...(meta && { meta }),
  }),
  
  error: (
    code: ErrorCode,
    message: string,
    details?: unknown
  ) => {
    // For server functions throwing DomainError
    if (code === 'NOT_FOUND') return errors.notFound(message)
    if (code === 'VALIDATION_ERROR') return errors.validation(message, details)
    if (code === 'PERMISSION_DENIED') return errors.permissionDenied(message)
    if (code === 'CONFLICT') return errors.conflict(message)
    if (code === 'BUSINESS_ERROR') return errors.business(message, details)
    return errors.internal(message)
  },
}
```

## Client-Side Error Handling

```typescript
import { getPost } from '../server/functions/posts.functions'

try {
  const result = await getPost({ data: { id: '123' })
  
  if (!result.success) {
    const { code, message, details } = result.error
    
    switch (code) {
      case 'NOT_FOUND':
        showNotification('Post not found', 'info')
        router.navigate({ to: '/posts' })
        break
      
      case 'VALIDATION_ERROR':
        showValidationErrors(details)
        break
      
      case 'PERMISSION_DENIED':
        showNotification('You cannot edit this post', 'warning')
        break
      
      case 'CONFLICT':
        showNotification(message, 'warning')
        break
      
      case 'BUSINESS_ERROR':
        showNotification(message, 'info')
        break
      
      case 'INTERNAL_ERROR':
        showNotification('Something went wrong. Please try again.', 'error')
        break
    }
  }
} catch (error) {
  // Network error or serialization error
  showNotification('Network error. Please check your connection.', 'error')
}
```

## Context7 Sources

- TanStack Start Error Handling: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- TanStack Start notFound: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions#throw-not-found-errors-in-server-functions
