/**
 * Gasing Homepage — API configuration & data helpers
 *
 * Semua endpoint Discourse API dan fungsi transformasi data ada di sini,
 * agar komponen utama hanya fokus pada logika UI.
 */

// ─── Endpoint constants ────────────────────────────────────────────────────────
// Memusatkan endpoint di sini memudahkan pembaruan slug kategori atau
// penambahan query param tanpa perlu mencari di dalam komponen.
export const ENDPOINTS = {
  trending:  "/top/weekly.json?per_page=5",
  latest:    "/c/general/l/latest.json?per_page=5",
  news:      "/c/ga-updates/l/latest.json?per_page=5",
  materi:    "/c/gasing-library/l/latest.json?per_page=5",
  meetup:    "/c/webinar/l/latest.json?per_page=5",
  exclusive: "/c/downloads/l/latest.json?per_page=5",
  minigame:  "/c/gasing-library/mini-games/l/latest.json?per_page=5",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ambil array topic dari response Promise.allSettled.
 * Mengembalikan array kosong jika response gagal atau malformed.
 *
 * @param {Object} result - Satu item dari Promise.allSettled
 * @returns {Array}
 */
export function extractTopics(result) {
  return result?.value?.topic_list?.topics ?? [];
}

/**
 * Pilih thumbnail terkecil yang lebarnya >= targetWidth.
 * Fallback ke yang terbesar jika tidak ada yang memenuhi syarat.
 *
 * @param {Array}  thumbnails  - Array thumbnail Discourse ({ width, url })
 * @param {number} targetWidth - Lebar minimum yang diinginkan (default: 600px)
 * @returns {string|null}
 */
export function bestThumbnail(thumbnails, targetWidth = 600) {
  if (!thumbnails?.length) return null;
  const sorted = [...thumbnails].sort((a, b) => a.width - b.width);
  return (sorted.find((t) => t.width >= targetWidth) ?? sorted[sorted.length - 1]).url;
}

/**
 * Hitung waktu relatif berbahasa Indonesia dari string tanggal ISO.
 * Contoh output: "baru saja", "5 menit lalu", "2 jam lalu", "3 hari lalu".
 *
 * @param {string} dateStr
 * @returns {string}
 */
export function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)  return "baru saja";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} menit lalu`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} jam lalu`;
  }
  if (diff < 2592000) {
    const d = Math.floor(diff / 86400);
    return `${d} hari lalu`;
  }
  if (diff < 31536000) {
    const mo = Math.floor(diff / 2592000);
    return `${mo} bulan lalu`;
  }
  const y = Math.floor(diff / 31536000);
  return `${y} tahun lalu`;
}

/**
 * Format string tanggal ISO ke format tanggal lokal Indonesia.
 *
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ─── Data mappers ─────────────────────────────────────────────────────────────

/**
 * Map raw topic Discourse ke shape ringkas untuk daftar topic.
 * Digunakan oleh section: Komunitas, Belajar, Minigame.
 *
 * @param {Array} topics
 * @returns {Array}
 */
export function mapTopics(topics = []) {
  return topics.map((t) => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    excerpt: t.excerpt ?? "",
    likeCount: t.like_count ?? 0,
    replyCount: t.posts_count ? t.posts_count - 1 : 0,
    tags: t.tags ?? [],
    imageUrl: t.image_url ?? null,
    createdAt: t.created_at,
    relativeAge: relativeTime(t.created_at),
  }));
}

/**
 * Map raw topic Discourse ke shape yang lebih kaya untuk kartu berita/event.
 * Termasuk seleksi thumbnail dan estimasi waktu baca.
 * Digunakan oleh section: News, Meetup, Exclusive.
 *
 * @param {Array} topics
 * @returns {Array}
 */
export function mapNews(topics = []) {
  return topics.map((t) => {
    const wordCount = (t.excerpt ?? t.title ?? "").split(/\s+/).length * 8;
    const readMin = Math.max(1, Math.round(wordCount / 200));
    return {
      id: t.id,
      title: t.title,
      slug: t.slug,
      excerpt: t.excerpt ?? "",
      imageUrl: t.image_url ?? null,
      thumbnailUrl: bestThumbnail(t.thumbnails, 600) ?? t.image_url ?? null,
      createdAt: t.created_at,
      formattedDate: formatDate(t.created_at),
      readTime: readMin,
      views: t.views ?? 0,
      likeCount: t.like_count ?? 0,
    };
  });
}
