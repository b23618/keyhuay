# 🗄️ Database Setup Guide for Keyhuay

This guide explains how to set up PostgreSQL database for the Keyhuay lottery system.

## Prerequisites

- PostgreSQL 12+ installed
- Node.js 18+
- npm or yarn

## 📋 Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This installs Prisma and @prisma/client packages.

### 2. Create PostgreSQL Database

#### Option A: Local PostgreSQL

```bash
# Create database
createdb keyhuay

# Or using psql
psql -U postgres
CREATE DATABASE keyhuay;
```

#### Option B: Docker PostgreSQL

```bash
docker run --name keyhuay-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=keyhuay \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Configure Environment Variables

Create `.env.local` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/keyhuay"
```

Replace:
- `user` - PostgreSQL username (default: postgres)
- `password` - PostgreSQL password
- `localhost:5432` - PostgreSQL host and port
- `keyhuay` - Database name

### 4. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init
```

### 5. Verify Database

```bash
# Open Prisma Studio to view database
npx prisma studio
```

## 📊 Database Schema

### LotteryEntry Table
- `id` - Unique identifier (CUID)
- `number` - 4-digit lottery number (unique)
- `type` - Lottery type ('thai' or 'hanoi')
- `date` - Date and time string
- `timestamp` - Unix timestamp
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

### LotteryAnalysis Table
- `id` - Unique identifier (CUID)
- `number` - 4-digit lottery number (unique)
- `count` - Frequency count
- `percentage` - Percentage of total
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

## 🚀 Railway Deployment

### 1. Add PostgreSQL Add-on

In Railway Dashboard:
1. Go to your project
2. Click "Add Service"
3. Select "PostgreSQL"
4. Railway auto-creates DATABASE_URL

### 2. Deploy Application

```bash
git push origin main
```

Railway auto-deploys and uses the PostgreSQL connection.

### 3. Run Migrations on Railway

```bash
# Via Railway CLI
railway run npx prisma migrate deploy

# Or manually in Railway shell
npx prisma migrate deploy
```

## 🔧 API Endpoints

### GET /api/lottery
Fetch all lottery entries

**Response:**
```json
[
  {
    "id": "cuid123",
    "number": "0561",
    "type": "thai",
    "date": "26/03/2569 16:30:45",
    "timestamp": 1711430445000,
    "createdAt": "2026-03-26T16:30:45.000Z",
    "updatedAt": "2026-03-26T16:30:45.000Z"
  }
]
```

### POST /api/lottery
Create new lottery entry

**Request:**
```json
{
  "number": "0561",
  "type": "thai",
  "date": "26/03/2569 16:30:45",
  "timestamp": 1711430445000
}
```

**Response:** (201 Created)
```json
{
  "id": "cuid123",
  "number": "0561",
  "type": "thai",
  "date": "26/03/2569 16:30:45",
  "timestamp": 1711430445000,
  "createdAt": "2026-03-26T16:30:45.000Z",
  "updatedAt": "2026-03-26T16:30:45.000Z"
}
```

### DELETE /api/lottery/[id]
Delete lottery entry

**Response:** (200 OK)
```json
{
  "id": "cuid123",
  "number": "0561",
  "type": "thai",
  "date": "26/03/2569 16:30:45",
  "timestamp": 1711430445000,
  "createdAt": "2026-03-26T16:30:45.000Z",
  "updatedAt": "2026-03-26T16:30:45.000Z"
}
```

## 🛠️ Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name <migration_name>

# Deploy migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Format schema
npx prisma format
```

## 🐛 Troubleshooting

### Connection Error
```
Error: P1000 Can't reach database server
```

**Solution:**
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Check firewall/network settings

### Migration Error
```
Error: P3014 Prisma Migrate could not create the shadow database
```

**Solution:**
```bash
# Drop and recreate database
dropdb keyhuay
createdb keyhuay

# Run migrations again
npx prisma migrate dev --name init
```

### Unique Constraint Error
```
Error: Unique constraint failed on the fields: (`number`)
```

**Solution:**
- The lottery number already exists
- Delete the duplicate entry first

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Railway Documentation](https://docs.railway.app/)
