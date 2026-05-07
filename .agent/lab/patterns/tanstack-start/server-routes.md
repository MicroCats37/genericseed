# TanStack Start — Server Routes

Server Routes (`server.handlers`) provide raw HTTP endpoints for cases where server functions are insufficient.

## When to Use Server Routes vs Server Functions

| Aspect | Server Functions (`createServerFn`) | Server Routes (`server.handlers`) |
|--------|-------------------------------------|-----------------------------------|
| Pattern | RPC — call like a function | REST — HTTP verbs |
| Input | Zod validated | Manual parsing |
| Type Safety | Full inference | Manual typing |
| Response | Automatic serialization | `Response.json()` |
| Use Case | CRUD, mutations, authenticated actions | Webhooks, file downloads, custom headers |

## Basic Server Route

```tsx
// src/routes/api/hello.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Response.json({ message: 'Hello, World!' })
      },
    },
  },
})
```

## Multi-Verb Route

```tsx
// src/routes/api/items.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/items')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        
        const items = await db.items.findMany({
          skip: (page - 1) * 10,
          take: 10,
        })
        
        return Response.json({ items, page })
      },
      
      POST: async ({ request }) => {
        const body = await request.json()
        
        const item = await db.items.create(body)
        
        return Response.json({ item }, { status: 201 })
      },
    },
  },
})
```

## Webhook Handling

```tsx
// src/routes/api/webhooks/stripe.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/webhooks/stripe')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get('stripe-signature')
        
        if (!signature) {
          return Response.json({ error: 'Missing signature' }, { status: 400 })
        }
        
        const body = await request.text()
        
        try {
          const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
          )
          
          switch (event.type) {
            case 'checkout.session.completed':
              await handleCheckoutCompleted(event.data.object)
              break
            case 'payment_intent.succeeded':
              await handlePaymentSucceeded(event.data.object)
              break
            default:
              console.log(`Unhandled event type: ${event.type}`)
          }
          
          return Response.json({ received: true })
        } catch (err) {
          console.error('Webhook error:', err)
          return Response.json({ error: 'Webhook handler failed' }, { status: 400 })
        }
      },
    },
  },
})
```

## File Download

```tsx
// src/routes/api/downloads/$fileId.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/downloads/$fileId')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const file = await storage.files.find(params.fileId)
        
        if (!file) {
          return new Response('File not found', { status: 404 })
        }
        
        // Stream file from storage
        const fileStream = await storage.getFile(file.bucket, file.path)
        
        return new Response(fileStream, {
          headers: {
            'Content-Type': file.contentType,
            'Content-Disposition': `attachment; filename="${file.name}"`,
            'Content-Length': file.size.toString(),
          },
        })
      },
    },
  },
})
```

## Setting Cache Headers

```tsx
// src/routes/api/products/$productId.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/products/$productId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const product = await db.products.find(params.productId)
        
        return Response.json(
          { product },
          {
            headers: {
              'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
              'CDN-Cache-Control': 'max-age=3600',
            },
          }
        )
      },
    },
  },
})
```

## Wildcard/Splat Routes

```tsx
// src/routes/file/$.ts — Catch-all for /file/*
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/file/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { _splat } = params // e.g., "hello.txt" from /file/hello.txt
        
        return Response.json({ path: _splat })
      },
    },
  },
})
```

## Request Parsing Helpers

```tsx
// Parse JSON body
const body = await request.json()

// Parse FormData
const formData = await request.formData()
const file = formData.get('file')

// Parse URL search params
const url = new URL(request.url)
const page = url.searchParams.get('page')

// Parse headers
const authHeader = request.headers.get('Authorization')
const contentType = request.headers.get('Content-Type')
```

## Response Helpers

```tsx
// JSON response (auto-sets Content-Type)
return Response.json({ data: 'value' })

// With custom status
return Response.json({ error: 'Not found' }, { status: 404 })

// Raw response
return new Response('Hello', { status: 200 })

// With custom headers
return new Response(JSON.stringify({ data: 'value' }), {
  headers: { 'Content-Type': 'application/json' },
})
```

## Context7 Sources

- TanStack Start Server Routes: https://tanstack.com/start/latest/docs/framework/react/guide/server-routes
- TanStack Start ISR: https://tanstack.com/start/latest/docs/framework/react/guide/isr
