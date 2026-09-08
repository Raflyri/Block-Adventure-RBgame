# RBlock Adventure 🎮

[![Cloudflare Pages](https://img.shields.io/badge/Deployment-Cloudflare%20Pages-f38020?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com/)
[![HTML5 Canvas](https://img.shields.io/badge/Render-HTML5%20Canvas-e34f26?style=for-the-badge&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Vanilla JavaScript](https://img.shields.io/badge/Language-Vanilla%20JS%20(ES6+)-f7df1e?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/Styles-CSS3%20Responsive-1572b6?style=for-the-badge&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License: Proprietary](https://img.shields.io/badge/Copyright-RBeverything-6b21a8?style=for-the-badge)](https://rbeverything.com)

**RBlock Adventure** adalah game puzzle susun balok arcade modern, ceria (*child-friendly*), dan berkinerja tinggi yang dibangun murni menggunakan **HTML5 Canvas, Vanilla JavaScript (ES6+), dan CSS3** tanpa dependensi eksternal. Game ini dioptimalkan khusus untuk *zero-config deployment* di **Cloudflare Pages** serta siap dihubungkan ke **Cloudflare Workers + KV**.

---

## ✨ Fitur Utama Terbaru (v2.0.0)

- 📲 **PWA (Progressive Web App) & 100% Offline Mode**:
  - Dapat diinstal langsung ke perangkat Android, iOS, Windows, atau macOS layaknya aplikasi *native* via tombol **📲 Install App**.
  - Didukung `sw.js` (Service Worker) dan `manifest.webmanifest` untuk akses super cepat dan permainan lancar tanpa kuota internet (*offline ready*).

- 🎨 **Sistem 4 Pilihan Tema & Skin Balok**:
  - 🍬 **Candy Jelly (Default)**: Balok jelly mengkilap warna-warni ceria dengan bayangan lembut.
  - ⚡ **Cyber Neon**: Pendaran neon glow futuristik dengan kontras tinggi gaya synthwave.
  - 🍃 **Kawaii Pastel**: Warna-warna pastel menenangkan (*soothing & cozy*).
  - 🕹️ **Retro 8-Bit**: Palet hijau monokrom khas GameBoy 90-an dengan shading bevel piksel arcade.

- 🎮 **Tiga Mode Permainan Menantang**:
  - **🎮 Klasik Arcade**: Mode ketangkasan bertahan hidup tak terbatas dengan peningkatan level dan balok *Candy Bomb*.
  - **📅 Daily Challenge (Tantangan Harian)**: Teka-teki harian berbasis *PRNG seed* tanggal dunia (`YYYY-MM-DD`). Seluruh pemain di dunia mendapatkan tantangan dan urutan balok yang sama persis! Lengkap dengan pelacak *Daily Streak*.
  - **🧩 Puzzle Stages (10 Level Teka-Teki)**: 10 stage tantangan unik bertahap dengan antrian balok terbatas untuk melatih strategi.

- 🏆 **Multi-Mode Global Online Leaderboard (Cloudflare Pages Functions + Cloudflare KV)**:
  - Rekor skor tersimpan persisten di database edge serverless **Cloudflare KV (`LEADERBOARD_KV`)**.
  - Tab terpisah untuk **🏆 Rekor Klasik** dan **📅 Juara Harian (Daily)**.
  - Indikator status koneksi real-time: `🟢 Cloudflare KV Online` atau `🟡 Mode Lokal`.

- 👆 **Kontrol Sentuh Langsung di Layar (Direct Touch & Swipe Gestures)**:
  - **Geser Kiri/Kanan**: Seret atau geser jari langsung di atas arena bermain untuk menggeser balok secara presisi.
  - **Seret ke Bawah**: Tarik jari ke bawah untuk melakukan *soft drop*.
  - **Flick / Sentakan Cepat ke Bawah**: Sentak jari dengan cepat ke bawah untuk menjatuhkan balok seketika (*Super Drop*).
  - **Ketukan Ringan (*Tap*)**: Ketuk arena layar secara singkat untuk memutar (*rotate*) balok 90°.
  - **Dukungan Hibrida**: Tetap dilengkapi dengan tombol sentuh D-pad & aksi di bawah layar untuk kenyamanan bermain dengan dua jempol.

- 💣 **Candy Bomb 1×1 Spesial & Durasi Dinamis**:
  - Balok Bom ringkas berukuran **1×1** dengan sumbu menyala (*pulsing fuse*).
  - Durasi penghitung waktu mundur (*fuse timer*) yang dinamis sesuai level (8.0 detik pada Level 1 hingga 2.5 detik pada level tinggi), menciptakan tantangan yang semakin mendebarkan.
  - Meledak dengan radius 3×3, melumat balok di sekitarnya dan memberikan bonus poin ledakan (*+250 Blast Bonus!*).
  - Dilengkapi efek **getar layar (*Screen Shake*)**, lingkaran gelombang kejut (*Shockwave Ring*), dan percikan api kartun.

- 💥 **Animasi Pecahan Balok & Shattered Debris**:
  - Saat baris dibersihkan (*line clear*), balok hancur berkeping-keping menjadi pecahan partikel warna-warni (*shattered debris*) yang berhamburan dengan simulasi gravitasi dan rotasi.

- 🔊 **Efek Suara Arcade Unik & Punchy (Pure Web Audio API)**:
  - Suara dentuman ledakan bom menggelegar (*deep sub-bass noise boom*).
  - Efek suara gemerincing balok hancur (*crystalline shatter clink*).
  - Nada arpeggio kombo bertingkat yang semakin tinggi (*1x, 2x, 3x COMBO!*).
  - Melodi ceria marimba/xylophone chimes untuk gerakan, rotasi, dan pembersihan baris.

- 🍬 **Desain Ceria & Child-Friendly**:
  - Balok dirender menyerupai **permen jelly kenyal & mengkilap** (*glossy rounded candy blocks*).
  - Latar belakang gradasi ungu manis dengan animasi gelembung melayang dan bintang berkelip.
  - Tipografi bulat bersahabat menggunakan Google Font **`Fredoka`**.

- 📱 **100% Responsif & Fit-to-Screen**:
  - **No-Scroll Game Layout**: Menggunakan dynamic viewport height (`100dvh`), sehingga pas dalam satu layar tanpa scroll vertikal yang mengganggu.
  - **Dukungan Berbagai Perangkat**:
    - **Desktop ($\ge 850\text{px}$)**: Tata letak 3 kolom simetris dengan panel kontrol terorganisir.
    - **Tablet ($600\text{px} - 849\text{px}$)**: Penskalaan proporsional otomatis menggunakan CSS `clamp()`.
    - **Mobile Smartphone ($< 600\text{px}$)**: Tata letak ramah genggaman dengan gesture sentuh langsung dan tombol jempol.
  - **HiDPI Retina Ready**: Ketajaman grafis canvas otomatis menyesuaikan `devicePixelRatio` layar sehingga grafis selalu tajam dan tidak buram.

- 🕹️ **Fisika & Aturan Game**:
  - Matrix standar 10 kolom × 20 baris.
  - 7 bentuk balok khas (`I`, `J`, `L`, `O`, `S`, `T`, `Z`) ditambah balok spesial **Candy Bomb**.
  - Rotasi 90 derajat dengan deteksi benturan dinding (*wall-kick*) agar balok tidak macet di tepi arena.
  - Proyeksi bayangan balok (*ghost piece*) untuk melihat titik jatuh sebelum mendarat.
  - Fitur simpan balok cadangan (*Pocket / Hold*).

---

## 🎮 Cara Bermain & Kontrol

### Kontrol Sentuh & Gestur Layar (Smartphone / Tablet)

| Gestur / Tombol | Aksi |
| :--- | :--- |
| **Geser Layar Kiri / Kanan** | Memindahkan balok ke samping |
| **Tarik Layar ke Bawah** | *Soft Drop* (Jatuh perlahan) |
| **Flick Cepat ke Bawah** | *Super Drop!* (Jatuh instan ke dasar) |
| **Ketuk Arena Layar (Tap)** | Putar / Rotasi balok 90° |
| **Tombol D-Pad (◀ / ▼ / ▶)** | Navigasi balok alternatif |
| **Tombol `🔄 SPIN`** | Memutar balok |
| **Tombol `🎒 POCKET`** | Menyimpan / Menukar balok cadangan (*Hold*) |
| **Tombol `⚡ DROP!`** | Menjatuhkan balok langsung ke dasar |

### Kontrol Keyboard (Desktop / Laptop)

| Tombol | Aksi |
| :--- | :--- |
| **`←`** / **`A`** | Geser Balok ke Kiri |
| **`→`** / **`D`** | Geser Balok ke Kanan |
| **`↑`** / **`W`** | Putar / Rotasi Balok 90° |
| **`↓`** / **`S`** | *Soft Drop* (Jatuh pelan / bonus skor) |
| **`Spacebar`** | *Super Drop!* (Jatuh instan ke dasar) |
| **`C`** / **`Shift`** | Masukkan / Tukar Balok ke *Pocket (Hold)* |
| **`P`** / **`Escape`** | *Pause* / *Resume* Permainan |
| **`M`** | Nyalakan / Matikan Suara (*Mute*) |

---

## 🏆 Sistem Skor, Kombo & Level

- **Skor Pembersihan Baris**:
  - 1 Garis (*Single*): **100 Poin**
  - 2 Garis (*Double*): **300 Poin**
  - 3 Garis (*Triple*): **500 Poin**
  - 4 Garis (*Mega RBlock!*): **800 Poin** (disertai animasi perayaan bintang)
- **Bonus Kombo Beruntun**:
  - Mendapat tambahan bonus poin berlipat saat membersihkan baris secara berturut-turut (*2x COMBO! 🔥*, *3x COMBO! ⚡*).
- **Bonus Ledakan Candy Bomb**:
  - **+250 Poin dasar** + **40 Poin** untuk setiap petak balok yang hancur dalam radius ledakan 3×3.
- **Bonus Drop**:
  - *Soft Drop*: +1 poin per petak jatuh.
  - *Hard Drop*: +2 poin per petak jatuh.
- **Sistem Level Dinamis**:
  - Kecepatan jatuh balok otomatis meningkat setiap **1.000 poin**.
  - Penghitung waktu mundur bom semakin menantang seiring bertambahnya level.

---

## 🚀 Menjalankan Secara Lokal

Karena game ini dibangun tanpa dependensi maupun proses *build* (*pure static files*), Anda dapat menjalankannya dengan mudah:

### Opsi 1: Menggunakan Python
```powershell
python -m http.server 3000
```
Buka browser di: **`http://localhost:3000`**

### Opsi 2: Menggunakan Node.js / npx
```powershell
npx serve .
# atau
npx http-server -p 3000
```

### Opsi 3: Menggunakan Cloudflare Wrangler
Untuk menguji simulasi lingkungan lokal Cloudflare Pages:
```powershell
npx wrangler pages dev .
```

---

## 🌐 Panduan Deployment ke Cloudflare Pages

Game ini siap di-deploy secara instan (*Zero-Config*):

1. **Melalui Git Repository (GitHub / GitLab)**:
   - Hubungkan repositori ini di **Cloudflare Dashboard > Workers & Pages > Create application > Pages**.
   - Pilih repositori ini.
   - Kosongkan bagian **Build command**.
   - Isi **Build output directory** dengan `/` (atau biarkan *root*).
   - Klik **Save and Deploy**.

2. **Menghubungkan Database Cloudflare KV (Untuk Global Leaderboard)**:
   - Di Cloudflare Dashboard, buka **Workers & Pages > KV**.
   - Buat KV Namespace baru: `RBLOCK_LEADERBOARD`.
   - Buka proyek Pages Anda > **Settings > Functions > KV namespace bindings**.
   - Tambahkan binding:
     - **Variable name**: `LEADERBOARD_KV`
     - **KV namespace**: Pilih namespace yang sudah dibuat.
   - Panduan visual lengkap langkah demi langkah dapat dibaca di: **[CLOUDFLARE_LEADERBOARD_GUIDE.md](CLOUDFLARE_LEADERBOARD_GUIDE.md)**.
   - Klik **Save**. Rekor pemain di seluruh dunia kini tersimpan permanen!

3. **Melalui Wrangler CLI**:
   ```bash
   npx wrangler pages deploy . --project-name=rblock-adventure
   ```

---

## 📂 Struktur Berkas

```
rblock-adventure/
├── functions/
│   └── api/
│       └── leaderboard.js              # Serverless Cloudflare Pages Function (KV API)
├── icon.svg                            # Maskable Vector Icon PWA 512x512
├── manifest.webmanifest                # PWA App Manifest & Metadata
├── sw.js                               # Service Worker Cerdas (Cache-First & Offline)
├── index.html                          # UI Overlays, Fixed Modals, & Canvas
├── style.css                           # Design System 4 Tema, Responsive & Controls
├── script.js                           # Engine RBlock, Multi-Mode, Gamepad & Touch
├── CLOUDFLARE_LEADERBOARD_GUIDE.md     # Panduan Konfigurasi KV Cloudflare Lengkap
├── RELEASE_NOTES.md                    # Catatan riwayat pembaruan (Changelog) lengkap
├── .gitignore                          # Daftar berkas yang diabaikan oleh Git
└── README.md                           # Dokumentasi resmi proyek
```

---

## 📄 Hak Cipta & Lisensi

Copyright © 2026 **RBeverything**. All rights reserved.

Proyek ini dibuat dan dikembangkan di bawah naungan **RBeverything**. Penggunaan, pendistribusian, dan modifikasi kode tunduk pada ketentuan lisensi pemilik proyek.
