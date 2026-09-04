# 📜 Release Notes - RBlock Adventure

Catatan riwayat pembaruan (*changelog*) komprehensif dari awal pembuatan proyek hingga versi terkini.

---

## 🏷️ Ringkasan Versi

- [v1.7.0](#v170---global-leaderboard-cloudflare-pages-functions--kv) — **Global Leaderboard (Cloudflare Pages Functions & KV)** *(Terkini)*
- [v1.6.0](#v160---rebranding-rblock-adventure--direct-touch-gestures) — **Rebranding "RBlock Adventure" & Gestur Sentuh Layar Langsung**
- [v1.5.0](#v150---penyempurnaan-candy-bomb-11--level-scaling-fuse) — **Penyempurnaan Candy Bomb 1×1 & Durasi Dinamis**
- [v1.4.0](#v140---efek-ledakan-animasi-pecahan-balok--audio-synthesizer) — **Candy Bomb, Efek Pecahan Balok & SFX Web Audio**
- [v1.3.0](#v130---deployment-cloudflare-pages--hak-cipta-rbeverything) — **Deployment Cloudflare Pages & Hak Cipta RBeverything**
- [v1.2.0](#v120---desain-100-responsif-desktop-tablet--mobile) — **Desain 100% Responsif & Kontrol Mobile**
- [v1.1.0](#v110---redesain-ceria--child-friendly-candy-edition) — **Redesain Ceria & Child-Friendly (Candy Edition)**
- [v1.0.0](#v100---fondasi-awal-permainan) — **Fondasi Awal Permainan**

---

## [v1.7.0] - Global Leaderboard (Cloudflare Pages Functions & KV)
*Tanggal Rilis: 4 September 2026*

### 🌟 Fitur Baru:
- **Cloudflare Pages Function Backend (`/api/leaderboard`)**:
  - Mengimplementasikan serverless API menggunakan Cloudflare Pages Functions (`functions/api/leaderboard.js`).
  - Menyimpan rekor skor dunia secara persisten di **Cloudflare KV (`LEADERBOARD_KV`)**.
  - Dilengkapi sanitasi nama pemain, pembatasan karakter (2–12 huruf), validasi integer skor, dan HTTP edge caching.
- **Tampilan Global Hall of Fame Modal (UI)**:
  - Tombol **🏆 Top 10** baru di header navigasi game (dapat dibuka kapan saja atau via tombol shortcut keyboard `L`).
  - Kartu medali peringkat piala: Emas (🥇 Juara 1), Perak (🥈 Juara 2), dan Perunggu (🥉 Juara 3).
  - Tampilan skor berformat rapi (*ribuan dengan koma*) dan tanggal pencapaian.
  - Tombol **🔄 Refresh** untuk memperbarui daftar juara secara *real-time*.
- **Integrasi Alur Game Over**:
  - Formulir input nama pemain otomatis muncul saat permainan berakhir.
  - Nama pemain otomatis tersimpan di `localStorage` sehingga tidak perlu mengetik ulang setiap kali bermain.
  - Tombol langsung untuk melihat peringkat dunia setelah menyimpan skor.
- **Smart Local Fallback**:
  - Game tetap dapat dimainkan dan diuji di lingkungan `localhost` tanpa error; otomatis beralih ke rekor lokal jika backend Cloudflare KV belum terhubung.

---

## [v1.6.0] - Rebranding "RBlock Adventure" & Direct Touch Gestures
*Tanggal Rilis: 4 September 2026*

### 🚀 Perubahan Besar:
- **Rebranding Penuh ke "RBlock Adventure"**:
  - Mengganti seluruh nama dan referensi lama untuk melindungi kepemilikan intelektual dari risiko hak cipta dan merek dagang pihak ketiga.
  - Pembaruan menyeluruh pada HTML title, header logo, modal overlay, nama class engine (`RBlockGame`), storage keys, dan banner 4-baris (`MEGA RBLOCK! +800 ★🎉`).
- **Kontrol Gestur Sentuh Langsung di Layar (Direct Touch Gestures)**:
  - Menyeret/menggeser jari ke kiri/kanan di atas canvas langsung memindahkan balok per kolom.
  - Menyeret jari ke bawah mengaktifkan *Soft Drop*.
  - Menjentikkan jari ke bawah dengan cepat (*flick down*) mengaktifkan *Super Drop* (jatuh seketika).
  - Mengetuk layar secara singkat (*quick tap*) memutar balok 90°.
  - Menambahkan aturan `touch-action: none;` untuk mencegah halaman browser tergeser atau ter-reload saat pemain mengusap layar.
- **Sistem Kontrol Hibrida**:
  - Mempertahankan tombol navigasi sentuh di bagian bawah layar untuk fleksibilitas bermain dengan dua jempol.

---

## [v1.5.0] - Penyempurnaan Candy Bomb 1×1 & Level-Scaling Fuse
*Tanggal Rilis: 4 September 2026*

### 🎮 Gameplay Balance:
- **Ukuran Bom Kompak 1×1**:
  - Mengubah ukuran balok bom dari 2×2 menjadi 1×1 (satu petak balok saja), menjadikannya lebih taktis dan tidak membebani ruang matrix.
- **Durasi Sumbu Bom Dinamis (Dynamic Fuse Timer)**:
  - Durasi hitung mundur bom menyesuaikan level pemain: **8.0 detik** pada Level 1, **6.5 detik** pada Level 2, **5.0 detik** pada Level 3, hingga **2.5 detik** pada level tinggi.
  - Menampilkan badge waktu hitung mundur `⏱️ X.Xs` yang melayang tepat di atas posisi balok bom aktif.
- **Penyempurnaan Kotak Kontrol (Desktop UI)**:
  - Merapikan tata letak kotak panduan kontrol agar lebih lega, simetris, dan nyaman dibaca.

---

## [v1.4.0] - Efek Ledakan, Animasi Pecahan Balok & Audio Synthesizer
*Tanggal Rilis: 4 September 2026*

### ✨ Efek Visual & Suara:
- **Candy Bomb & Efek Ledakan**:
  - Balok bom khusus dengan sumbu berkedip menyala.
  - Saat meledak, melumat balok dalam radius 3×3 dengan efek guncangan layar (*Screen Shake*) dan cincin gelombang kejut (*Shockwave Ring*).
  - Bonus ledakan +250 Poin dasar + 40 Poin per balok yang hancur.
- **Animasi Pecahan Balok (Shattered Debris)**:
  - Baris yang berhasil dibersihkan (*line clear*) pecah menjadi serpihan kubus kristal warna-warni yang berhamburan dengan simulasi gravitasi.
- **Web Audio API Synthesizer (Tanpa File Audio Eksternal)**:
  - Dentuman ledakan bom berfrekuensi rendah (*deep sub-bass boom*).
  - Efek gemerincing kaca pecah saat balok hancur.
  - Nada melodi marimba/xylophone bertingkat untuk kombo beruntun (*1x, 2x, 3x COMBO!*).
  - Tombol *Mute / Unmute* dengan shortcut keyboard `M`.

---

## [v1.3.0] - Deployment Cloudflare Pages & Hak Cipta RBeverything
*Tanggal Rilis: 4 September 2026*

### 🌐 Konfigurasi Proyek:
- **Kesiapan Cloudflare Pages**:
  - Menghapus ketergantungan *build step* (*zero-config static deployment*).
  - Konfigurasi Build Command: *Kosong*, Output Directory: `/`.
- **Manajemen Repositori Git**:
  - Menambahkan file `.gitignore` standar untuk mengabaikan direktori lokal, temporary, dan log.
- **Hak Cipta Resmi**:
  - Mencantumkan lisensi dan hak cipta **Copyright © 2026 RBeverything. All rights reserved.** pada [README.md](file:///c:/Work/rbtech.site/rbeverything.com/game-collection/tetris-web-rb/README.md) dan footer aplikasi.

---

## [v1.2.0] - Desain 100% Responsif (Desktop, Tablet & Mobile)
*Tanggal Rilis: 4 September 2026*

### 📱 UI/UX Adaptif:
- **No-Scroll Layout**:
  - Memanfaatkan Dynamic Viewport Units (`100dvh`) agar game selalu tampil pas 1 layar penuh di smartphone tanpa scroll vertikal.
- **Multi-Device Support**:
  - **Desktop ($\ge 850\text{px}$)**: Layout 3 kolom elegan dengan panel statistik di kiri dan preview/kontrol di kanan.
  - **Tablet ($600\text{px} - 849\text{px}$)**: Penskalaan otomatis proporsional menggunakan CSS `clamp()`.
  - **Mobile Smartphone ($< 600\text{px}$)**: Tata letak ramah konsol genggam dengan D-Pad jempol kiri dan tombol aksi jempol kanan.
- **HiDPI Retina Ready**:
  - Canvas secara dinamis dikalibrasi dengan rasio piksel perangkat (`window.devicePixelRatio`) sehingga grafis tajam dan tidak buram.

---

## [v1.1.0] - Redesain Ceria & Child-Friendly (Candy Edition)
*Tanggal Rilis: 4 September 2026*

### 🎨 Desain Visual Baru:
- Mengubah tema game dari gaya retro kaku menjadi tampilan permen jelly manis (*Glossy Jelly Blocks*).
- Tipografi bulat bersahabat menggunakan Google Font **`Fredoka`**.
- Latar belakang gradasi ungu lembut beranimasi gelembung melayang dan bintang berkelip.
- Modal ceria bertema kartun: *"Ready to Play?"*, *"Nap Time!"* (saat jeda), dan *"You Did Great!"* (saat game over).
- Animasi banner mengambang saat mendapatkan skor atau kombo.

---

## [v1.0.0] - Fondasi Awal Permainan
*Tanggal Rilis: 4 September 2026*

### 🧱 Baseline:
- Matrix standar 10 kolom × 20 baris dengan 7 bentuk balok klasik.
- Mesin loop game berbasis `requestAnimationFrame`.
- Sistem rotasi balok dengan deteksi benturan dinding (*wall-kicks*).
- Proyeksi bayangan balok jatuh (*Ghost Piece*).
- Fitur simpan balok cadangan (*Hold / Pocket*).
- Panduan menjalankan server lokal menggunakan `python -m http.server 3000`.

---

*Dokumen ini diperbarui secara berkala seiring dengan penambahan fitur dan pembaruan sistem RBlock Adventure.*
