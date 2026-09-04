# WebTetris Edge 🎮

[![Cloudflare Pages](https://img.shields.io/badge/Deployment-Cloudflare%20Pages-f38020?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com/)
[![HTML5 Canvas](https://img.shields.io/badge/Render-HTML5%20Canvas-e34f26?style=for-the-badge&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Vanilla JavaScript](https://img.shields.io/badge/Language-Vanilla%20JS%20(ES6+)-f7df1e?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/Styles-CSS3%20Responsive-1572b6?style=for-the-badge&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License: Proprietary](https://img.shields.io/badge/Copyright-RBeverything-6b21a8?style=for-the-badge)](https://rbeverything.com)

**WebTetris Edge** adalah game Tetris modern, ceria (*child-friendly*), dan berkinerja tinggi yang dibangun murni menggunakan **HTML5 Canvas, Vanilla JavaScript (ES6+), dan CSS3** tanpa dependensi eksternal. Game ini dioptimalkan khusus untuk *zero-config deployment* di **Cloudflare Pages** serta siap dihubungkan ke **Cloudflare Workers + KV**.

---

## ✨ Fitur Utama Terbaru

- 💣 **Balok Bom Spesial (Candy Bomb & Explosions)**:
  - Balok Bom 2×2 khusus dengan sumbu menyala (*pulsing animated fuse*) yang sesekali muncul (~12% chance).
  - Saat mendarat, bom akan **meledak dengan radius 3×3**, membersihkan tumpukan balok di sekitarnya dan memberikan bonus poin ledakan (*+250 Blast Bonus!*).
  - Dilengkapi efek **getar layar (*Screen Shake*)**, lingkaran gelombang kejut (*Shockwave Ring*), serta percikan api kartun.

- 💥 **Animasi Pecahan Balok & Shattered Debris**:
  - Saat baris dibersihkan (*line clear*), balok hancur berkeping-keping menjadi pecahan partikel warna-warni (*shattered debris*) yang berhamburan dengan gravitasi.

- 🔊 **Efek Suara Arcade Unik & Punchy (Pure Web Audio API)**:
  - Suara dentuman ledakan bom menggelegar (*deep sub-bass noise boom*).
  - Efek suara gemerincing balok hancur (*crystalline shatter clink*).
  - Nada arpeggio kombo bertingkat yang semakin tinggi (*1x, 2x, 3x COMBO!*).
  - Melodi ceria marimba/xylophone chimes untuk gerakan, rotasi, dan *line clear*.

- 🍬 **Desain Ceria & Child-Friendly**:
  - Blok dirender menyerupai **permen jelly kenyal & mengkilap** (*glossy rounded candy blocks*).
  - Latar belakang gradasi ungu manis dengan animasi gelembung melayang dan bintang berkelip.
  - Tipografi bulat bersahabat menggunakan Google Font **`Fredoka`**.

- 📱 **100% Responsif & Fit-to-Screen**:
  - **No-Scroll Game Layout**: Menggunakan dynamic viewport height (`100dvh`), sehingga pas dalam satu layar tanpa scroll vertikal yang mengganggu.
  - **Dukungan Berbagai Perangkat**:
    - **Desktop ($\ge 850\text{px}$)**: Tata letak 3 kolom simetris.
    - **Tablet ($600\text{px} - 849\text{px}$)**: Penskalaan proporsional otomatis menggunakan CSS `clamp()`.
    - **Mobile Smartphone ($< 600\text{px}$)**: Tata letak bergaya konsol genggam (*Nintendo Switch / Game Boy*) dengan D-Pad navigasi jempol kiri dan tombol aksi jempol kanan.
  - **HiDPI Retina Ready**: Ketajaman grafis canvas otomatis menyesuaikan `devicePixelRatio` layar sehingga grafis selalu tajam dan tidak buram.

- 🕹️ **Fisika & Aturan Game Standar**:
  - Matrix standar 10 kolom × 20 baris.
  - 7 bentuk Tetromino klasik (`I`, `J`, `L`, `O`, `S`, `T`, `Z`) dengan generator acak 7-Bag.
  - Rotasi 90 derajat dengan deteksi benturan dinding (*wall-kick*) agar balok tidak macet di tepi arena.
  - Proyeksi bayangan balok (*ghost piece*) untuk melihat titik jatuh sebelum mendarat.
  - Fitur simpan balok cadangan (*Pocket / Hold*).

- ☁️ **Cloudflare Workers & KV Ready**:
  - Fungsi asynchronous `submitHighscore(playerName, score)` siap pakai yang melakukan `POST` ke endpoint `/api/leaderboard` untuk integrasi database Cloudflare Workers + KV.

---

## 🎮 Cara Bermain & Kontrol

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

### Kontrol Sentuh (Smartphone / Tablet)
- **Tangan Kiri (D-Pad)**: Tombol panah **`◀`**, **`▼`**, dan **`▶`** untuk mengarahkan balok.
- **Tangan Kanan (Aksi)**:
  - **`🔄 SPIN`**: Memutar balok.
  - **`🎒 POCKET`**: Menyimpan balok ke kantong *Hold*.
  - **`⚡ DROP!`**: Menjatuhkan balok langsung ke dasar (*Super Drop*).

---

## 🏆 Sistem Skor, Kombo & Level

- **Skor Garis**:
  - 1 Garis (*Single*): **100 Poin**
  - 2 Garis (*Double*): **300 Poin**
  - 3 Garis (*Triple*): **500 Poin**
  - 4 Garis (*Tetris!*): **800 Poin** (disertai pesta kembang api bintang)
- **Bonus Kombo Beruntun**:
  - Mendapat tambahan bonus poin berlipat saat membersihkan baris secara berturut-turut (*2x COMBO! 🔥*, *3x COMBO! ⚡*).
- **Bonus Ledakan Candy Bomb**:
  - **+250 Poin dasar** + **40 Poin** untuk setiap balok yang hancur dalam radius ledakan 3×3.
- **Bonus Drop**:
  - *Soft Drop*: +1 poin per petak jatuh.
  - *Hard Drop*: +2 poin per petak jatuh.
- **Sistem Level Dinamis**:
  - Kecepatan jatuh balok otomatis meningkat setiap **1.000 poin**.
  - Baris indikator level menampilkan progres menuju level berikutnya.

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

2. **Melalui Wrangler CLI**:
   ```bash
   npx wrangler pages deploy . --project-name=webtetris-edge
   ```

---

## 📂 Struktur Berkas

```
tetris-web-rb/
├── index.html       # Struktur semantik HTML5, UI Overlays, & wadah responsif
├── style.css        # Sistem desain CSS3 adaptif, animasi getar & ledakan
├── script.js        # Engine Tetris, Candy Bomb, Particle System, & SFX Synthesizer
├── .gitignore       # Daftar berkas yang diabaikan oleh Git
└── README.md        # Dokumentasi resmi proyek
```

---

## 📄 Hak Cipta & Lisensi

Copyright © 2026 **RBeverything**. All rights reserved.

Proyek ini dibuat dan dikembangkan di bawah naungan **RBeverything**. Penggunaan, pendistribusian, dan modifikasi kode tunduk pada ketentuan lisensi pemilik proyek.
