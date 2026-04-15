# Gasing Circle — Unified Layout Theme Component (Homepage + Academy News)

Theme component Discourse yang menggabungkan dua layout utama dalam satu paket:

1. **Homepage Dashboard** — Menggantikan halaman utama Discourse dengan dashboard multi-kolom berbasis widget.
2. **Academy News Layout** — Master-detail split-pane untuk halaman kategori berita (`ga-updates`), lengkap dengan filter, kalender, komentar inline, dan reading panel.

**Versi:** 2.0.0  
**Minimum Discourse:** 3.1.0

---

## File Structure

```
gasing-home-layout/
├── about.json                              ← Metadata, assets & custom_homepage modifier
├── settings.yml                            ← Konfigurasi admin (hero, news colors, font, dll)
├── README.md
│
├── assets/
│   ├── hero-bg.png                         ← Background hero homepage
│   ├── mascot-logic.svg                    ← Maskot Logic
│   ├── mascot-communication.svg            ← Maskot Communication
│   └── mascot-creativity.svg               ← Maskot Creativity
│
├── common/
│   ├── common.scss                         ← Global styles (homepage layout + variables)
│   └── head_tag.html                       ← Google Fonts loader (Nunito, Poppins)
│
├── stylesheets/
│   ├── gasing-homepage.scss                ← Entry point (redirect ke common.scss)
│   └── academy-news.scss                   ← Semua styles Academy News (~1500 baris)
│
└── javascripts/discourse/
    ├── api-initializers/
    │   ├── news-logic.js                   ← Bootstrapper Academy News (onPageChange, routeDidChange)
    │   └── sidebar-news-indicator.js       ← Indikator unread di sidebar untuk kategori news
    │
    ├── components/
    │   ├── gasing-homepage.js              ← Glimmer component logic (Homepage)
    │   ├── gasing-homepage.hbs             ← Glimmer template (Homepage)
    │   ├── gc-news-item.hbs                ← Reusable template: baris berita
    │   └── gc-topic-item.hbs               ← Reusable template: baris topic
    │
    ├── connectors/
    │   └── custom-homepage/
    │       └── gasing-homepage-connector.hbs  ← Injection point (<GasingHomepage />)
    │
    └── lib/
        ├── homepage-api.js                 ← Endpoint constants & data mappers (Homepage)
        ├── gc-state.js                     ← Shared mutable state & API reference (News)
        ├── gc-render.js                    ← Master render & cleanup (News)
        ├── gc-bindings.js                  ← DOM event handlers & action bindings (News)
        ├── gc-builders.js                  ← HTML builders: hero, cards, popups (News)
        ├── gc-comments.js                  ← Comment & topic detail panel builders (News)
        ├── gc-fetch.js                     ← Data fetching: topics & posts (News)
        ├── gc-filters.js                   ← Filter logic: trending, tag, date, search (News)
        ├── gc-calendar.js                  ← Calendar grid builder untuk date-range picker (News)
        ├── gc-tags.js                      ← Tag rendering & extraction helpers (News)
        ├── gc-icons.js                     ← SVG icon strings (News)
        └── gc-utils.js                     ← Route detection & body-class management (News)
```

---

## Installation

1. **Admin → Customize → Themes → Install → From ZIP file**
2. Upload ZIP atau install via Git.
3. Enable dan asosiasikan dengan tema aktif.
4. `custom_homepage` modifier otomatis aktif dari `about.json`.
5. Set `news_category_id` dan `gc_category_slug` di theme settings agar Academy News Layout aktif di kategori yang benar.

---

## Architecture

### Homepage Dashboard

Menggunakan pola modern Discourse theme:

- **Glimmer Component** — Seluruh dashboard adalah standalone `<GasingHomepage />`.
- **Connector** — Diinjeksi melalui outlet `custom-homepage` (diaktifkan oleh `"custom_homepage": true` di `about.json`).
- **Data Fetching** — Menggunakan `ajax` helper Discourse + `Promise.allSettled` untuk fetch paralel.
- **Scoped Styling** — Body class `gasing-home-active` dikelola otomatis saat komponen mount/unmount untuk menyembunyikan elemen standar Discourse.
- **Theme Assets** — Gambar maskot dan hero background didaftarkan di `about.json`, diakses via `__theme_upload_url()` atau fallback `settings.theme_uploads`.

