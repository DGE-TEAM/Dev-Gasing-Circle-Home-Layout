# Gasing Circle UI/UX Overhaul - Discourse Theme Component

## Deskripsi

Theme Component ini dirancang khusus untuk mengubah tampilan standar antarmuka Discourse menjadi platform edukasi dan komunitas "Gasing Circle". Komponen ini melakukan perombakan total pada struktur _layout_, mengubah daftar topik standar menjadi antarmuka berbasis kartu (_card-based_), _grid_, dan _dashboard_ interaktif untuk mengoptimalkan pengalaman belajar dan berinteraksi.

## Fitur Utama (Berdasarkan Modul Halaman)

- **Global Layout & Navigation:**
  - Perombakan total pada _Sidebar_ kiri menjadi menu navigasi kustom dengan _dropdown_ spesifik (Gasing Academy News, Komunitas, Konten Eksklusif, Virtual Meet-Up, Materi Gasing).
  - Modifikasi _Header_ atas menjadi lebih bersih dengan integrasi profil pengguna dan notifikasi minimalis.

- **Dashboard Komunitas (Komunitas Page):**
  - Penambahan _Hero Banner_ "Selamat Datang di Komunitas".
  - Penyisipan _custom widgets_ untuk menampilkan: "Sedang Trending", "Thread Terbaru", dan "Challenge Terbaru".
  - Sistem _Accordion_ di sisi kanan untuk "FAQ & Panduan Komunitas".

- **Direktori Kategori (Forum Page):**
  - Mengubah daftar kategori standar menjadi antarmuka _Grid_ berbasis kartu interaktif dengan ikon 3D kustom (Berbagi & Diskusi, Penjumlahan, Perkalian, dll).
  - Modifikasi tampilan _thread_ diskusi menjadi lebih menyerupai antarmuka _chat_ modern.

- **Sistem Tantangan (Challenge Page):**
  - Merombak UI daftar topik menjadi _list_ penugasan/tantangan.
  - Menambahkan indikator status visual (Mulai, Selesai, Tenggat Waktu, Reward).

- **Data Anggota (All Members Page):**
  - Mengganti direktori bawaan dengan _Data Table_ yang komprehensif.
  - Kolom metrik khusus yang menampilkan: Rank, Positive Score, Negative Score, Total Rep, dan tombol "View Stats".

- **Portal Berita & Artikel (Gasing Academy News):**
  - Mengubah _layout_ topik menjadi bergaya portal berita.
  - Menampilkan artikel utama (_Highlight/Trending_) dan _grid_ berita dengan _thumbnail_ gambar yang rapi.

- **Galeri Materi Edukasi (Konten Eksklusif & Materi Gasing):**
  - Antarmuka bergaya _e-commerce_ untuk menampilkan _worksheet_ pembelajaran dengan tombol _download_ langsung.
  - Integrasi pemutar audio mini dan tata letak khusus untuk _thumbnail_ video pembelajaran.

- **Jadwal Acara (Virtual Meet-up Page):**
  - Penambahan komponen _Carousel_ (slider horizontal) dinamis untuk jadwal kelas/meet-up mendatang.
  - _Grid layout_ terstruktur untuk mengakses arsip rekaman "Meetup Sebelumnya".

## Instalasi

1. Masuk ke halaman admin Discourse situs Anda (`/admin`).
2. Navigasi ke tab **Customize** -> **Themes**.
3. Klik tombol **Install** lalu pilih opsi **From a git repository**.
4. Masukkan URL repository Theme Component ini dan klik **Install**.
5. Setelah terinstal, pastikan untuk menambahkan komponen ini ke Tema Utama (Default Theme) situs Anda.

## Catatan Pengembangan (Developer Notes)

Karena ini adalah perombakan UI tingkat lanjut, pengembangan tema ini akan:

- Sangat bergantung pada teknik **Overriding Templates** (`.hbs` / Glimmer components) bawaan Discourse.
- Membutuhkan identifikasi dan pemanfaatan **Plugin Outlets** untuk menyuntikkan _widget_ dan _banner_ baru tanpa merusak fungsi _core_ (terutama untuk halaman Komunitas).
- Memerlukan struktur arsitektur CSS/SCSS yang sangat rapi (menggunakan metodologi BEM atau _utility classes_) karena banyak elemen desain (seperti _cards_ dan _buttons_) yang digunakan berulang di berbagai modul halaman.
