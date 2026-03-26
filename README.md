# 🎰 Keyhuay - ระบบคีย์หวย 4 ตัว

ระบบคีย์หวย 4 ตัว ที่สามารถ:
- กรอกเลข 4 ตัว แล้วกลับเลขได้ (เช่น 0561 = 0516, 0615, ...)
- วิเคราะห์เลขที่ออกบ่อยสุด
- บันทึกเลขที่บันทึก พร้อมวันที่และประเภทหวย (ไทย/ฮานอย)
- ส่งออกและนำเข้าข้อมูล JSON

## 🚀 เทคโนโลยี

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS
- **Storage**: Browser localStorage

## 📋 ความต้องการ

- Node.js 18+
- npm หรือ yarn

## 🛠️ การติดตั้ง

```bash
# Clone repository
git clone <repository-url>
cd keyhuay

# ติดตั้ง dependencies
npm install

# รัน development server
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

## 📦 Build สำหรับ Production

```bash
npm run build
npm start
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t keyhuay:latest .
```

### Run Docker Container

```bash
docker run -p 3000:3000 keyhuay:latest
```

## 🚂 Deploy to Railway

### วิธีการ Deploy

1. **สร้าง Railway Account**
   - ไปที่ [railway.app](https://railway.app)
   - สร้างบัญชี

2. **Connect GitHub Repository**
   - ใน Railway Dashboard คลิก "New Project"
   - เลือก "Deploy from GitHub"
   - เชื่อมต่อ GitHub account
   - เลือก repository

3. **Configure Environment**
   - Railway จะ auto-detect Next.js
   - ตั้ง PORT environment variable (ถ้าจำเป็น)

4. **Deploy**
   - Railway จะ auto-deploy เมื่อ push ไป main branch
   - ดูสถานะ deployment ใน Railway Dashboard

### Environment Variables (ถ้าจำเป็น)

```
NODE_ENV=production
PORT=3000
```

## 📝 ฟีเจอร์

### 1. กรอกเลข 4 ตัว
- กรอกเลข 4 ตัว (เช่น 0561)
- คลิก "🔄 กลับเลข" เพื่อสร้างการเรียงสับเปลี่ยน
- ดูผลลัพธ์ทั้งหมด

### 2. บันทึกเลข
- เลือกประเภทหวย (ไทย/ฮานอย)
- คลิก "💾 บันทึกเลข" เพื่อบันทึกพร้อมวันที่และเวลา
- ข้อมูลจะบันทึกอัตโนมัติใน localStorage

### 3. วิเคราะห์เลข
- ดูสถิติเลขที่บันทึก
- ดูเลขที่ออกบ่อยสุด Top 10
- ดูกราฟแสดงความถี่

### 4. ส่งออก/นำเข้า JSON
- คลิก "📥 ส่งออก JSON" เพื่อดาวน์โหลดข้อมูล
- คลิก "📤 นำเข้า JSON" เพื่ออัปโหลดข้อมูล

## 📊 โครงสร้างข้อมูล

### Lottery Entry
```typescript
{
  id: string
  number: string (4 digits)
  type: 'thai' | 'hanoi'
  date: string (Thai format)
  timestamp: number
}
```

### Export JSON
```json
{
  "exportDate": "2026-03-26T16:27:00.000Z",
  "totalEntries": 24,
  "uniqueNumbers": 6,
  "allNumbers": ["0156", "0165", ...],
  "frequency": {"0156": 4, ...},
  "analysis": {
    "topNumbers": [...],
    "statistics": {...}
  }
}
```

## 🔧 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 📄 License

MIT

## 👨‍💻 Author

Created with ❤️ for lottery analysis
