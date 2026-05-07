# TanStack Start — Response Format

Response envelope specification for all server functions. This MIRRORS our Django and Next.js response envelopes.

## Response Envelope Structure

### Success Response

```typescript
interface ApiSuccessResponse<T> {
  success: true
  data: T
  error: null
  meta?: PaginationMeta
}

interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}
```

### Error Response

```typescript
interface ApiErrorResponse {
  success: false
  data: null
  error: {
    code: ErrorCode
    message: string
    details?: unknown
  }
}
```

## Error Codes

All server functions use these standardized error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `PERMISSION_DENIED` | 403 | User lacks permission |
| `CONFLICT` | 409 | Resource conflict |
| `BUSINESS_ERROR` | 422 | Business logic violation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Response Helper Functions

```typescript
// src/lib/response.ts

import type { PaginationMeta } from './types'

export function successResponse<T>(
  data: T,
  meta?: PaginationMeta
): { success: true; data: T; error: null; meta?: PaginationMeta } {
  return {
    success: true,
    data,
    error: null,
    ...(meta && { meta }),
  }
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): { success: false; data: null; error: { code: ErrorCode; message: string; details?: unknown } } {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  }
}

// Type for use in server function returns
export type ApiResponse<T> =
  | ReturnType<typeof successResponse<T>>
  | ReturnType<typeof errorResponse>
```

## Usage in Server Functions

```typescript
// src/server/functions/posts.functions.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { PostRepository } from '../../infrastructure/persistence/prisma/post.repository'
import { response } from '../../lib/response'

const ListPostsSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(20),
  publishedOnly: z.boolean().default(true),
})

export const listPosts = createServerFn({ method: 'GET' })
  .inputValidator(ListPostsSchema)
  .handler(async ({ data }) => {
    const repository = new PostRepository()
    
    const [posts, total] = await Promise.all([
      repository.findMany({
        where: data.publishedOnly ? { published: true } : undefined,
        skip: (data.page - 1) * data.perPage,
        take: data.perPage,
      }),
      repository.count({
        where: data.publishedOnly ? { published: true } : undefined,
      }),
    ])
    
    return response.success(posts, {
      page: data.page,
      perPage: data.perPage,
      total,
      totalPages: Math.ceil(total / data.perPage),
    })
  })

export const getPost = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const repository = new PostRepository()
    const post = await repository.findById(data.id)
    
    if (!post) {
      throw response.error('NOT_FOUND', `Post ${data.id} not found`)
    }
    
    return response.success(post)
  })

export const createPost = createServerFn({ method: 'POST' })
  .inputValidator(CreatePostSchema)
  .handler(async ({ data }) => {
    try {
      const repository = new PostRepository()
      const post = await repository.create(data)
      return response.success(post)
    } catch (error) {
      if (error.code === 'CONFLICT') {
        throw response.error('CONFLICT', `Post with title "${data.title}" already exists`)
      }
      console.error('Create post failed:', error)
      throw response.error('INTERNAL_ERROR', 'Failed to create post')
    }
  })
```

## Client-Side Handling

```typescript
// Client component
import { listPosts } from '../server/functions/posts.functions'

async function loadPosts() {
  const result = await listPosts({ data: { page: 1, perPage: 20 } })
  
  if (!result.success) {
    // Handle error
    switch (result.error.code) {
      case 'NOT_FOUND':
        showNotification('No posts found', 'info')
        break
      case 'PERMISSION_DENIED':
        router.navigate({ to: '/login' })
        break
      default:
        showNotification(result.error.message, 'error')
    }
    return { posts: [], meta: null }
  }
  
  // Success
  return { posts: result.data, meta: result.meta }
}
```

## With TanStack Query

```typescript
// hooks/queries/post.queries.ts
import { queryOptions } from '@tanstack/react-query'
import { listPosts } from '../../server/functions/posts.functions'

export const postsListQueryOptions = (params: { page: number; perPage: number }) =>
  queryOptions({
    queryKey: ['posts', 'list', params],
    queryFn: async () => {
      const result = await listPosts({ data: params })
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load posts')
      }
      
      return result
    },
  })

// Component
function PostsList() {
  const [page, setPage] = useState(1)
  
  const { data } = useSuspenseQuery(postsListQueryOptions({ page, perPage: 20 }))
  
  // data is typed: { success: true, data: Post[], error: null, meta: PaginationMeta }
  const posts = data.data
  const meta = data.meta
  
  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}
```

## Context7 Sources

- TanStack Start Server Functions: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- TanStack Start Execution Model: https://tanstack.com/start/latest/docs/framework/react/guide/execution-model
