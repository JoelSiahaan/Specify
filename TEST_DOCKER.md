# Test Docker Setup

## Prerequisites
1. Docker Desktop sudah terinstall
2. Docker Desktop sudah running (icon hijau di system tray)

## Test Steps

### 1. Validasi Konfigurasi
```bash
docker-compose config
```
✅ Harus tidak ada error

### 2. Start Services
```bash
docker-compose up -d
```
✅ Harus download images dan start 3 containers

### 3. Cek Status (tunggu 30 detik)
```bash
docker-compose ps
```
✅ Semua services harus "Up" dan postgres "healthy"

### 4. Cek Logs
```bash
# Backend logs
docker-compose logs backend

# Frontend logs  
docker-compose logs frontend

# Postgres logs
docker-compose logs postgres
```
✅ Tidak ada error critical

### 5. Test Health Endpoint
```bash
curl http://localhost:3000/health
```
✅ Harus return JSON dengan status "healthy"

### 6. Test Frontend
Buka browser: http://localhost:5173
✅ Harus tampil halaman React

### 7. Run Migrations
```bash
docker-compose exec backend npx prisma migrate dev --name init
```
✅ Migration berhasil

### 8. Test Hot Reload Backend
```bash
# Edit file backend/src/main.ts (tambah comment)
# Lihat logs
docker-compose logs -f backend
```
✅ Server restart otomatis

### 9. Test Hot Reload Frontend
```bash
# Edit file frontend/src/App.tsx (tambah comment)
# Lihat logs
docker-compose logs -f frontend
```
✅ HMR update otomatis

### 10. Cleanup
```bash
docker-compose down
```
✅ Semua containers stop

## Troubleshooting

**Port sudah dipakai:**
```bash
# Ganti port di .env
BACKEND_PORT=3001
FRONTEND_PORT=5174
DB_PORT=5433
```

**Container tidak start:**
```bash
# Lihat error
docker-compose logs [service-name]

# Rebuild
docker-compose up -d --build
```

**Database connection error:**
```bash
# Restart postgres
docker-compose restart postgres

# Tunggu 10 detik
sleep 10
```
