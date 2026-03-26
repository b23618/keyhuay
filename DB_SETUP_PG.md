# 🗄️ PostgreSQL Setup with pg Package

This guide explains how to set up PostgreSQL database for Keyhuay using the native `pg` package instead of Prisma.

## Prerequisites

- PostgreSQL 12+ installed
- Node.js 18+
- npm or yarn

## 📋 Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This installs the `pg` package and TypeScript types.

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

### 4. Initialize Database Tables

Run the initialization script:

```bash
# Using ts-node (if installed)
npx ts-node scripts/init-db.ts

# Or compile and run
npx tsc scripts/init-db.ts --outDir dist
node dist/scripts/init-db.js
```

Or manually create tables:

```sql
CREATE TABLE IF NOT EXISTS lottery_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(4) NOT NULL UNIQUE,
  type VARCHAR(10) NOT NULL,
  date VARCHAR(50) NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lottery_entries_type ON lottery_entries(type);
CREATE INDEX idx_lottery_entries_created_at ON lottery_entries(created_at DESC);
```

### 5. Start the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📊 Database Schema

### lottery_entries Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| number | VARCHAR(4) | 4-digit lottery number (unique) |
| type | VARCHAR(10) | Lottery type ('thai' or 'hanoi') |
| date | VARCHAR(50) | Date and time string |
| timestamp | BIGINT | Unix timestamp |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

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

### 3. Initialize Database on Railway

Option A: Via Railway CLI
```bash
railway run npx ts-node scripts/init-db.ts
```

Option B: Via Railway Shell
```bash
npx ts-node scripts/init-db.ts
```

Option C: Manually in psql
```bash
railway connect postgres
# Then run the SQL commands above
```

## 🔧 API Endpoints

### GET /api/lottery
Fetch all lottery entries

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
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
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "number": "0561",
  "type": "thai",
  "date": "26/03/2569 16:30:45",
  "timestamp": 1711430445000,
  "createdAt": "2026-03-26T16:30:45.000Z",
  "updatedAt": "2026-03-26T16:30:45.000Z"
}
```

**Error Responses:**
- 400: Missing required fields
- 409: Duplicate number

### DELETE /api/lottery/[id]
Delete lottery entry

**Response:** (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "number": "0561",
  "type": "thai",
  "date": "26/03/2569 16:30:45",
  "timestamp": 1711430445000,
  "createdAt": "2026-03-26T16:30:45.000Z",
  "updatedAt": "2026-03-26T16:30:45.000Z"
}
```

**Error Responses:**
- 404: Entry not found
- 500: Server error

## 🛠️ Database Connection

The database connection is managed in `lib/db.ts`:

```typescript
import { query } from '@/lib/db'

// Execute a query
const result = await query('SELECT * FROM lottery_entries')

// Execute with parameters
const result = await query(
  'SELECT * FROM lottery_entries WHERE number = $1',
  ['0561']
)
```

## 🐛 Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Check firewall/network settings

### Duplicate Key Error
```
Error: duplicate key value violates unique constraint "lottery_entries_number_key"
```

**Solution:**
- The lottery number already exists
- Delete the duplicate entry first

### UUID Extension Error
```
Error: function gen_random_uuid() does not exist
```

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Connection Pool Error
```
Error: too many connections
```

**Solution:**
- Increase PostgreSQL max_connections setting
- Or use connection pooling (PgBouncer)

## 📚 Resources

- [pg Package Documentation](https://node-postgres.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Railway Documentation](https://docs.railway.app/)
