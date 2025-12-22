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

## Instruksi untuk klien (frontend Netlify + backend lokal + login)
- Backend wajib jalan di PC klien (butuh Chrome). Cara cepat: jalankan `scripts/install_backend.ps1` sekali di PowerShell (butuh Go terpasang) untuk build `netflix-central.exe` dan auto-start via Scheduled Task.
- Pastikan backend aktif di `http://localhost:8080` (bisa cek dengan membuka di browser: harus muncul respon JSON kosong/OK).
- Auth: pertama kali, lakukan **Register** di UI (email + password). Setelah login, token tersimpan di localStorage.
- Buka URL Netlify yang diberikan. UI memanggil backend lokal; tanpa backend, tombol tidak berfungsi.
- Tambah akun via **Add Account**. Klik kartu untuk membuka Chrome dengan profil yang sudah login.

### Cek/nyalakan ulang backend via Task Scheduler (Windows)
1. Tekan `Win + R`, ketik `taskschd.msc`, Enter.
2. Klik **Task Scheduler Library**, cari task **Netflix Central Backend**.
3. Status harus **Running**. Jika tidak, klik kanan → **Run**. Jika mau restart, klik kanan → **End**, lalu **Run** lagi.
4. Backend berjalan otomatis tiap logon setelah task terdaftar.

## Jalankan backend otomatis (Windows)
- Buka PowerShell, jalankan: `./scripts/install_backend.ps1` (butuh Go terpasang). Ini build `netflix-central.exe`, daftar sebagai Scheduled Task, dan menyalakan backend di startup.

## Deploy frontend di Netlify
- Set env: `VITE_API_BASE=http://localhost:8080` (backend tetap lokal di PC pengguna).
- Build command: `npm run build` · Publish directory: `dist`.
- Pastikan backend berjalan di PC saat membuka situs Netlify; CORS sudah terbuka.

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
