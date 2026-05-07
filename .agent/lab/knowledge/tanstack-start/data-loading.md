# TanStack Start — Data Loading

TanStack Start provides multiple data loading patterns that integrate with TanStack Query for caching and synchronization.

## Loader Pattern

Loaders fetch data before component renders. They run on server (SSR) or client depending on SSR mode:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    return await fetchPost(params.postId)
  },
  component: PostPage,
})

function PostPage() {
  // Full typed inference from loader return
  const { post } = Route.useLoaderData()
  
  return <article>{post.title}</article>
}
```

## beforeLoad Hook

`beforeLoad` runs before the loader — perfect for auth checks and context injection:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUserFn } from '../server/auth'

export const Route = createFileRoute('/_authed/dashboard')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()
    
    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    
    // Returned context is passed to loader and component
    return { user }
  },
  loader: async ({ context }) => {
    // Can access context from beforeLoad
    return await fetchDashboardData(context.user.id)
  },
  component: DashboardComponent,
})

function DashboardComponent() {
  // Access user from route context
  const { user } = Route.useRouteContext()
  
  // Access loader data
  const { data } = Route.useLoaderData()
  
  return <div>Welcome {user.email}</div>
}
```

## ensureQueryData — Cache Pre-warming

Use `context.queryClient.ensureQueryData()` in loaders to prefetch into TanStack Query cache:

```tsx
import { queryOptions } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    staleTime: 5 * 60 * 1000,
  })

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ context, params }) => {
    // Prefetch into cache — client won't refetch
    await context.queryClient.ensureQueryData(
      postQueryOptions(params.postId)
    )
  },
  component: PostPage,
})

function PostPage() {
  const { postId } = Route.useParams()
  
  // Uses cached data from loader — no refetch!
  const { data } = useSuspenseQuery(postQueryOptions(postId))
  
  return <article>{data.title}</article>
}
```

## SSR Modes

Configure per-route how server/client rendering works:

```tsx
// Full SSR — server runs loader AND renders component
export const Route = createFileRoute('/posts')({
  ssr: true, // default
  component: PostList,
})

// Data-only SSR — server runs loader, client renders
export const Route = createFileRoute('/posts/$postId')({
  ssr: 'data-only',
  beforeLoad: () => {
    console.log('Server: auth check')
  },
  loader: () => {
    console.log('Server: fetch data')
  },
  component: () => <div>Client renders this</div>,
})

// Client-only — no SSR, SPA mode
export const Route = createFileRoute('/dashboard')({
  ssr: false,
  component: DashboardPage,
})

// Functional SSR — dynamic based on params/search
export const Route = createFileRoute('/posts/$postId')({
  ssr: ({ params, search }) => {
    if (params.preview === 'true') return 'data-only'
    if (search.noSSR) return false
    return true
  },
  component: PostPage,
})
```

### SSR Mode Reference

| Mode | `beforeLoad` | `loader` | Component Render |
|------|--------------|----------|------------------|
| `true` | Server → Client | Server → Client | Server → Client |
| `'data-only'` | Server → Client | Server → Client | Client only |
| `false` | Client only | Client only | Client only |

## TanStack Query Integration

### useSuspenseQuery with Loader Prefetch

```tsx
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

const postQueryOptions = (postId: string) => ({
  queryKey: ['post', postId],
  structuralSharing: false, // Required for RSC values
  queryFn: () => getPost({ data: { postId } }),
  staleTime: 5 * 60 * 1000,
})

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      postQueryOptions(params.postId)
    )
  },
  component: PostPage,
})

function PostPage() {
  const { postId } = Route.useParams()
  
  // Uses pre-filled cache from loader
  const { data } = useSuspenseQuery(postQueryOptions(postId))
  
  return <article>{data.title}</article>
}
```

### Query Invalidation after Mutations

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreatePostForm() {
  const queryClient = useQueryClient()
  
  const createMutation = useMutation({
    mutationFn: async (data) => createPost({ data }),
    onSuccess: () => {
      // Invalidate posts list to refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
  
  return (
    <form onSubmit={() => createMutation.mutate({ title: 'New' })}>
      <button disabled={createMutation.isPending}>Create</button>
    </form>
  )
}
```

## Context7 Sources

- TanStack Start SSR: https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr
- TanStack Start Loaders: https://tanstack.com/start/latest/docs/framework/react/comparison
- TanStack Query SSR: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
