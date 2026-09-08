# 🏆 Panduan Konfigurasi Leaderboard dengan Cloudflare D1 Database

Panduan lengkap ini menjelaskan langkah-langkah untuk menghubungkan **Global Online Leaderboard** game **RBlock Adventure** ke database SQL serverless **Cloudflare D1**, persis seperti yang biasa Anda gunakan pada game lainnya.

---

## 🌟 Mengapa Cloudflare D1 Jauh Lebih Mudah & Nyaman?
1. **Berbasis SQL Relasional**: Data tersimpan rapi dalam tabel `leaderboard` dengan kolom `name`, `score`, `mode`, `date`.
2. **Tidak Perlu Bingung KV Pairs**: Tidak ada key-value JSON manual; semua query ranking dan filter harian diurus langsung via query SQL (`SELECT ... ORDER BY score DESC LIMIT 10`).
3. **Bisa Dilihat & Diedit Langsung di Dashboard**: Anda bisa membuka Cloudflare Dashboard > D1 > Console untuk melihat tabel rekor, menjalankan query SQL, atau mereset skor kapan saja.
4. **Self-Healing & Auto-Setup**: Kode backend otomatis mengeksekusi `CREATE TABLE IF NOT EXISTS` dan menyuntikkan skor awal saat pertama kali dijalankan, jadi tidak akan pernah error meskipun tabel belum dibuat manual.

---

## 🛠️ Langkah-Langkah Konfigurasi (Hanya 2-3 Menit)

### Langkah 1: Buat Database D1 di Cloudflare Dashboard
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) dan login ke akun Anda.
2. Di menu sidebar kiri, buka **Storage & Databases** > pilih **D1 SQL Database**.
3. Klik tombol **Create database**.
4. Beri nama database, misalnya:
   ```text
   rblock-leaderboard
   ```
5. Klik **Create**. Selesai!

---

### Langkah 2 (Opsional): Jalankan Schema SQL
> 💡 *Catatan: Backend game kami sudah memiliki fitur **Self-Healing**, yaitu membuat tabel secara otomatis jika belum ada. Namun jika Anda ingin mengeksekusinya secara manual di konsol D1, ikuti langkah ini:*

1. Klik database yang baru Anda buat (`rblock-leaderboard`).
2. Masuk ke tab **Console**.
3. Salin dan tempel SQL berikut (tersedia juga di file `schema.sql` proyek):
   ```sql
   CREATE TABLE IF NOT EXISTS leaderboard (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     score INTEGER NOT NULL,
     mode TEXT NOT NULL DEFAULT 'classic',
     date TEXT NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX IF NOT EXISTS idx_leaderboard_mode_score ON leaderboard(mode, score DESC);
   ```
4. Klik tombol **Execute**.

---

### Langkah 3: Hubungkan (Binding) D1 ke Cloudflare Pages Project
1. Di menu sidebar kiri, pilih **Workers & Pages**.
2. Klik project Cloudflare Pages game Anda (misal: `tetris-web-rb` atau nama project Pages Anda).
3. Masuk ke tab **Settings** (Pengaturan).
4. Di bilah menu samping Settings, pilih **Bindings** (atau pada beberapa tampilan: **Functions**).
5. Gulir ke bagian **D1 database bindings**, lalu klik **Add binding** (atau *Add*).
6. Masukkan konfigurasi berikut:
   - **Variable name**:
     ```text
     DB
     ```
     *(💡 Catatan: Backend kami juga fleksibel mendukung nama `LEADERBOARD_DB` atau `D1_DATABASE`)*
   - **D1 database**: Pilih database yang dibuat pada Langkah 1 (contoh: `rblock-leaderboard`).
7. Pastikan berlaku untuk environment **Production** (dan Preview bila diinginkan), lalu klik **Save** / **Save and deploy**.

---

### Langkah 4: Re-deploy / Deploy Ulang
Setiap kali Anda menambahkan binding baru di Cloudflare Pages, deployment baru diperlukan agar Cloudflare Pages Function membaca database tersebut:
1. Buka tab **Deployments** di project Pages Anda.
2. Pada deployment paling atas (terbaru), klik tombol titik tiga `...` lalu pilih **Retry deployment** (atau cukup tunggu commit baru ini selesai di-build otomatis).
3. Setelah statusnya **Success**, game Anda kini 100% terhubung ke Cloudflare D1!

---

## ✅ Cara Verifikasi Bahwa D1 Sudah Berhasil Terhubung
1. Buka situs game Anda di browser.
2. Klik tombol **🏆 Top 10** di bagian atas (atau tekan `L` di keyboard).
3. Perhatikan badge status di dalam popup modal:
   - **🟢 Cloudflare D1 Online**: Menandakan game **100% terhubung ke Cloudflare D1**.
   - **🟡 Rekor Lokal**: Menandakan game berjalan dalam mode offline / fallback lokal.
4. Mainkan game, capai skor, lalu klik **Simpan 🏅**.
5. Buka tab D1 Console di Cloudflare Dashboard dan jalankan:
   ```sql
   SELECT * FROM leaderboard ORDER BY score DESC;
   ```
   Skor Anda akan langsung tampil di database! 🚀
