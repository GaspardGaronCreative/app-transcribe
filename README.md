# app-transcribe

A modern video download and transcription platform built with Next.js 15, PostgreSQL, MinIO, and Cobalt.

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [Docker Compose](https://docs.docker.com/compose/) (included with Docker Desktop)

### Start the Application

```bash
# Clone and navigate to the project
cd app-transcribe

# Copy environment file
cp .env.example .env.local

# Start all services (development mode with hot reload)
docker compose up

# Or start in background
docker compose up -d
```

### Access the Services

| Service           | URL                          | Description              |
| ----------------- | ---------------------------- | ------------------------ |
| **Next.js App**   | http://localhost:3000        | Main application         |
| **Health Check**  | http://localhost:3000/api/health | Service status API   |
| **MinIO Console** | http://localhost:9003        | Storage management UI    |
| **Cobalt API**    | http://localhost:9000        | Video download service   |
| **PostgreSQL**    | localhost:5432               | Database (use DB client) |

### MinIO Console Login

- **Username**: `minioadmin`
- **Password**: `minio_secret_change_me`

## 📁 Project Structure

```
app-transcribe/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── download/      # Video download endpoint
│   │   ├── health/        # Health check endpoint
│   │   └── videos/        # Video management endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── video-downloader.tsx  # Download form
│   └── video-list.tsx     # Video gallery
├── lib/
│   ├── db.ts              # Prisma database client
│   ├── storage.ts         # MinIO/S3 storage utilities
│   ├── cobalt.ts          # Cobalt API client
│   └── utils.ts           # shadcn/ui utilities
├── prisma/
│   └── schema.prisma      # Database schema
├── docker-compose.yml     # Production setup
├── docker-compose.override.yml  # Dev overrides
├── Dockerfile             # Production build
└── Dockerfile.dev         # Development build
```

## 🎬 Supported Platforms

The app supports downloading videos from:

- **YouTube** - Videos, Shorts
- **TikTok** - Videos
- **Instagram** - Reels, Posts
- **LinkedIn** - Video posts
- **Twitter/X** - Videos, GIFs
- **Vimeo** - Videos

## 🔧 Renaming the Application

To rename the app from `app-transcribe` to your desired name:

1. **Update `.env.local`**:
   ```env
   APP_NAME=your-new-app-name
   NEXT_PUBLIC_APP_NAME=your-new-app-name
   POSTGRES_DB=your_new_db_name
   ```

2. **Update `package.json`**:
   ```json
   {
     "name": "your-new-app-name"
   }
   ```

3. **Restart containers to apply changes**:
   ```bash
   docker compose down -v  # Remove old volumes if needed
   docker compose up
   ```

## 📦 Common Commands

```bash
# Start services (development)
docker compose up

# Start services (production)
docker compose -f docker-compose.yml up

# Stop services
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v

# Rebuild containers after code changes
docker compose up --build

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f minio
docker compose logs -f cobalt

# Run database migrations
docker compose exec app npx prisma migrate dev

# Open Prisma Studio (database GUI)
docker compose exec app npx prisma studio
```

## 🗄️ Database Management

### Run Migrations

```bash
# Create a new migration
docker compose exec app npx prisma migrate dev --name your_migration_name

# Apply migrations in production
docker compose exec app npx prisma migrate deploy
```

### Prisma Studio

```bash
# Launch database GUI
docker compose exec app npx prisma studio
```

## 📤 Storage (MinIO/S3)

The application uses MinIO for S3-compatible object storage. In production, you can easily switch to:

- **AWS S3**
- **Cloudflare R2**
- **DigitalOcean Spaces**
- **Any S3-compatible storage**

Just update the environment variables:

```env
S3_ENDPOINT=https://your-s3-endpoint.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=your-region
```

## 🎥 Video Downloader (Cobalt)

The app uses [Cobalt](https://github.com/imputnet/cobalt) for downloading videos. Cobalt is:

- **Privacy-focused** - No tracking or ads
- **Self-hosted** - Runs in your Docker environment
- **High quality** - Supports up to 8K resolution
- **Fast** - Efficient streaming and processing

## 🚢 Production Deployment

### Docker (Standalone)

```bash
# Build and run production containers
docker compose -f docker-compose.yml up -d --build
```

### Cloud Deployment

The Docker setup is compatible with:

- **Railway** - Import repo, it auto-detects Docker
- **Render** - Use the Docker deployment option
- **DigitalOcean App Platform** - Deploy from Dockerfile
- **AWS ECS** - Push images to ECR
- **Google Cloud Run** - Deploy container image

### Environment Variables for Production

Make sure to set secure passwords:

```env
POSTGRES_PASSWORD=generate-a-strong-password
MINIO_ROOT_PASSWORD=generate-a-strong-password
```

## 📝 API Reference

### Health Check

```bash
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "latency": 5
    },
    "storage": {
      "status": "connected"
    },
    "cobalt": {
      "status": "connected"
    }
  },
  "app": {
    "name": "app-transcribe",
    "environment": "development"
  }
}
```

### Download Video

```bash
POST /api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "videoQuality": "1080"
}
```

### List Videos

```bash
GET /api/videos
```

### Delete Video

```bash
DELETE /api/videos?id=video_id
```

## 🐛 Troubleshooting

### Containers won't start

```bash
# Check Docker is running
docker info

# Check logs for errors
docker compose logs

# Rebuild from scratch
docker compose down -v
docker compose up --build
```

### Database connection issues

```bash
# Verify PostgreSQL is healthy
docker compose ps

# Check PostgreSQL logs
docker compose logs postgres
```

### MinIO bucket not created

The `minio-setup` container automatically creates the bucket. If it fails:

```bash
# Manually create bucket via MinIO Console
# Go to http://localhost:9003 and create "videos" bucket
```

### Cobalt download fails

```bash
# Check Cobalt logs
docker compose logs cobalt

# Verify Cobalt is responding
curl http://localhost:9000/
```

## 📄 License

MIT
