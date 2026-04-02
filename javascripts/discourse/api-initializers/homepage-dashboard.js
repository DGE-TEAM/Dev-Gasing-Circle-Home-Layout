// =============================================================
// GASING CIRCLE — Homepage Dashboard  |  homepage-dashboard.js
// Replaces the Discourse discovery page with a rich multi-
// column dashboard using Plugin API v0.8+  (no Ruby, no plugin)
// =============================================================

import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

// ─── CONSTANTS ────────────────────────────────────────────────
const DASHBOARD_ID = "gh-dashboard";

// Category slugs — keep in sync with settings.yml
const CAT = {
  komunitas: "forum",
  news: "gasing-academy-news",
  belajar: "materi-gasing",
  meetup: "virtual-meet-up",
};

const TOPIC_COUNT = {
  komunitas: 4,
  news: 3,
  belajar: 4,
};

// ─── INLINE SVG HELPERS ───────────────────────────────────────
const I = {
  reply: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  chat: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  chevRight: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  down: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
};

// ─── UTILITY FUNCTIONS ────────────────────────────────────────

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarUrl(template, size = 72) {
  return template ? template.replace("{size}", size) : null;
}

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return "baru saja";
  if (m < 60) return `${m} menit yang lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam yang lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari yang lalu`;
}