### Academy News Layout

Menggunakan pendekatan imperatif (vanilla DOM) via `apiInitializer`:

- **Route Detection** — `gc-utils.js` mengecek URL terhadap `gc_category_slug` dari settings untuk menentukan apakah layout News ditampilkan.
- **Master-Detail Split Pane** — Daftar artikel di kiri, reading panel di kanan. Klik artikel memuat konten lengkap + komentar di panel kanan tanpa navigasi halaman.
- **Modular Codebase** — Dipecah ke 11 file `gc-*.js` di folder `lib/`:
  - `gc-state.js` — Global mutable state (filter, pagination, active topic, dll)
  - `gc-render.js` — Orchestrator: render layout, bind events
  - `gc-bindings.js` — Event listener untuk card clicks, load more, filter, search, like, bookmark, reply
  - `gc-builders.js` — HTML string builders untuk hero banner, action bar, topic cards, filter/date popups
  - `gc-comments.js` — Builders untuk topic detail panel dan comment tree
  - `gc-fetch.js` — Fetch functions: `fetchCategoryTopics`, `fetchTopicPosts`, `fetchPostReplies`
  - `gc-filters.js` — Unified filter engine (trending, tag, date range, search text)
  - `gc-calendar.js` — Calendar grid HTML builder untuk date-range picker
  - `gc-tags.js` — Tag rendering dan extraction dari topics
  - `gc-icons.js` — SVG icon library
  - `gc-utils.js` — Route matching, body-class toggle
- **Sidebar Unread Indicator** — `sidebar-news-indicator.js` menambahkan class `.has-unread` pada link sidebar kategori news saat ada topic baru/belum dibaca.
- **Composer Integration** — Setelah user membalas di panel, transition route dicegah (`preventNextRoute`) agar tetap di layout News, dan panel otomatis di-refresh.

---

## Homepage — Dashboard Layout

Dashboard tersusun dari hero section dan grid dua kolom:

| Section | Konten | Sumber Data |
|---|---|---|
| **Hero Banner** | Greeting, CTA, counter pendaftar | `settings.yml` + topic JSON |
| **Eksklusif Konten** | Promo card (1 item) | `/c/downloads/l/latest.json` |
| **Komunitas Gasing** | Trending / Latest tabs (5 items) | `/top/weekly.json` & `/latest.json` |
| **Gasing Library** | Materi terbaru (5 items) | `/c/gasing-library/l/latest.json` |
| **Virtual Meet-Up** | Event tiles (2 items) | `/c/webinar/l/latest.json` |
| **Academy News** | Daftar berita (3 items) | `/c/ga-updates/l/latest.json` |
| **Mini Game** | Promo card (1 item) | `/c/gasing-library/mini-games/l/latest.json` |

### Data Fetching (Homepage)

Semua data di-fetch paralel via `Promise.allSettled`. Endpoint didefinisikan di `lib/homepage-api.js`:

| Widget | Endpoint | Ditampilkan |
|---|---|---|
| Komunitas (Trending) | `/top/weekly.json?per_page=5` | 5 topics |
| Komunitas (Latest) | `/latest.json?per_page=5` | 5 topics |
| Academy News | `/c/ga-updates/l/latest.json?per_page=5` | 3 topics |
| Gasing Library | `/c/gasing-library/l/latest.json?per_page=5` | 5 topics |
| Virtual Meet-Up | `/c/webinar/l/latest.json?per_page=5` | 2 topics |
| Eksklusif Konten | `/c/downloads/l/latest.json?per_page=5` | 1 topic |
| Mini Game | `/c/gasing-library/mini-games/l/latest.json?per_page=5` | 1 topic |

### Reusable Templates

- **`gc-topic-item.hbs`** — Baris topic dengan avatar placeholder, title, tags, like & reply count. Digunakan oleh section Komunitas (`@showMeta=true`) dan Belajar.
- **`gc-news-item.hbs`** — Baris berita dengan thumbnail (fallback chain: `thumbnailUrl` → `imageUrl` → SVG placeholder), tanggal, estimasi waktu baca, dan excerpt.

---

## Academy News — Fitur

