# DishWisher

DishWisher is a multi-user dish sharing app where people can:

- create accounts and log in
- post dishes with photos
- rate dishes
- browse and filter all community dishes

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Prisma
- SQLite (local development default)
- Optional S3 image uploads via presigned URLs

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env` and adjust values as needed:

```bash
cp .env.example .env
```

By default, local development uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

### 3) Initialize database

```bash
npm run db:push
```

### 4) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploying with Postgres + S3

### Postgres

For production, set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
```

Then generate/push using the Postgres schema:

```bash
npm run db:push:postgres
```

This command also regenerates Prisma Client for Postgres.

For local SQLite development, continue using:

```bash
npm run db:push
```

### S3 uploads (optional but recommended)

Set these env vars:

```env
S3_REGION="us-west-2"
S3_BUCKET="your-bucket-name"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_PUBLIC_BASE_URL="https://cdn.yourdomain.com" # optional
```

If S3 is not configured, image uploads fall back to local base64 storage.

Upload behavior in app:

- user-selected images are automatically resized/compressed client-side
- final upload payload is capped at 5MB
- uploaded objects are stored with aggressive cache headers:
  `Cache-Control: public, max-age=31536000, immutable`

### S3 CORS

Your bucket needs browser PUT support for presigned uploads. Example CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["https://your-app-domain.com", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint
- `npm run db:push` - sync Prisma schema to database
- `npm run db:generate` - regenerate Prisma client
- `npm run db:push:postgres` - sync Postgres schema + generate client
- `npm run db:generate:postgres` - generate Prisma client from Postgres schema
