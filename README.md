# Netflix Central (Lokal)

Aplikasi desktop lokal untuk mengelola akun Netflix berbasis profil Chrome. Tidak ada data dikirim ke cloud. Semua sesi login tersimpan di folder profil Chrome lokal.

## Prasyarat
- Windows + Google Chrome terpasang (browser utama).
- Go terpasang (untuk menjalankan backend API).
- Node.js + npm terpasang (untuk menjalankan frontend React + Vite).
- Git (opsional, hanya jika mau commit/push kode).

## Cara menjalankan (2 terminal)
1) Backend
```
cd D:\Cinnong's\APK\Netflix_Central
go run main.go
```
2) Frontend
```
cd D:\Cinnong's\APK\Netflix_Central\frontend
npm install
npm run dev
```
Lalu buka alamat yang ditampilkan (biasanya http://localhost:5173).

## Cara pakai singkat
- **Add Account** → isi label + email (harus unik) → profil Chrome dibuat otomatis.
- Klik kartu (dikelompokkan per huruf email) untuk buka Chrome dengan sesi tersimpan.
- Ikon ✏️ untuk edit, 🗑️ untuk hapus; toggle light/dark ada di header.
- Abaikan "Sign in to Chrome"; login ke Netflix sekali, lalu sesi tersimpan.

## Lokasi data
- Database SQLite: `database/app.db`
- Profil Chrome per akun: `chrome_profiles/<nama-profil>` (otomatis dibuat). Jangan hapus jika ingin sesi tetap ada.

## Troubleshooting
- **Chrome minta login sync**: pilih "Don't sign in". Yang penting login Netflix/Gmail di tab, bukan sync Chrome.
- **Sesi hilang**: profil terhapus/berpindah atau logout oleh layanan. Buka akun lagi, login manual sekali, sesi akan tersimpan ulang.
- **Chrome tidak terbuka**: pastikan Chrome terpasang. Path dicari otomatis di Program Files/LocalAppData; jika berbeda, instal Chrome atau sesuaikan layanan peluncur.
- **File profil terkunci saat git**: folder `chrome_profiles/` sudah di-ignore. Pastikan Chrome ditutup saat commit bila perlu.

## Keamanan & batasan
- Tidak menyimpan password di app. Login hanya di Chrome.
- Tidak ada cloud/remote access. Semua lokal di PC.
- Tidak memakai auto-login, scraping, atau headless browser.