function formatDateId(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Map category name → data-cat attribute for CSS colour pills
function catDataKey(catName) {
  if (!catName) return "default";
  const n = catName.toLowerCase();
  if (n.includes("challenge")) return "challenge";
  if (n.includes("perkalian") || n.includes("permai")) return "permainan";
  if (n.includes("materi trainer") || n.includes("trainer utama")) return "trainer";
  if (n.includes("materi")) return "materi";
  return n.replace(/\s+/g, "-").slice(0, 24);
}

// ─── DATA FETCHING ────────────────────────────────────────────

async function fetchCategoryTopics(slug, perPage = 5, sort = "latest") {
  try {
    const order = sort === "trending" ? "?order=activity" : "";
    const data = await ajax(`/c/${slug}.json${order}`, {
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    return (data?.topic_list?.topics || []).slice(0, perPage);
  } catch (e) {
    console.warn(`[GasingDash] fetchCategoryTopics(${slug}) failed`, e);
    return [];
  }
}

async function fetchCurrentUser() {
  try {
    const data = await ajax("/session/current.json");
    return data?.current_user || null;
  } catch {
    return null;
  }
}

// ─── HTML BUILDERS ────────────────────────────────────────────

function buildAvatar(poster, size = 36) {
  if (poster?.user?.avatar_template) {
    const url = avatarUrl(poster.user.avatar_template, size * 2);
    return `<div class="gh-tw-avatar"><img src="${url}" alt="${poster.user.name || ""}" /></div>`;
  }
  const initials = getInitials(poster?.user?.name || poster?.user?.username || "?");
  return `<div class="gh-tw-avatar">${initials}</div>`;
}

function buildCatPill(catName) {
  if (!catName) return "";
  const key = catDataKey(catName);
  return `<span class="gh-cat-pill" data-cat="${key}">${catName}</span>`;
}

function buildTopicItem(topic) {
  const poster = topic.posters?.[0];
  const avatarHTML = buildAvatar(poster);
  const catName =
    topic.category_name ||
    topic.tags?.[0] ||
    "General";
  const timeAgo = relativeTime(topic.last_posted_at || topic.created_at);
  const posterName = poster?.user?.name || poster?.user?.username || "Ben";

  return `
    <li class="gh-tw-item" data-topic-url="/t/${topic.slug}/${topic.id}" role="button" tabindex="0">
      ${avatarHTML}
      <div class="gh-tw-body">
        <div class="gh-tw-title">${topic.title}</div>
        <div class="gh-tw-reply-info">
          ${I.reply} ${posterName} menjawab ${timeAgo}
        </div>
        <div class="gh-tw-meta-row">
          ${buildCatPill(catName)}
          <span class="gh-tw-stat">${I.heart} ${topic.like_count || 5}</span>
          <span class="gh-tw-stat">${I.chat} ${topic.reply_count || 5}</span>
        </div>
      </div>
    </li>`;
}

function buildNewsItem(topic) {
  const imgUrl = topic.image_url || null;
  const date = formatDateId(topic.created_at);

  return `
    <li class="gh-news-item" data-topic-url="/t/${topic.slug}/${topic.id}" role="button" tabindex="0">
      <div class="gh-news-thumb">
        ${imgUrl ? `<img src="${imgUrl}" alt="${topic.title}" loading="lazy" />` : ""}
      </div>
      <div class="gh-news-body">
        <div class="gh-news-title">${topic.title}</div>
        <div class="gh-news-meta">${date} · 5-min read</div>
      </div>
    </li>`;
}

// ─── HERO SECTION ─────────────────────────────────────────────

function buildHero(user) {
  const name = user?.name || user?.username || "Kamu";
  return `
    <div class="gh-hero">
      <div class="gh-hero-content">
        <h1 class="gh-hero-greeting">Selamat Datang, ${name}!</h1>
        <p class="gh-hero-promo">
          Apa kamu mau daftar menjadi Trainer di<br/>
          pelatihan Gasing tanggal 5-20 Maret 2026?
        </p>
        <div class="gh-hero-cta-row">
          <a href="/signup-trainer" class="gh-cta-btn">
            Saya daftar!
            <span class="gh-cta-arrow">${I.down}</span>
          </a>
          <span class="gh-social-proof">50 guru mendaftar</span>
        </div>
      </div>
      <div class="gh-hero-illustrations" aria-hidden="true">
        <!-- 
          Place two illustration images here.
          Upload via Admin → Customize → Themes → Assets.
          Then reference as: <img src="{{theme_asset 'hero-char-1.png'}}" />
          For now, decorative shapes act as placeholders.
        -->
        <div style="
          position:absolute; right:40px; bottom:0;
          font-size:120px; line-height:1; opacity:.18;
          filter:blur(1px);
          pointer-events:none;
          user-select:none;
        ">🧮</div>
      </div>
    </div>`;
}

// ─── EKSKLUSIF KONTEN CARD ─────────────────────────────────────

function buildEksklusifCard() {
  return `
    <div class="gh-card gh-eksklusif-card">
      <span class="gh-ek-badge">Feb 2026</span>
      <div class="gh-ek-content">
        <h2 class="gh-ek-title">Eksklusif Konten</h2>
        <p class="gh-ek-subtitle">
          Yuk belajar trik perkalian 2 digit, dan dapatkan soal-soal penjumlahan &lt;5.
        </p>
        <a href="/c/konten-eksklusif" class="gh-ek-visual">
          <!--
            Replace with a real promotional image uploaded via theme assets:
            <img src="{{theme_asset 'eksklusif-banner.jpg'}}" alt="Fun Math Trick" />
          -->
          <div class="gh-ek-placeholder">🧮</div>
        </a>
      </div>
    </div>`;
}

// ─── VIRTUAL MEET-UP CARD ──────────────────────────────────────

function buildMeetupCard(topics) {
  const events = topics.slice(0, 2);

  // If we have real topics, use them; else fall back to mock data
  const mockEvents = [
    {
      title: "Q&A Challenge",
      meta: "Feb 12 · 17:00 - 18:00 WIB",
      action: "Saya ikut",
      type: "joined",
      bgColor: "#1565c0",
    },
    {
      title: "Townhall Feb 2026",
      meta: "Feb 12 · 17:00 - 18:00 WIB",
      action: "Daftar",
      type: "register",
      bgColor: "#37474f",
    },
  ];

  const items =
    events.length > 0
      ? events.map((t, i) => ({
          title: t.title,
          meta: formatDateId(t.created_at),
          action: i === 0 ? "Saya ikut" : "Daftar",
          type: i === 0 ? "joined" : "register",
          imgUrl: t.image_url,
          url: `/t/${t.slug}/${t.id}`,
          bgColor: i === 0 ? "#1565c0" : "#37474f",
        }))
      : mockEvents.map((m) => ({ ...m, url: "/c/virtual-meet-up" }));

  const eventsHTML = items
    .map(
      (ev) => `
    <div class="gh-event-item" data-url="${ev.url}" role="button" tabindex="0"
         style="background:${ev.bgColor};">
      ${ev.imgUrl ? `<img src="${ev.imgUrl}" alt="${ev.title}" loading="lazy" />` : ""}
      <button class="gh-event-action ${ev.type}" onclick="event.stopPropagation()">
        ${ev.action} <span class="gh-action-arrow">${I.down}</span>
      </button>
      <div class="gh-event-info">
        <div class="gh-event-title">${ev.title}</div>
        <div class="gh-event-meta">${ev.meta}</div>
      </div>
    </div>`
    )
    .join("");

  return `
    <div class="gh-card gh-meetup-card">
      <div class="gh-card-header">
        <h2><em>Virtual Meet-Up</em> Selanjutnya</h2>
        <a href="/c/virtual-meet-up" class="gh-see-all" title="Lihat semua">${I.chevRight}</a>
      </div>
      <div class="gh-meetup-events">
        ${eventsHTML}
      </div>
    </div>`;
}

// ─── KOMUNITAS / BELAJAR WIDGET ────────────────────────────────

function buildTopicWidget(opts) {
  const {
    id,
    title,
    catUrl,
    trendingTopics = [],
    latestTopics = [],
    hasTabs = true,
    tabLabel = "Latest",
  } = opts;

  const activeTopics = hasTabs ? trendingTopics : latestTopics;

  return `
    <div class="gh-card gh-topic-widget" id="${id}">
      <div class="gh-card-header">
        <h2>${title}</h2>
        <a href="${catUrl}" class="gh-see-all" title="Lihat semua">${I.chevRight}</a>
      </div>
      ${
        hasTabs
          ? `<div class="gh-tw-tabs">
               <button class="gh-tw-tab active" data-tab="trending" data-widget="${id}">Trending</button>
               <button class="gh-tw-tab" data-tab="latest" data-widget="${id}">Latest</button>
             </div>`
          : `<div class="gh-tw-tab-label">${tabLabel}</div>`
      }
      <ul class="gh-tw-list" id="${id}-list">
        ${activeTopics.map(buildTopicItem).join("") || buildLoadingHTML()}
      </ul>
      ${
        hasTabs
          ? `<script type="application/json" id="${id}-trending-data">${JSON.stringify(
              trendingTopics.map(simplifyTopic)
            )}</script>
             <script type="application/json" id="${id}-latest-data">${JSON.stringify(
              latestTopics.map(simplifyTopic)
            )}</script>`
          : ""
      }
    </div>`;
}

function simplifyTopic(t) {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    category_name: t.category_name,
    tags: t.tags,
    like_count: t.like_count,
    reply_count: t.reply_count,
    last_posted_at: t.last_posted_at,
    created_at: t.created_at,
    posters: (t.posters || []).slice(0, 1).map((p) => ({
      user: {
        name: p.user?.name,
        username: p.user?.username,
        avatar_template: p.user?.avatar_template,
      },
    })),
  };
}

function buildLoadingHTML() {
  return `<li style="padding:20px;text-align:center;color:var(--gh-text-muted);font-size:13px;">
    <span class="gh-spinner" style="display:inline-block;width:16px;height:16px;border:2px solid var(--gh-border);border-top-color:var(--gh-blue-600);border-radius:50%;animation:gh-spin .8s linear infinite;vertical-align:middle;margin-right:8px;"></span>
    Memuat…
  </li>`;
}

// ─── NEWS CARD ────────────────────────────────────────────────

function buildNewsCard(topics) {
  return `
    <div class="gh-card gh-news-card">
      <div class="gh-card-header">
        <h2>Gasing Academy News</h2>
        <a href="/c/gasing-academy-news" class="gh-see-all" title="Lihat semua">${I.chevRight}</a>
      </div>
      <ul class="gh-news-list">
        ${topics.map(buildNewsItem).join("") || buildLoadingHTML()}
      </ul>
    </div>`;
}

// ─── GAME CARD ────────────────────────────────────────────────

function buildGameCard() {
  return `
    <div class="gh-card gh-game-card">
      <div class="gh-game-visual">
        <!--
          Upload a game cover image via theme assets and reference as:
          <img src="{{theme_asset 'katak-game.png'}}" alt="Katak dan Daun Teratai" />
        -->
        <div class="gh-game-placeholder">🐸</div>
      </div>
      <div class="gh-game-body">
        <div class="gh-game-tag">Computational Logic</div>
        <h3 class="gh-game-title">Katak dan Daun Teratai</h3>
        <p class="gh-game-desc">Perhatikan dan ingatlah urutan daun teratai yg muncul!</p>
        <a href="/t/katak-dan-daun-teratai" class="gh-game-cta">Ayo Main!</a>
      </div>
    </div>`;
}

// ─── FULL DASHBOARD ASSEMBLY ──────────────────────────────────

function buildDashboard(user, data) {
  const {
    trendingKomunitas,
    latestKomunitas,
    newsTopics,
    trendingBelajar,
    latestBelajar,
    meetupTopics,
  } = data;

  return `
    <div id="${DASHBOARD_ID}">
      ${buildHero(user)}

      <div class="gh-dashboard-grid">

        <!-- Row 1: Eksklusif + Meet-Up -->
        <div class="gh-row-top">
          ${buildEksklusifCard()}
          ${buildMeetupCard(meetupTopics)}
        </div>

        <!-- Row 2: Komunitas (left) + News (right) -->
        <div class="gh-row-main">
          ${buildTopicWidget({
            id: "gh-widget-komunitas",
            title: "Ada Apa di Komunitas Gasing?",
            catUrl: "/c/forum",
            trendingTopics: trendingKomunitas,
            latestTopics: latestKomunitas,
            hasTabs: true,
          })}
          ${buildNewsCard(newsTopics)}
        </div>

        <!-- Row 3: Belajar (left) + Game (right) -->
        <div class="gh-row-bottom">
          ${buildTopicWidget({
            id: "gh-widget-belajar",
            title: "Ayo Belajar Gasing Bersama!",
            catUrl: "/c/materi-gasing",
            latestTopics: latestBelajar,
            hasTabs: false,
            tabLabel: "Latest",
          })}
          ${buildGameCard()}
        </div>

      </div>
    </div>`;
}

// ─── EVENT BINDING ────────────────────────────────────────────

function bindDashboardEvents(container) {
  // Topic item click → navigate
  container.querySelectorAll("[data-topic-url]").forEach((el) => {
    el.addEventListener("click", () => {
      window.location.href = el.dataset.topicUrl;
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.href = el.dataset.topicUrl;
      }
    });
  });

  // Meet-up event item click
  container.querySelectorAll("[data-url]").forEach((el) => {
    el.addEventListener("click", () => {
      window.location.href = el.dataset.url;
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") window.location.href = el.dataset.url;
    });
  });

  // Tab switching for community widgets
  container.querySelectorAll(".gh-tw-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const widgetId = tab.dataset.widget;
      const tabName = tab.dataset.tab;
      const widget = document.getElementById(widgetId);
      if (!widget) return;

      // Toggle active state
      widget.querySelectorAll(".gh-tw-tab").forEach((t) =>
        t.classList.remove("active")
      );
      tab.classList.add("active");

      // Swap topic list
      const dataEl = document.getElementById(`${widgetId}-${tabName}-data`);
      if (!dataEl) return;
      try {
        const topics = JSON.parse(dataEl.textContent);
        const list = document.getElementById(`${widgetId}-list`);
        if (list) list.innerHTML = topics.map(buildTopicItem).join("");

        // Re-bind click events for new items
        list?.querySelectorAll("[data-topic-url]").forEach((el) => {
          el.addEventListener("click", () => {
            window.location.href = el.dataset.topicUrl;
          });
        });
      } catch (e) {
        console.warn("[GasingDash] tab switch parse error", e);
      }
    });
  });
}

