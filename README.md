# Sistem Laundry WA Gateway

Aplikasi manajemen laundry dengan notifikasi WhatsApp otomatis menggunakan Baileys.

## 🏗️ Arsitektur

**Monorepo** - Frontend dan Backend dalam satu project:
- **Frontend**: React + Vite (Port 5173)
- **Backend**: Hono + Baileys (Port 3000)
- **Database**: Supabase PostgreSQL

## 🚀 Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide React (Icons)
- Supabase Client

### Backend
- Hono (Lightweight Web Framework)
- @hono/node-server
- @whiskeysockets/baileys (WhatsApp API)
- Supabase

## 📦 Fitur

### Paket Laundry
1. **Kilat** - 3 Jam
2. **Express** - 24 Jam
3. **Reguler** - 3 Hari

### Status Otomatis
Progress bar otomatis menampilkan status berdasarkan waktu:
- **< 50%**: Mencuci 💧
- **50-90%**: Menyetrika 👔
- **≥ 90%**: Packing 📦 (Merah)

### Notifikasi WhatsApp
Ketika order selesai, sistem otomatis mengirim pesan WhatsApp ke customer.

## 🔧 Cara Menjalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup WhatsApp (Pertama Kali)
Jalankan backend terpisah untuk scan QR code WhatsApp:

```bash
npm run backend
```

Scan QR code yang muncul di terminal menggunakan WhatsApp di HP Anda:
- Buka WhatsApp di HP
- Tap Menu (⋮) > Linked Devices
- Tap "Link a Device"
- Scan QR code di terminal

Setelah tersambung, session akan tersimpan di folder `auth_info`.

### 3. Jalankan Aplikasi
Setelah WhatsApp tersambung, jalankan aplikasi lengkap (frontend + backend):

```bash
npm run dev
```

Aplikasi akan berjalan di:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## 📁 Struktur Project

```
project/
├── backend/
│   └── index.js          # Hono server + Baileys integration
├── src/
│   ├── App.jsx           # Main application
│   └── hooks/
│       └── useSafeStorage.js   # LocalStorage hook
├── auth_info/            # WhatsApp session (auto-generated)
├── package.json
└── README.md
```

## 🎯 Cara Penggunaan

1. **Buat Order Baru**
   - Klik tombol "Order Baru"
   - Isi nama customer dan nomor WhatsApp (format: 628xxx)
   - Pilih paket (Kilat/Express/Reguler)
   - Klik "Buat Order"

2. **Monitor Progress**
   - Order akan muncul di dashboard dengan progress bar
   - Status otomatis berubah sesuai waktu
   - Timer countdown menampilkan sisa waktu

3. **Selesaikan Order**
   - Klik tombol "Selesai" pada order card
   - Sistem akan:
     - Update status di database menjadi COMPLETED
     - Kirim notifikasi WhatsApp ke customer
     - Menghapus order dari dashboard

## 🔌 API Endpoints

### GET /api/status
Cek status koneksi WhatsApp
```json
{
  "connected": true,
  "message": "WhatsApp is connected"
}
```

### POST /api/send
Kirim pesan WhatsApp
```json
{
  "phone": "628123456789",
  "message": "Halo, laundry Anda sudah selesai!"
}
```

## 📝 Database Schema

Tabel `orders`:
- `id` - UUID (Primary Key)
- `customer_name` - Nama customer
- `phone_number` - Nomor WA (format: 628xxx)
- `package_type` - kilat | express | reguler
- `start_time` - Waktu mulai order
- `duration_minutes` - Durasi paket (menit)
- `status` - IN_PROGRESS | COMPLETED
- `created_at` - Timestamp

## 🛠️ Scripts

- `npm run dev` - Jalankan frontend + backend bersamaan
- `npm run frontend` - Jalankan frontend saja
- `npm run backend` - Jalankan backend saja
- `npm run build` - Build production
- `npm run preview` - Preview production build

## ⚠️ Catatan Penting

1. **WhatsApp Session**: File session WhatsApp disimpan di folder `auth_info` dan sudah masuk `.gitignore`
2. **Port Conflict**: Pastikan port 3000 dan 5173 tidak digunakan aplikasi lain
3. **Format Nomor WA**: Harus format internasional tanpa + (contoh: 628123456789)
4. **Internet Connection**: Diperlukan koneksi internet stabil untuk WhatsApp
5. **Database**: Menggunakan Supabase - pastikan credentials di `.env` valid

## 🐛 Troubleshooting

### WhatsApp tidak tersambung
- Jalankan ulang `npm run backend`
- Scan ulang QR code
- Hapus folder `auth_info` dan scan ulang

### Order tidak muncul
- Refresh browser
- Cek koneksi Supabase di console browser
- Pastikan `.env` berisi credentials yang benar

### Pesan WA tidak terkirim
- Cek status koneksi: http://localhost:3000/api/status
- Pastikan nomor WA format benar (628xxx)
- Cek console backend untuk error

## 📄 License

MIT
