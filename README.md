# DevsHub

DevsHub is a T3 Stack application with a shadcn/ui construction page, Neon Postgres, and private AWS S3 image uploads.

## Stack

- Next.js App Router, React, and TypeScript
- tRPC and TanStack Query
- Drizzle ORM with Neon Serverless Postgres over HTTP
- Tailwind CSS v4 and shadcn/ui (`base-nova`)
- AWS SDK v3 with short-lived presigned S3 uploads
- T3 Env validation, ESLint, and Prettier

## Setup

1. Install dependencies with `pnpm install`.
2. Copy the values from `.env.example` into `.env` and replace every placeholder.
3. Use the pooled Neon connection string from the Neon dashboard for `DATABASE_URL`.
4. Create a private S3 bucket and configure its CORS policy to allow `PUT` from your application origins.
5. Give the configured IAM principal least-privilege access to `s3:PutObject` for `arn:aws:s3:::YOUR_BUCKET/images/*`.
6. Push the starter schema with `pnpm db:push`.
7. Start the app with `pnpm dev`.

The `storage.createImageUpload` tRPC mutation returns a five-minute presigned URL. Upload the image bytes directly to that URL with the same `Content-Type` submitted to the mutation. Supported formats are AVIF, JPEG, PNG, and WebP.

## Commands

| Command             | Purpose                           |
| ------------------- | --------------------------------- |
| `pnpm dev`          | Start the development server      |
| `pnpm build`        | Create a production build         |
| `pnpm check`        | Run linting and TypeScript checks |
| `pnpm format:write` | Format the project                |
| `pnpm db:generate`  | Generate a Drizzle migration      |
| `pnpm db:migrate`   | Apply generated migrations        |
| `pnpm db:studio`    | Open Drizzle Studio               |

Do not expose AWS credentials or the Neon connection string to client components. For production on AWS, prefer an IAM role over long-lived access keys.

## Design system

The app uses shadcn/ui semantic tokens with dark mode enabled by default. Visit `/design-system` for the live foundations, components, and patterns reference. Design decisions are documented in `design-system/devshub/MASTER.md`.

UI work must prioritize existing or registry-provided shadcn components. Build a custom component only when shadcn has no suitable option, and compose it from shadcn primitives whenever possible.


@ahmad9059