// ─── MOUNT / UNMOUNT ──────────────────────────────────────────

function isHomepage() {
  const path = window.location.pathname;
  return (
    path === "/" ||
    path === "/latest" ||
    path === "/top" ||
    path === "/new" ||
    (path.startsWith("/latest") && !path.startsWith("/latest/"))
  );
}

async function mountDashboard() {
  if (!isHomepage()) return;
  if (document.getElementById(DASHBOARD_ID)) return;

  // Mark body so CSS hides the default topic list
  document.body.classList.add("gh-dashboard-active");

  // Find the best injection point
  const outlet =
    document.querySelector("#main-outlet .container") ||
    document.querySelector("#main-outlet") ||
    document.querySelector("main");

  if (!outlet) return;

  // Render skeleton immediately so the page doesn't look empty
  const wrapper = document.createElement("div");
  wrapper.id = `${DASHBOARD_ID}-wrapper`;
  outlet.prepend(wrapper);

  // Fetch data concurrently
  const [user, trendingKomunitas, latestKomunitas, newsTopics, latestBelajar, meetupTopics] =
    await Promise.all([
      fetchCurrentUser(),
      fetchCategoryTopics(CAT.komunitas, TOPIC_COUNT.komunitas, "trending"),
      fetchCategoryTopics(CAT.komunitas, TOPIC_COUNT.komunitas, "latest"),
      fetchCategoryTopics(CAT.news, TOPIC_COUNT.news, "latest"),
      fetchCategoryTopics(CAT.belajar, TOPIC_COUNT.belajar, "latest"),
      fetchCategoryTopics(CAT.meetup, 2, "latest"),
    ]);

  wrapper.innerHTML = buildDashboard(user, {
    trendingKomunitas,
    latestKomunitas,
    newsTopics,
    trendingBelajar: latestBelajar, // reuse latest for trending until we have real signal
    latestBelajar,
    meetupTopics,
  });

  bindDashboardEvents(wrapper);
}