- **Hero banner** — Gradasi warna kustom, judul & subtitle dari settings
- **Action bar** — Trending/Latest toggle, search, filter by tag, filter by date range
- **Topic cards** — Thumbnail, judul, tag, tanggal, views, likes
- **Reading panel** — Konten lengkap topic + comment tree di panel kanan
- **Komentar** — Like, reply, bookmark, share — semua inline tanpa meninggalkan layout
- **Nested replies** — Expand/collapse reply tree per komentar
- **Pagination** — Load more button di akhir daftar topic
- **Date-range picker** — Dual-calendar popup untuk filter tanggal
- **Tag filter** — Multi-select popup, tag diekstrak dinamis dari topics yang tersedia

---

## Configuration (`settings.yml`)

### Homepage — Hero Settings

| Setting | Tipe | Default | Deskripsi |
|---|---|---|---|
| `hero_greeting` | string | `"Selamat Datang"` | Teks sapaan |
| `hero_cta_text` | string | *(promo text)* | Deskripsi CTA |
| `hero_cta_button_text` | string | `"Saya daftar!"` | Label tombol CTA |
| `hero_cta_link` | string | `"/t/pendaftaran-trainer"` | URL tujuan CTA |
| `hero_cta_max_count` | integer | `50` | Target maksimum counter |
| `hero_cta_count_label` | string | `"guru mendaftar"` | Label counter |

### Academy News — Kategori Target

| Setting | Tipe | Default | Deskripsi |
|---|---|---|---|
| `news_category_id` | integer | `0` | ID kategori untuk sidebar unread indicator |
| `gc_category_slug` | string | `"ga-updates"` | Slug kategori tempat layout News aktif |

### Academy News — Brand Colors

| Setting | Default | Deskripsi |
|---|---|---|
| `gc_primary_color` | `#1976D2` | Warna utama (tombol, link, state aktif) |
| `gc_primary_dark_color` | `#1565C0` | Warna hover |
| `gc_primary_light_color` | `#E3F2FD` | Warna latar badge / hover bg |

### Academy News — Hero Banner

| Setting | Default | Deskripsi |
|---|---|---|
| `gc_hero_title` | `"Gasing Academy News 📢"` | Judul hero |
| `gc_hero_subtitle` | *(teks deskripsi)* | Subtitle hero |
| `gc_hero_start_color` | `#00BCD4` | Gradasi kiri |
| `gc_hero_end_color` | `#1565C0` | Gradasi kanan |

### Academy News — Visual

| Setting | Default | Deskripsi |
|---|---|---|
| `gc_page_bg_color` | `#F5F5F5` | Background halaman |
| `gc_card_bg_color` | `#ffffff` | Background kartu |
| `gc_card_border_color` | `#E0E0E0` | Border kartu |
| `gc_text_primary_color` | `#212121` | Teks utama |
| `gc_text_secondary_color` | `#757575` | Teks sekunder |
| `gc_text_muted_color` | `#9E9E9E` | Teks redup |
| `gc_divider_color` | `#E0E0E0` | Garis pemisah |

### Academy News — Tag Colors

| Setting | Default |
|---|---|
| `gc_tag_pelatihan_color` | `#FF9800` |
| `gc_tag_pendidikan_color` | `#1976D2` |
| `gc_tag_dunia_color` | `#10B981` |
| `gc_tag_lainnya_color` | `#8B5CF6` |

### Academy News — Font

| Setting | Tipe | Default | Pilihan |
|---|---|---|---|
| `gc_font_body` | enum | `Nunito` | Nunito, Inter, Poppins, Roboto, Open Sans, Lato |

Font di-load via `common/head_tag.html` (Google Fonts: Nunito + Poppins).

---

## Theme Assets (`about.json`)

Didaftarkan di `about.json` dan diakses di JS via `__theme_upload_url(key)`:

| Key | File | Penggunaan |
|---|---|---|
| `mascot_logic` | `assets/mascot-logic.svg` | Maskot Logic di hero homepage |
| `mascot_communication` | `assets/mascot-communication.svg` | Maskot Communication di hero homepage |
| `mascot_creativity` | `assets/mascot-creativity.svg` | Maskot Creativity di hero homepage |
| `hero_bg` | `assets/hero-bg.png` | Background hero section homepage |

---

## Discourse Version Compatibility

- **Minimum:** 3.1.0 (Glimmer components in themes)
- **Tested:** 3.2.x, 3.3.x
- **Requirement:** Core support for `custom_homepage` modifier