# Website Portofolio Ahmad Dery SA

Website portofolio satu halaman untuk Ahmad Dery SA, Aspiring Web Developer. Proyek ini adalah **Personal Project** yang dibuat sebagai bahan belajar dan etalase untuk mencari peluang kerja dan proyek freelance di bidang web development.

Alamat website: **https://portoadsa.vercel.app/**

## Tujuan

- Memperkenalkan diri secara jujur sebagai pemula yang sedang belajar.
- Menampilkan proyek latihan beserta statusnya.
- Menjadi tempat berlatih HTML, CSS, JavaScript, deployment, dan dasar keamanan web.

## Fitur

- Tampilan responsif untuk ponsel dan desktop.
- Satu halaman dengan bagian Tentang, Skill, Proyek, Layanan, dan Kontak.
- Menu ponsel yang bisa dibuka dan ditutup, serta navigasi yang bisa dipakai dengan keyboard.
- **Panel admin** (`admin.html`) yang dilindungi login, untuk:
  - mengubah teks, judul bagian, dan tombol di bagian utama;
  - menambah, mengubah, mengurutkan, dan menghapus menu, skill, proyek, dan layanan;
  - menyembunyikan atau menampilkan bagian halaman;
  - mengganti warna tema dan jenis tulisan;
  - mengunggah gambar, video MP4, dan PDF, serta mengganti favicon.
- Jika database tidak bisa diakses, website tetap tampil dengan isi bawaan di `index.html`.

## Teknologi

| Teknologi | Fungsi |
|---|---|
| HTML, CSS, JavaScript | Halaman website dan panel admin (tanpa framework) |
| Vercel | Hosting (paket gratis) |
| Supabase | Database pengaturan, login admin, dan penyimpanan file (paket gratis) |
| GitHub | Penyimpanan kode dan penerbitan otomatis ke Vercel |

## Struktur folder

```
├── index.html        Halaman utama
├── admin.html        Panel admin (butuh login)
├── css/style.css     Tampilan
└── js/
    ├── config.js     Konfigurasi publik dan fungsi bersama
    ├── site.js       Menerapkan pengaturan dari database ke halaman utama
    ├── admin.js      Logika panel admin
    └── script.js     Menu ponsel dan tahun di footer
```

## Cara memperbarui

- **Isi website** (teks, menu, proyek, warna, file): lewat `admin.html`, tanpa mengubah kode.
- **Kode**: ubah file di GitHub. Vercel menerbitkan ulang otomatis setelah perubahan disimpan (commit).

## Keamanan

- Kode hanya memuat Project URL dan Publishable key Supabase, yang memang dirancang untuk publik.
- Secret key, `service_role` key, dan Database Password **tidak** ada di kode dan tidak boleh ditambahkan.
- Row Level Security (RLS) aktif: semua orang boleh membaca pengaturan, tetapi hanya akun admin yang boleh mengubah data dan mengunggah file.
- Pendaftaran akun baru di Supabase dimatikan.
- Teks dari database ditampilkan sebagai teks biasa, dan tautan hanya diterima jika berawalan `https://`.
- File di penyimpanan bersifat publik: jangan mengunggah dokumen pribadi.

## Batasan yang perlu diketahui

- Mengikuti ketentuan paket gratis Vercel dan Supabase, yang bisa berubah. Paket gratis Vercel ditujukan untuk penggunaan pribadi dan non-komersial.
- Project Supabase gratis dapat dijeda setelah lama tidak aktif. Saat itu panel admin tidak bisa dipakai sampai project diaktifkan lagi, dan website tampil dengan isi bawaan.
- Batas unggahan 50 MB per file. Untuk video panjang, gunakan tautan YouTube.
- Favicon dari panel dipasang lewat JavaScript, sehingga sebagian pratinjau tautan bisa tetap memakai ikon bawaan.

## Status proyek

Proyek latihan. Semua proyek di website diberi label sesuai jenisnya (Proyek Latihan, Personal Project, atau Demo Konsep), dan tidak ada klien, testimoni, atau hasil bisnis yang dibuat-buat.

## Yang saya pelajari

GANTI bagian ini dengan pengalaman Anda sendiri. Contoh pertanyaan untuk membantu menulis:

- Apa bagian yang paling sulit, dan bagaimana Anda mengatasinya?
- Apa yang Anda pahami sekarang tentang HTML, CSS, JavaScript, dan deployment yang dulu belum Anda pahami?
- Apa yang ingin Anda pelajari berikutnya?

## Rencana berikutnya

- Menyelesaikan proyek latihan website profil UMKM.
- Menyelesaikan proyek latihan landing page jasa.
- GANTI atau tambahkan rencana Anda sendiri.
