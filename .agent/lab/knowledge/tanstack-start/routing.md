# TanStack Start — File-Based Routing

TanStack Router uses filesystem-based routing that maps directly to URL paths with full type inference.

## File Conventions

```
src/routes/
├── __root.tsx              # Root layout — always matched, renders HTML shell
├── index.tsx               # Maps to "/" (exact match)
├── about.tsx               # Maps to "/about"
├── posts/
│   ├── index.tsx           # Maps to "/posts"
│   ├── $postId.tsx         # Maps to "/posts/:postId" (dynamic segment)
│   └── $postId.edit.tsx    # Maps to "/posts/:postId/edit"
├── _pathlessLayout/        # Layout wraps routes WITHOUT adding to URL
│   ├── route-a.tsx
│   └── route-b.tsx
└── files/
    └── $.tsx               # Catch-all route (wildcard/splat)
```

### Naming Patterns

| Pattern | File | URL | Notes |
|---------|------|-----|-------|
| Root | `__root.tsx` | `/` | Always matched, HTML shell |
| Index | `index.tsx` | `/` or `/posts` | Exact path match |
| Dynamic | `$postId.tsx` | `/posts/:postId` | Becomes `params.postId` |
| Layout | `_posts.tsx` | `/posts` | Wraps nested routes via `<Outlet>` |
| Pathless | `_authLayout.tsx` | (none) | Layout without URL segment |
| Catch-all | `$.tsx` | `/*` | Wildcard, `_splat` param |

## Type-Safe Navigation

### Link Component with `from` Prop

The `from` prop is **critical** for type safety and performance. Without it, TypeScript must resolve search params against ALL routes.

```tsx
// ✅ CORRECT — narrowed type check, fast
<Link
  from="/posts/$postId"
  to=".."
  search={{ page: 1 }}
>
  Back
</Link>

// ❌ WRONG — checks against ALL routes, slow type inference
<Link
  to=".."
  search={{ page: 1 }}
>
  Back
</Link>
```

```tsx
// Full navigation example
<Link
  from={Route.fullPath}
  to="/posts/$postId"
  params={{ postId: post.id }}
  search={{ page: 1, sort: 'newest' }}
>
  View Post
</Link>
```

### useNavigate

```tsx
import { useNavigate } from '@tanstack/react-router'

function PostList() {
  const navigate = useNavigate({ from: '/posts' })

  // Type-safe navigation
  await navigate({
    to: '/posts/$postId',
    params: { postId: '123' },
    search: { page: 1 },
    replace: true,
  })
}
```

### Route Params

```tsx
// posts.$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  component: PostPage,
})

function PostPage() {
  // Full type inference — { postId: string }
  const { postId } = Route.useParams()
  
  return <div>Post ID: {postId}</div>
}
```

### Search Params with Zod Validation

```tsx
const searchSchema = z.object({
  page: z.number().default(1),
  filter: z.string().default(''),
  sort: z.enum(['newest', 'oldest', 'price']).default('newest'),
})

export const Route = createFileRoute('/shop/products')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page, sort: search.sort }),
  loader: async ({ deps }) => fetchProducts(deps),
})

function ProductList() {
  // Fully typed with inferred defaults
  const { page, filter, sort } = Route.useSearch()
  
  // Type-safe navigation with search
  const navigate = useNavigate({ from: '/shop/products' })
  await navigate({ search: { page: 2, filter: 'tech', sort: 'price' } })
}
```

## Nested Layouts with `<Outlet>`

Parent routes share layouts via the `<Outlet>` component:

```tsx
// posts.tsx — Parent route
export const Route = createFileRoute('/posts')({
  component: PostsLayout,
})

function PostsLayout() {
  return (
    <div class="flex">
      <PostsSidebar />
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  )
}
```

### Layout Files

A file named `_layout.tsx` creates a layout without adding to URL:

```
src/routes/
├── _authLayout.tsx          # Layout for /dashboard, /settings, etc.
│   ├── dashboard.tsx         # /dashboard
│   └── settings.tsx          # /settings
└── _publicLayout.tsx         # Layout for /login, /register
    ├── login.tsx             # /login
    └── register.tsx         # /register
```

## Redirect Pattern

```tsx
import { redirect } from '@tanstack/react-router'

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

## Context7 Sources

- TanStack Start: https://tanstack.com/start/latest/docs/framework/react/guide/routing
- TanStack Router Link: https://tanstack.com/router/latest/docs/api/router/retainSearchParamsFunction
