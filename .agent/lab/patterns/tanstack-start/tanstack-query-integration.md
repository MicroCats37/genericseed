# TanStack Start — TanStack Query Integration

How our 5 generic hooks integrate with TanStack Start server functions.

## Overview

Server functions work seamlessly as `mutationFn` for TanStack Query mutations. The `router.invalidate()` from TanStack Start triggers refetching.

## Pattern: Loader + ensureQueryData + useSuspenseQuery

### Step 1: Define query options

```tsx
// src/hooks/queries/post.queries.ts
import { queryOptions } from '@tanstack/react-query'
import { getPost, getPosts } from '../../server/functions/posts.functions'

export const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ['post', postId],
    queryFn: () => getPost({ data: { id: postId } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

export const postsListQueryOptions = queryOptions({
  queryKey: ['posts'],
  queryFn: () => getPosts(),
  staleTime: 60 * 1000, // 1 minute
})
```

### Step 2: Prefetch in loader with ensureQueryData

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { postQueryOptions } from '../hooks/queries/post.queries'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ context, params }) => {
    // Prefetch into cache — client won't refetch
    await context.queryClient.ensureQueryData(
      postQueryOptions(params.postId)
    )
  },
  component: PostPage,
})
```

### Step 3: Consume with useSuspenseQuery

```tsx
// src/routes/posts/$postId.tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { postQueryOptions } from '../hooks/queries/post.queries'

function PostPage() {
  const { postId } = Route.useParams()
  
  // Uses pre-filled cache from loader — no refetch!
  const { data: postResponse } = useSuspenseQuery(postQueryOptions(postId))
  
  // Unwrap from response envelope
  const post = postResponse.success ? postResponse.data : null
  
  if (!post) {
    return <div>Post not found</div>
  }
  
  return <article>{post.title}</article>
}
```

## Pattern: Server Function as mutationFn

### useGenericCreateMutation

```tsx
// src/hooks/useGenericCreateMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateServerFn } from '../types'

export function useGenericCreateMutation<TData, TInput>({
  mutationFn,
  queryKey,
}: {
  mutationFn: CreateServerFn<TData, TInput>
  queryKey: string[]
}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input) => {
      const result = await mutationFn({ data: input })
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Create failed')
      }
      
      return result.data
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
```

### Usage with createPost

```tsx
import { useGenericCreateMutation } from '../hooks/useGenericCreateMutation'
import { createPost } from '../server/functions/posts.functions'

function CreatePostForm() {
  const createMutation = useGenericCreateMutation({
    mutationFn: createPost,
    queryKey: ['posts'],
  })
  
  const handleSubmit = (data) => {
    createMutation.mutate(data, {
      onSuccess: (post) => {
        console.log('Created:', post.id)
        router.navigate({ to: '/posts/$postId', params: { postId: post.id } })
      },
      onError: (error) => {
        showNotification(error.message, 'error')
      },
    })
  }
  
  return (
    <form onSubmit={() => handleSubmit(formData)}>
      {/* form fields */}
      <button disabled={createMutation.isPending}>Create Post</button>
    </form>
  )
}
```

## Pattern: useGenericUpdateMutation

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useGenericUpdateMutation<TData, TInput>({
  mutationFn,
  queryKey,
}: {
  mutationFn: (data: TInput) => Promise<{ success: boolean; data: TData; error: null }>
  queryKey: string[]
}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: TInput) => {
      const result = await mutationFn(input)
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Update failed')
      }
      
      return result.data
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey)
      
      // Optimistically update
      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        ...newData,
      }))
      
      return { previousData }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
```

## Pattern: useGenericDeleteMutation

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useGenericDeleteMutation({
  mutationFn,
  queryKey,
}: {
  mutationFn: (id: string) => Promise<{ success: boolean; data: null; error: null }>
  queryKey: string[]
}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await mutationFn(id)
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Delete failed')
      }
      
      return result.data
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData(queryKey, (old) =>
        old.filter((item) => item.id !== deletedId)
      )
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
```

## Pattern: Optimistic Updates

Use `onMutate` to update cache immediately, rollback on error:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useOptimisticUpdate<TData>({
  mutationFn,
  queryKey,
  updateFn, // (oldData, newData) => newData
}: {
  mutationFn: (data: Partial<TData>) => Promise<any>
  queryKey: string[]
  updateFn: (old: TData, new: Partial<TData>) => TData
}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData(queryKey)
      
      queryClient.setQueryData(queryKey, (old) =>
        updateFn(old, newData)
      )
      
      return { previousData }
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(queryKey, context?.previousData)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
```

## Pattern: useGenericCacheSync

Sync server function responses with TanStack Query cache:

```tsx
import { useQueryClient } from '@tanstack/react-query'

export function useGenericCacheSync() {
  const queryClient = useQueryClient()
  
  return {
    // Sync a single item after create/update
    syncItem: <TData>(queryKey: string[], data: TData, id: string) => {
      queryClient.setQueryData(queryKey, (old: TData[]) => {
        const idx = old.findIndex((item) => (item as any).id === id)
        if (idx >= 0) {
          const updated = [...old]
          updated[idx] = data
          return updated
        }
        return [...old, data]
      })
    },
    
    // Invalidate and refetch
    invalidate: (queryKey: string[]) => {
      queryClient.invalidateQueries({ queryKey })
    },
    
    // Remove item after delete
    removeItem: <TData>(queryKey: string[], id: string) => {
      queryClient.setQueryData(queryKey, (old: TData[]) =>
        old.filter((item) => (item as any).id !== id)
      )
    },
  }
}
```

## Complete Example: CRUD with All Hooks

```tsx
// PostsList.tsx
function PostsList() {
  const { data: postsResponse } = useSuspenseQuery(postsListQueryOptions)
  const posts = postsResponse.success ? postsResponse.data : []
  
  return (
    <div>
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  )
}

// PostItem.tsx
function PostItem({ post }) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  
  const updateMutation = useMutation({
    mutationFn: (data) => updatePost({ data: { id: post.id, ...data } }),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previousPosts = queryClient.getQueryData(['posts'])
      
      queryClient.setQueryData(['posts'], (old) =>
        old.map((p) => p.id === post.id ? { ...p, ...newData } : p)
      )
      
      return { previousPosts }
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['posts'], context?.previousPosts)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setIsEditing(false)
    },
  })
  
  const deleteMutation = useMutation({
    mutationFn: () => deletePost({ data: { id: post.id } }),
    onSuccess: () => {
      queryClient.setQueryData(['posts'], (old) =>
        old.filter((p) => p.id !== post.id)
      )
    },
  })
  
  return (
    <div>
      <h3>{post.title}</h3>
      {isEditing ? (
        <button onClick={() => updateMutation.mutate({ title: 'Updated' })}>
          Save
        </button>
      ) : (
        <button onClick={() => setIsEditing(true)}>Edit</button>
      )}
      <button onClick={() => deleteMutation.mutate()}>Delete</button>
    </div>
  )
}
```

## Context7 Sources

- TanStack Query SSR: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
- TanStack Query Optimistic Updates: https://tanstack.com/query/latest/docs/framework/react/examples/optimistic-updates-ui
- TanStack Start Query Integration: https://tanstack.com/start/latest/docs/framework/react/comparison
