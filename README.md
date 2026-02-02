# Dedi Spin Wheels 🎡

Aplikasi Spin Wheel 3D sederhana untuk menentukan siapa yang akan mengajak makan siang ke KFC hari ini!
Dibuat menggunakan Three.js dan HTML5 Canvas.

## Fitur
- Roda keberuntungan 3D interaktif.
- Fisika putaran dengan animasi halus.
- Logika "Rigged" (diatur) agar selalu berhenti di nama **Bambang** (Fitur rahasia).
- Tampilan UI modern.

## Cara Menjalankan Aplikasi

Karena adanya pembatasan keamanan (Execution Policy) pada PowerShell di beberapa sistem Windows, aplikasi ini dirancang untuk berjalan tanpa perlu perintah `npm`.

### Metode 1: Menggunakan Script (Paling Mudah)
1. Double-click file **`run.bat`** di dalam folder ini.
2. Aplikasi akan otomatis berjalan dan memberitahu alamat server.
3. Buka browser di `http://localhost:8080`.

### Metode 2: Menggunakan Terminal Manual
Jika Anda lebih suka menggunakan terminal (Command Prompt / PowerShell):
```bash
node server.js
```
Lalu buka browser di `http://localhost:8080`.

## Catatan Teknis
- **Server**: Menggunakan server Node.js native (`server.js`) untuk menghindari masalah dependensi.
- **Library**: Three.js dimuat langsung melalui CDN (Content Delivery Network) sehingga tidak perlu `node_modules`.

## Credits
Dibuat untuk seru-seruan tim makan siang! 🍗
