# 🏆 Panduan Konfigurasi Leaderboard di Cloudflare Pages & KV

Panduan ringkas ini menjelaskan langkah-langkah untuk menghubungkan **Global Online Leaderboard** game **RBlock Adventure** ke database **Cloudflare KV**, sehingga skor pemain di seluruh dunia tersimpan secara real-time dan permanen.

---

## 📌 Sekilas Cara Kerja
- Game menggunakan **Cloudflare Pages Functions** pada endpoint `/api/leaderboard` (`functions/api/leaderboard.js`).
- Backend ini membutuhkan **KV Namespace Binding** dengan nama variabel: **`LEADERBOARD_KV`**.
- Mode yang didukung:
  1. **Rekor Klasik**: Disimpan di key `RBLOCK_TOP_SCORES`.
  2. **Juara Harian (Daily Challenge)**: Disimpan di key `RBLOCK_DAILY_YYYY-MM-DD` terpisah setiap harinya.
- *Graceful Fallback*: Jika KV belum dihubungkan, game tetap berjalan normal menggunakan database lokal browser (*offline/local storage*).

---

## 🛠️ Langkah-Langkah Konfigurasi (Hanya 3 Menit)

### Langkah 1: Buat KV Namespace di Cloudflare Dashboard
1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com/) dan login ke akun Anda.
2. Di menu navigasi samping kiri, klik **Storage & Databases** > pilih **KV**.
3. Klik tombol **Create a Namespace**.
4. Beri nama namespace, misalnya:
   ```text
   rblock-leaderboard-kv
   ```
5. Klik tombol **Add**.

---

### Langkah 2: Hubungkan (Binding) KV ke Cloudflare Pages Project
1. Di menu navigasi samping kiri, pilih **Workers & Pages**.
2. Klik pada project Pages Anda (misalnya: `tetris-web-rb` atau `rblock-adventure`).
3. Masuk ke tab **Settings** (Pengaturan).
4. Di menu pengaturan samping kiri, pilih **Functions**.
5. Gulir ke bawah ke bagian **KV namespace bindings**, lalu klik **Add binding**.
6. Masukkan konfigurasi berikut:
   - **Variable name**:
     ```text
     LEADERBOARD_KV
     ```
     *(⚠️ Wajib persis huruf besar `LEADERBOARD_KV` sesuai kode backend)*
   - **KV namespace**: Pilih namespace yang sudah Anda buat di Langkah 1 (contoh: `rblock-leaderboard-kv`).
7. Simpan pengaturan:
   - Jika ada pilihan environment, pastikan binding aktif untuk **Production** (dan **Preview** jika diinginkan).
   - Klik tombol **Save**.

---

### Langkah 3: Re-deploy / Trigger Deployment
Agar binding baru aktif pada Functions:
1. Masuk ke tab **Deployments** pada project Pages Anda.
2. Klik pada deployment terbaru (atau klik tombol **Retry deployment** / push commit baru).
3. Setelah deployment selesai (*Success*), backend `/api/leaderboard` akan otomatis tersambung ke Cloudflare KV!

---

## ✅ Cara Memverifikasi Bahwa KV Sudah Aktif
1. Buka game Anda di browser.
2. Klik tombol **🏆 Top 10** di header game (atau tekan tombol `L` di keyboard).
3. Perhatikan badge status di dalam modal:
   - **🟢 Cloudflare KV Online**: Menandakan game **sudah 100% terhubung** ke database Cloudflare KV global.
   - **🟡 Rekor Lokal**: Menandakan game sedang berjalan offline atau binding KV belum terhubung.
4. Mainkan game, lalu setelah Game Over atau menang, masukkan nama Anda dan klik **Simpan 🏅**.
5. Skor Anda akan langsung tercatat dan muncul di peringkat dunia!

---

## ❓ Mengapa di Halaman KV "Connected Bindings" Masih Kosong?
Jika Anda membuka menu **Storage & Databases > KV > rblock-leaderboard-kv > Settings**, bagian *"Connected bindings"* mungkin tidak menampilkan nama project Pages Anda. **Ini adalah hal yang normal di dashboard Cloudflare**:
1. Tombol biru **"Connect"** dan daftar *"Connected bindings"* di halaman KV tersebut dirancang khusus untuk **Cloudflare Workers** (bukan Pages).
2. Proyek **Cloudflare Pages** mengelola binding secara mandiri dari sisi Pages (**Workers & Pages > Project Anda > Settings > Functions > KV namespace bindings**).
3. Untuk mempermudah, repository ini sekarang sudah menyertakan file **`wrangler.toml`** resmi yang otomatis menghubungkan namespace ID Anda (`34ef57b3352d4c33be32011129153f20`) langsung saat proses deployment.