function unmountDashboard() {
  const wrapper = document.getElementById(`${DASHBOARD_ID}-wrapper`);
  if (wrapper) wrapper.remove();
  document.body.classList.remove("gh-dashboard-active");
}

// ─── DISCOURSE PLUGIN API ENTRY POINT ─────────────────────────
export default apiInitializer("0.8", (api) => {
  // Use onPageChange (fires on every SPA navigation + initial load)
  api.onPageChange((url) => {
    const path = new URL(url, window.location.origin).pathname;

    const isHome =
      path === "/" ||
      path === "/latest" ||
      /^\/latest\/?$/.test(path) ||
      /^\/top\/?$/.test(path) ||
      /^\/new\/?$/.test(path);

    if (isHome) {
      // Give Ember a tick to render the outlet before we inject
      setTimeout(() => {
        if (!document.getElementById(DASHBOARD_ID)) {
          mountDashboard();
        }
      }, 60);
    } else {
      unmountDashboard();
    }
  });

  // ── BODY CLASS TOGGLE via CSS ─────────────────────────────
  // When gh-dashboard-active is on body, our SCSS hides
  // .topic-list, .list-controls, etc. automatically.
  // (The selectors in common.scss target body.gh-dashboard-active)

  // Initial load (direct URL hit, not SPA navigation)
  if (typeof document !== "undefined") {
    const doMount = () => {
      if (isHomepage() && !document.getElementById(DASHBOARD_ID)) {
        mountDashboard();
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        setTimeout(doMount, 100)
      );
    } else {
      setTimeout(doMount, 100);
    }
  }

  // ── MUTATION OBSERVER FALLBACK ────────────────────────────
  // Catches cases where Ember renders the outlet after our
  // onPageChange fires but before DOM is ready.
  if (typeof MutationObserver !== "undefined") {
    const obs = new MutationObserver(() => {
      if (isHomepage() && !document.getElementById(DASHBOARD_ID)) {
        mountDashboard();
      }
    });
    obs.observe(document.body, { childList: true, subtree: false });
  }
});
