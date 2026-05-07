# TanStack Start — Folder Structure

DDD/Hexagonal architecture requirements for TanStack Start projects.

## Required Structure

```
src/
├── routes/                          # TanStack Router file-based routing
│   ├── __root.tsx                  # Root layout — HTML shell
│   ├── _authed.tsx                 # Protected layout (auth check)
│   ├── index.tsx                   # Home page "/"
│   ├── login.tsx                   # Login page "/login"
│   ├── posts/
│   │   ├── index.tsx              # Posts list "/posts"
│   │   └── $postId.tsx             # Post detail "/posts/:postId"
│   └── api/                        # Server routes (webhooks, etc.)
│       └── webhooks/
│           └── stripe.ts            # Stripe webhook handler
│
├── server/                         # Server-only backend (application layer)
│   ├── db.server.ts               # Prisma client singleton
│   ├── session.server.ts          # Session management
│   ├── middleware/                # Middleware functions
│   │   └── auth.middleware.ts    # Auth middleware
│   └── functions/                 # createServerFn definitions
│       ├── posts.functions.ts     # Post CRUD server functions
│       └── users.functions.ts     # User server functions
│
├── domain/                        # Domain layer (DDD) — NO framework imports
│   ├── posts/
│   │   ├── domain.ts              # Post entity, value objects
│   │   ├── service.ts            # Post business logic
│   │   └── repository.ts        # Repository interface (NOT implementation)
│   └── users/
│       ├── domain.ts             # User entity, value objects
│       ├── service.ts           # User business logic
│       └── repository.ts        # Repository interface
│
├── application/                   # Application layer (use cases)
│   ├── posts/
│   │   └── use-cases.ts         # Post CRUD use cases
│   └── users/
│       └── use-cases.ts         # User use cases
│
├── infrastructure/               # Infrastructure layer
│   ├── persistence/            # Database implementations
│   │   └── prisma/
│   │       ├── post.repository.ts   # Prisma implementation
│   │       └── user.repository.ts   # Prisma implementation
│   └── external/               # External service adapters
│       └── stripe.adapter.ts   # Stripe integration
│
├── components/                   # Shared UI components
│   ├── ui/                      # shadcn components
│   │   ├── button.tsx
│   │   └── input.tsx
│   └── posts/                   # Post-specific components
│       ├── post-card.tsx
│       └── post-form.tsx
│
├── hooks/                        # Custom hooks
│   ├── queries/                 # TanStack Query hooks
│   │   ├── post.queries.ts
│   │   └── user.queries.ts
│   └── mutations/               # Mutation hooks
│       └── post.mutations.ts
│
└── lib/                         # Utilities
    ├── response.ts              # Response envelope
    ├── error.ts               # DomainError class
    └── utils.ts               # General utilities
```

## Layer Responsibilities

### Domain Layer (`src/domain/`)

**PURPOSE:** Pure business logic with NO framework imports.

```typescript
// src/domain/posts/domain.ts
import { z } from 'zod' // Zod is OK here (framework-agnostic validation)

// Entity — pure TypeScript class
export class Post {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly content: string,
    public readonly authorId: string,
    public readonly createdAt: Date,
    public readonly published: boolean,
  ) {}
  
  // Business logic
  publish(): Post {
    if (this.published) {
      throw new Error('Post is already published')
    }
    return new Post(
      this.id,
      this.title,
      this.content,
      this.authorId,
      new Date(),
      true,
    )
  }
}

// Value object
export class PostId {
  constructor(public readonly value: string) {
    if (!value || value.length === 0) {
      throw new Error('PostId cannot be empty')
    }
  }
}

// Factory function
export function createPost(params: {
  title: string
  content: string
  authorId: string
}): Post {
  return new Post(
    crypto.randomUUID(),
    params.title,
    params.content,
    params.authorId,
    new Date(),
    false,
  )
}
```

### Server Functions (`src/server/`) — Application Layer

**PURPOSE:** Orchestrate use cases, call domain services, return response envelopes.

```typescript
// src/server/functions/posts.functions.ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { PostRepository } from '../../infrastructure/persistence/prisma/post.repository'
import { DomainError, errors } from '../../lib/error'
import { response } from '../../lib/response'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
})

export const createPost = createServerFn({ method: 'POST' })
  .inputValidator(CreatePostSchema)
  .handler(async ({ data }) => {
    try {
      // Call domain service or repository
      const repository = new PostRepository()
      const post = await repository.create(data)
      
      // Return response envelope
      return response.success(post)
    } catch (error) {
      if (error instanceof DomainError) {
        throw error
      }
      console.error('Create post failed:', error)
      throw errors.internal()
    }
  })
```

### Infrastructure (`src/infrastructure/`)

**PURPOSE:** Implement repository interfaces with actual database calls.

```typescript
// src/infrastructure/persistence/prisma/post.repository.ts
import { db } from '../../../server/db.server'
import { Post } from '../../../domain/posts/domain'
import type { PostRepositoryInterface } from '../../../domain/posts/repository'

export class PostRepository implements PostRepositoryInterface {
  async create(data: { title: string; content: string; authorId: string }): Promise<Post> {
    const prismaPost = await db.post.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: data.authorId,
      },
    })
    
    return new Post(
      prismaPost.id,
      prismaPost.title,
      prismaPost.content,
      prismaPost.authorId,
      prismaPost.createdAt,
      prismaPost.published,
    )
  }
}
```

## Forbidden Rules

### ❌ FORBIDDEN: Business Logic in Routes

Routes must ONLY define routing, loaders, and components. All business logic goes to domain:

```typescript
// ❌ WRONG — business logic in route
export const Route = createFileRoute('/posts')({
  loader: async () => {
    // Business logic here!
    const posts = await db.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    })
    
    // Validation logic!
    if (posts.length > 100) {
      throw new Error('Too many posts')
    }
    
    return posts
  },
})

// ✅ CORRECT — route just calls server function
export const Route = createFileRoute('/posts')({
  loader: async () => {
    return await getPosts({ data: { publishedOnly: true } })
  },
})
```

### ❌ FORBIDDEN: Database Calls in Domain

Domain entities must NOT import Prisma or call database:

```typescript
// ❌ WRONG — domain imports Prisma
import { PrismaClient } from '@prisma/client'

export class PostRepository {
  async findAll() {
    const db = new PrismaClient() // ❌ NO!
    return await db.post.findMany()
  }
}

// ✅ CORRECT — domain defines interface only
export interface PostRepositoryInterface {
  findAll(): Promise<Post[]>
  findById(id: string): Promise<Post | null>
}
```

### ❌ FORBIDDEN: Prisma/Supabase in Server Functions Directly

```typescript
// ❌ WRONG
export const getPosts = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await db.post.findMany() // ❌ Direct DB call
  })

// ✅ CORRECT — call domain service
export const getPosts = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await postService.findAllPublished()
  })
```

### ❌ FORBIDDEN: Framework Imports in Domain

```typescript
// ❌ WRONG — domain imports TanStack Start
import { createServerFn } from '@tanstack/react-start'

// ❌ WRONG — domain imports React
import * as React from 'react'

// ✅ CORRECT — pure TypeScript
export class PostService {
  async validateOwnership(post: Post, userId: string): Promise<boolean> {
    return post.authorId === userId
  }
}
```

## Context7 Sources

- TanStack Start: https://tanstack.com/start
