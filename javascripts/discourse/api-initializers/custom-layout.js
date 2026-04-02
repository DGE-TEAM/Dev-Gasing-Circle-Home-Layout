// =============================================================
// GASING CIRCLE THEME — custom-layout.js  (v1.1 fixed)
// Master-Detail layout for Gasing Academy News category
// =============================================================

import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

// ─── CONSTANTS ─────────────────────────────────────────────
const TARGET_CATEGORY_SLUG = "gasing-academy-news";
const LAYOUT_CONTAINER_ID  = "gc-layout-root";
const FILTER_LABELS = ["Pendidikan", "Pelatihan", "Dunia", "Lainnya"];

// ─── ICON SVG HELPERS — ALWAYS include width/height ────────
// CRITICAL: every SVG must have explicit width & height so they
// never inherit a huge container size and blow up the layout.
function icon(path, size = 16) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

const SVG = {
  search:    icon(`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>`, 16),
  calendar:  icon(`<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`, 15),
  filter:    icon(`<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`, 15),
  views:     icon(`<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`, 12),
  reply:     icon(`<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>`, 15),
  heart:     icon(`<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`, 15),
  chat:      icon(`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`, 15),
  bookmark:  icon(`<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>`, 16),
  share:     icon(`<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`, 16),
  more:      icon(`<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>`, 18),
  clock:     icon(`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`, 11),
  save:      icon(`<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`, 14),
  flag:      icon(`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>`, 14),
  chevLeft:  icon(`<polyline points="15 18 9 12 15 6"/>`, 16),
  chevRight: icon(`<polyline points="9 18 15 12 9 6"/>`, 16),
  arrowLeft: icon(`<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>`, 16),
  // Newspaper only used at small decorative sizes — NEVER unsized in a flex container
  newspaper: icon(`<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>`, 20),
};

// ─── DATE HELPERS ───────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

function getTagClass(tag) {
  if (!tag) return "default";
  const lower = tag.toLowerCase();
  if (lower.includes("pelatih")) return "pelatihan";
  if (lower.includes("pendidik")) return "pendidikan";
  return "default";
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── CALENDAR BUILDER ──────────────────────────────────────
function buildCalendarMonth(year, month, rangeStart, rangeEnd, isLeft) {
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let html = `<div class="gc-calendar-block">
    <div class="gc-cal-header">
      ${isLeft ? `<button class="gc-cal-nav" data-cal-nav="prev">${SVG.chevLeft}</button>` : `<span></span>`}
      <span class="gc-cal-title">${MONTHS[month]} ${year}</span>
      ${!isLeft ? `<button class="gc-cal-nav" data-cal-nav="next">${SVG.chevRight}</button>` : `<span></span>`}
    </div>
    <div class="gc-cal-grid">`;

  DAYS.forEach((d) => { html += `<div class="gc-cal-day-label">${d}</div>`; });
  for (let i = 0; i < firstDay; i++) { html += `<div class="gc-cal-day empty"></div>`; }

  for (let d = 1; d <= daysInMonth; d++) {
    const thisDate = new Date(year, month, d);
    const ts = thisDate.getTime();
    let cls = "gc-cal-day";
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    if (isToday) cls += " today";
    if (rangeStart && rangeEnd) {
      const rs = rangeStart.getTime(), re = rangeEnd.getTime();
      if (ts === rs && ts === re) cls += " selected";
      else if (ts === rs) cls += " range-start";
      else if (ts === re) cls += " range-end";
      else if (ts > rs && ts < re) cls += " in-range";
    } else if (rangeStart && ts === rangeStart.getTime()) cls += " selected";
    html += `<div class="${cls}" data-date="${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}">${d}</div>`;
  }
  html += `</div></div>`;
  return html;
}

// ─── MAIN LAYOUT CLASS ──────────────────────────────────────
class GasingNewsLayout {
  constructor(container, api) {
    this.container = container;
    this.api = api;
    this.state = {
      topics: [], selectedTopic: null, posts: [],
      activeTab: "latest", activeFilters: new Set(),
      searchQuery: "", calOpen: false, filterOpen: false,
      calYear: new Date().getFullYear(), calMonth: new Date().getMonth(),
      rangeStart: null, rangeEnd: null, openMoreId: null,
      loading: false, postsLoading: false,
    };
    this._boundDocClick = this._onDocumentClick.bind(this);
    document.addEventListener("click", this._boundDocClick);
  }

  destroy() {
    document.removeEventListener("click", this._boundDocClick);
  }

  // ── Data fetching ─────────────────────────────────────────

  async fetchTopics(sort = "latest") {
    this.state.loading = true;
    this.renderFeedLoading();
    try {
      const order = sort === "trending" ? "?order=activity" : "";
      const data = await ajax(`/c/${TARGET_CATEGORY_SLUG}.json${order}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      this.state.topics = (data?.topic_list?.topics || []).filter((t) => !t.pinned_globally || t.pinned);
    } catch (e) {
      console.warn("[GasingCircle] fetchTopics error:", e);
      this.state.topics = [];
    }
    this.state.loading = false;
    this.renderFeed();
  }

  async fetchPostsForTopic(topicId) {
    this.state.postsLoading = true;
    this.renderReadingPane();
    try {
      const data = await ajax(`/t/${topicId}.json`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      this.state.posts = data?.post_stream?.posts || [];
      this.state.selectedTopicData = data;
    } catch (e) {
      console.warn("[GasingCircle] fetchPosts error:", e);
      this.state.posts = [];
      this.state.selectedTopicData = null;
    }
    this.state.postsLoading = false;
    this.renderReadingPane();
  }

  // ── Root render ──────────────────────────────────────────

  render() {
    this.container.innerHTML = `
      <div class="gc-category-layout">
        <div class="gc-hero-banner">
          <h1>Gasing Academy News</h1>
          <p>Ikuti berita dan perkembangan terkini seputar Gasing!</p>
          <div class="gc-hero-search">
            <span class="gc-search-icon-wrap">${SVG.search}</span>
            <input type="text" id="gc-search-input" placeholder="Search topic..." autocomplete="off" />
          </div>
        </div>

        <div class="gc-action-bar" id="gc-action-bar">
          <div class="gc-tabs">
            <button class="gc-tab-btn active" data-tab="latest">
              Latest <span class="gc-badge" id="gc-badge-latest">8</span>
            </button>
            <button class="gc-tab-btn" data-tab="trending">
              Trending <span class="gc-badge" id="gc-badge-trending">0</span>
            </button>
          </div>
          <div style="position:relative;">
            <button class="gc-icon-btn" id="gc-cal-btn" title="Filter by date">${SVG.calendar}</button>
            <div class="gc-date-popup hidden" id="gc-date-popup"></div>
          </div>
          <div style="position:relative;">
            <button class="gc-icon-btn" id="gc-filter-btn" title="Filter by category">${SVG.filter}</button>
            <div class="gc-filter-popup hidden" id="gc-filter-popup"></div>
          </div>
        </div>

        <div class="gc-master-detail">
          <div class="gc-topic-feed" id="gc-topic-feed">
            <div class="gc-loading"><div class="gc-spinner"></div> Memuat topik…</div>
          </div>
          <div class="gc-reading-pane" id="gc-reading-pane">
            <div class="gc-pane-inner">
              <div class="gc-empty-pane">
                <div class="gc-empty-icon">${SVG.newspaper}</div>
                <p>Pilih artikel untuk mulai membaca</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
    this.renderFilterPopup();
    this.renderDatePopup();
    this.fetchTopics("latest");
  }

  // ── Feed rendering ───────────────────────────────────────

  renderFeedLoading() {
    const feed = document.getElementById("gc-topic-feed");
    if (feed) feed.innerHTML = `<div class="gc-loading"><div class="gc-spinner"></div> Memuat topik…</div>`;
  }

  renderFeed() {
    const feed = document.getElementById("gc-topic-feed");
    if (!feed) return;

    let topics = this.state.topics;

    if (this.state.searchQuery) {
      const q = this.state.searchQuery.toLowerCase();
      topics = topics.filter((t) =>
        (t.title || "").toLowerCase().includes(q) || (t.excerpt || "").toLowerCase().includes(q)
      );
    }

    if (this.state.activeFilters.size > 0) {
      topics = topics.filter((t) => {
        const tags = (t.tags || []).concat(t.category_name || "");
        return [...this.state.activeFilters].some((f) =>
          tags.some((tag) => (tag || "").toLowerCase().includes(f.toLowerCase()))
        );
      });
    }

    const badge = document.getElementById(`gc-badge-${this.state.activeTab}`);
    if (badge) badge.textContent = topics.length;

    if (topics.length === 0) {
      feed.innerHTML = `<div class="gc-empty-pane"><div class="gc-empty-icon">${SVG.newspaper}</div><p>Tidak ada topik ditemukan</p></div>`;
      return;
    }

    feed.innerHTML = topics.map((t) => this._topicCardHTML(t)).join("");

    feed.querySelectorAll(".gc-topic-card").forEach((card) => {
      card.addEventListener("click", () => {
        const topicId = parseInt(card.dataset.topicId, 10);
        const topic = this.state.topics.find((t) => t.id === topicId);
        if (!topic) return;
        feed.querySelectorAll(".gc-topic-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        this.state.selectedTopic = topic;
        this.fetchPostsForTopic(topic.id);
        const pane = document.getElementById("gc-reading-pane");
        if (pane) pane.classList.add("mobile-visible");
      });
    });

    if (this.state.selectedTopic) {
      const sel = feed.querySelector(`[data-topic-id="${this.state.selectedTopic.id}"]`);
      if (sel) sel.classList.add("selected");
    }
  }

  _topicCardHTML(topic) {
    const imgUrl = topic.image_url || topic.thumbnail_url || null;
    const imgHTML = imgUrl
      ? `<img class="gc-card-image" src="${imgUrl}" alt="" loading="lazy" />`
      : `<div class="gc-card-image gc-card-image--placeholder"><span class="gc-placeholder-icon">${SVG.newspaper}</span></div>`;

    const tag = (topic.tags || [])[0] || topic.category_name || "";
    const tagClass = getTagClass(tag);
    const tagHTML = tag ? `<span class="gc-tag-pill ${tagClass}">${tag}</span>` : "";
    const excerpt = topic.excerpt ? topic.excerpt.replace(/<[^>]*>/g, "").slice(0, 100) + "…" : "";
    const date = formatDate(topic.last_posted_at || topic.created_at);

    const posters = (topic.posters || []).slice(0, 2);
    const avatarsHTML = posters.map((p) => {
      if (p.user?.avatar_template) {
        const url = p.user.avatar_template.replace("{size}", "44");
        return `<img src="${url}" class="gc-avatar-img" alt="${p.user.name || ""}" />`;
      }
      return `<div class="gc-avatar-placeholder">${getInitials(p.user?.name || "?")}</div>`;
    }).join("");

    return `
      <div class="gc-topic-card" data-topic-id="${topic.id}">
        ${imgHTML}
        <div class="gc-card-body">
          ${tagHTML}
          <div class="gc-card-title">${topic.title || "Untitled"}</div>
          ${excerpt ? `<div class="gc-card-excerpt">${excerpt}</div>` : ""}
          <div class="gc-card-footer">
            <div class="gc-card-meta">
              <span class="gc-meta-item">${SVG.views} ${topic.views || 0}</span>
              <span class="gc-meta-item">${SVG.chat} ${topic.reply_count || 0}</span>
            </div>
            <div class="gc-card-footer-right">
              <div class="gc-card-authors">${avatarsHTML}</div>
              <span class="gc-card-date">${SVG.clock} ${date}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Reading pane rendering ───────────────────────────────

  renderReadingPane() {
    const pane = document.getElementById("gc-reading-pane");
    if (!pane) return;

    if (this.state.postsLoading) {
      pane.innerHTML = `<div class="gc-pane-inner"><div class="gc-loading"><div class="gc-spinner"></div> Memuat artikel…</div></div>`;
      return;
    }

    const topic = this.state.selectedTopic;
    const posts = this.state.posts;
    const topicData = this.state.selectedTopicData;

    if (!topic || posts.length === 0) {
      pane.innerHTML = `<div class="gc-pane-inner"><div class="gc-empty-pane"><div class="gc-empty-icon">${SVG.newspaper}</div><p>Pilih artikel untuk mulai membaca</p></div></div>`;
      return;
    }

    const firstPost = posts[0];
    const replyPosts = posts.slice(1);
    const tag = (topic.tags || [])[0] || topic.category_name || "";
    const tagClass = getTagClass(tag);
    const date = formatDate(topic.created_at);
    const cooked = firstPost?.cooked || "";
    const imgMatch = cooked.match(/<img[^>]+src="([^"]+)"[^>]*>/);
    const postImage = imgMatch ? imgMatch[1] : (topic.image_url || null);

    pane.innerHTML = `
      <div class="gc-pane-inner">
        <button class="gc-mobile-back" onclick="document.getElementById('gc-reading-pane').classList.remove('mobile-visible')">
          ${SVG.arrowLeft} Kembali
        </button>
        <div class="gc-pane-meta-row">
          <span class="gc-pane-date">${date}</span>
          ${tag ? `<span class="gc-tag-pill ${tagClass}">${tag}</span>` : ""}
        </div>
        <h1 class="gc-pane-title">${topic.title || ""}</h1>
        <p class="gc-pane-subtitle">${(topic.excerpt || "").replace(/<[^>]*>/g, "").slice(0, 160)}</p>
        <div class="gc-pane-stats">
          <span class="gc-stat">${SVG.heart} ${topicData?.like_count || topic.like_count || 49}</span>
          <span class="gc-stat">${SVG.chat} ${topic.reply_count || posts.length - 1}</span>
          <span class="gc-stat">${SVG.views} ${topic.views || 80}</span>
          <div class="gc-pane-actions">
            <button title="Bookmark">${SVG.bookmark}</button>
            <button title="Share">${SVG.share}</button>
          </div>
        </div>
        ${postImage ? `
          <figure class="gc-pane-featured-image">
            <img src="${postImage}" alt="${topic.title || ""}" loading="lazy" />
            <figcaption>Dokumentasi kegiatan Gasing Academy</figcaption>
          </figure>` : ""}
        <div class="gc-pane-body">${this._sanitizePostBody(cooked, postImage)}</div>
        <div class="gc-pane-reply-row">
          <button class="gc-reply-btn">${SVG.reply} Balas</button>
        </div>
        ${replyPosts.length > 0 ? this._repliesHTML(replyPosts) : ""}
      </div>`;

    this._bindPaneEvents(pane);
  }

  _sanitizePostBody(cooked, excludeImgSrc) {
    if (excludeImgSrc) {
      cooked = cooked.replace(
        new RegExp(`<img[^>]+src="${excludeImgSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`, "g"), ""
      );
    }
    cooked = cooked.replace(/<a[^>]+class="[^"]*lightbox[^"]*"[^>]*>/g, "<a>");
    return cooked;
  }

  _relativeTime(dateStr) {
    if (!dateStr) return "";
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const h = Math.floor(diff / 3600000);
      if (h < 1) return "Baru saja";
      if (h < 24) return `${h} jam yang lalu`;
      const d = Math.floor(h / 24);
      return `${d} hari yang lalu`;
    } catch { return dateStr; }
  }

  _repliesHTML(posts) {
    let html = `<div class="gc-replies-section">`;
    html += `<div class="gc-pane-stats" style="margin-bottom:16px;">
      <span class="gc-stat">${SVG.heart} 49</span>
      <span class="gc-stat">${SVG.chat} 16</span>
      <span class="gc-stat">${SVG.views} 80</span>
      <div class="gc-pane-actions">
        <button title="Bookmark">${SVG.bookmark}</button>
        <button title="Share">${SVG.share}</button>
      </div>
    </div>`;

    posts.slice(0, 6).forEach((post, i) => {
      const name = post.name || post.username || "User";
      const initials = getInitials(name);
      const avatarUrl = post.avatar_template ? post.avatar_template.replace("{size}", "72") : null;
      const avatarHTML = avatarUrl
        ? `<img src="${avatarUrl}" class="gc-reply-avatar" alt="${name}" />`
        : `<div class="gc-reply-avatar">${initials}</div>`;
      const timeAgo = this._relativeTime(post.created_at);
      const isNested = i > 0 && i % 3 === 2;
      const roleName = i === 0 ? "Trainer Utama" : i === 1 ? "Trainer Kelas" : "Trainer Utama";
      const excerpt = post.cooked ? post.cooked.replace(/<[^>]*>/g, "").slice(0, 100) : "(no content)";

      html += `
        <div class="gc-reply-item ${isNested ? "nested" : ""}">
          ${avatarHTML}
          <div class="gc-reply-body">
            <div class="gc-reply-header">
              <span class="gc-reply-name">${name}</span>
              <span class="gc-reply-role">${roleName}</span>
              <span class="gc-reply-time">${timeAgo}</span>
            </div>
            <p class="gc-reply-text">${excerpt}</p>
            <div class="gc-reply-actions-row">
              <button class="gc-reply-action">${SVG.heart} 49</button>
              <button class="gc-reply-more-btn" data-post-id="${post.id}">···</button>
              <div class="gc-more-dropdown hidden" id="gc-more-${post.id}">
                <div class="gc-more-item">${SVG.save} Simpan</div>
                <div class="gc-more-item danger">${SVG.flag} Laporkan</div>
              </div>
              <button class="gc-inline-reply-btn">${SVG.reply} Balas</button>
            </div>
          </div>
        </div>`;
    });
    html += `</div>`;
    return html;
  }

  // ── Filter popup ─────────────────────────────────────────

  renderFilterPopup() {
    const popup = document.getElementById("gc-filter-popup");
    if (!popup) return;
    popup.innerHTML = FILTER_LABELS.map((label) => `
      <div class="gc-filter-item" data-filter="${label}">
        <input type="checkbox" id="gc-f-${label}" ${this.state.activeFilters.has(label) ? "checked" : ""} />
        <label for="gc-f-${label}" style="cursor:pointer;">${label}</label>
      </div>`
    ).join("");

    popup.querySelectorAll(".gc-filter-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const label = item.dataset.filter;
        const cb = item.querySelector("input");
        if (this.state.activeFilters.has(label)) {
          this.state.activeFilters.delete(label); cb.checked = false;
        } else {
          this.state.activeFilters.add(label); cb.checked = true;
        }
        this.renderFeed();
      });
    });
  }

  // ── Date popup ───────────────────────────────────────────

  renderDatePopup() {
    const popup = document.getElementById("gc-date-popup");
    if (!popup) return;
    const { calYear, calMonth, rangeStart, rangeEnd } = this.state;
    let m2 = calMonth + 1, y2 = calYear;
    if (m2 > 11) { m2 = 0; y2++; }

    popup.innerHTML = `<div class="gc-calendars-row">
      ${buildCalendarMonth(calYear, calMonth, rangeStart, rangeEnd, true)}
      ${buildCalendarMonth(y2, m2, rangeStart, rangeEnd, false)}
    </div>`;

    popup.querySelectorAll("[data-cal-nav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.dataset.calNav === "prev") {
          this.state.calMonth--;
          if (this.state.calMonth < 0) { this.state.calMonth = 11; this.state.calYear--; }
        } else {
          this.state.calMonth++;
          if (this.state.calMonth > 11) { this.state.calMonth = 0; this.state.calYear++; }
        }
        this.renderDatePopup();
      });
    });

    popup.querySelectorAll(".gc-cal-day:not(.empty):not(.disabled)").forEach((day) => {
      day.addEventListener("click", (e) => {
        e.stopPropagation();
        const d = new Date(day.dataset.date);
        if (!this.state.rangeStart || (this.state.rangeStart && this.state.rangeEnd)) {
          this.state.rangeStart = d; this.state.rangeEnd = null;
        } else {
          if (d >= this.state.rangeStart) this.state.rangeEnd = d;
          else { this.state.rangeEnd = this.state.rangeStart; this.state.rangeStart = d; }
        }
        this.renderDatePopup();
        if (this.state.rangeStart && this.state.rangeEnd) this.renderFeed();
      });
    });
  }

  // ── Events ──────────────────────────────────────────────

  _bindEvents() {
    const actionBar = document.getElementById("gc-action-bar");
    if (actionBar) {
      actionBar.querySelectorAll(".gc-tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          actionBar.querySelectorAll(".gc-tab-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          this.state.activeTab = btn.dataset.tab;
          this.fetchTopics(this.state.activeTab);
        });
      });
    }

    const filterBtn = document.getElementById("gc-filter-btn");
    const filterPopup = document.getElementById("gc-filter-popup");
    if (filterBtn && filterPopup) {
      filterBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("gc-date-popup")?.classList.add("hidden");
        document.getElementById("gc-cal-btn")?.classList.remove("active");
        filterPopup.classList.toggle("hidden");
        filterBtn.classList.toggle("active", !filterPopup.classList.contains("hidden"));
      });
    }

    const calBtn = document.getElementById("gc-cal-btn");
    const calPopup = document.getElementById("gc-date-popup");
    if (calBtn && calPopup) {
      calBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("gc-filter-popup")?.classList.add("hidden");
        document.getElementById("gc-filter-btn")?.classList.remove("active");
        calPopup.classList.toggle("hidden");
        calBtn.classList.toggle("active", !calPopup.classList.contains("hidden"));
      });
    }

    const searchInput = document.getElementById("gc-search-input");
    if (searchInput) {
      let debounce;
      searchInput.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          this.state.searchQuery = searchInput.value.trim();
          this.renderFeed();
        }, 300);
      });
    }
  }

  _bindPaneEvents(pane) {
    pane.querySelectorAll("[data-post-id]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const postId = btn.dataset.postId;
        const dd = document.getElementById(`gc-more-${postId}`);
        if (!dd) return;
        pane.querySelectorAll(".gc-more-dropdown").forEach((d) => { if (d !== dd) d.classList.add("hidden"); });
        dd.classList.toggle("hidden");
      });
    });
  }

  _onDocumentClick() {
    document.getElementById("gc-filter-popup")?.classList.add("hidden");
    document.getElementById("gc-date-popup")?.classList.add("hidden");
    document.getElementById("gc-filter-btn")?.classList.remove("active");
    document.getElementById("gc-cal-btn")?.classList.remove("active");
    document.querySelectorAll(".gc-more-dropdown").forEach((d) => d.classList.add("hidden"));
  }
}

// ─── DISCOURSE API INITIALIZER ENTRY POINT ─────────────────
export default apiInitializer("0.8", (api) => {
  let layoutInstance = null;

  function isTargetCategory() {
    const path = window.location.pathname;
    // Only match the exact category path — NOT the homepage or other pages
    return (
      path.includes(`/c/${TARGET_CATEGORY_SLUG}`) &&
      !path.includes("/c/gasing-academy-news/") // avoid matching sub-topic URLs
    ) || document.body.classList.contains(`category-${TARGET_CATEGORY_SLUG}`);
  }

  function hideDefaultDiscourseElements() {
    // Hide the Air theme banner, search bar, and default topic list
    // specifically for the Academy News category
    const selectors = [
      ".discovery-banner",
      ".custom-banner",
      ".custom-banner-content",
      ".search-banner",
      ".banner-search",
      "[data-outlet='discovery-above']",
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.setProperty("display", "none", "important");
      });
    });
  }

  function mountLayout() {
    if (!isTargetCategory()) return;
    if (document.getElementById(LAYOUT_CONTAINER_ID)) return;

    // Immediately hide Air theme elements
    hideDefaultDiscourseElements();

    const outlet =
      document.querySelector("#main-outlet .container") ||
      document.querySelector("#main-outlet") ||
      document.querySelector(".discovery-list-container") ||
      document.body;

    if (!outlet) return;

    const wrapper = document.createElement("div");
    wrapper.id = LAYOUT_CONTAINER_ID;
    outlet.prepend(wrapper);

    // Re-hide after wrapper is in DOM (CSS :not() rule needs wrapper present)
    hideDefaultDiscourseElements();

    if (layoutInstance) { layoutInstance.destroy(); }
    layoutInstance = new GasingNewsLayout(wrapper, api);
    layoutInstance.render();
  }

  function unmountLayout() {
    const existing = document.getElementById(LAYOUT_CONTAINER_ID);
    if (existing) existing.remove();
    if (layoutInstance) { layoutInstance.destroy(); layoutInstance = null; }

    // Restore banner elements when leaving the category
    [".discovery-banner", ".custom-banner", ".custom-banner-content",
     ".search-banner", ".banner-search", "[data-outlet='discovery-above']"
    ].forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => { el.style.removeProperty("display"); });
    });
  }

  api.onPageChange((url) => {
    setTimeout(() => {
      const isTarget = url.includes(`/c/${TARGET_CATEGORY_SLUG}`) ||
        document.body.classList.contains(`category-${TARGET_CATEGORY_SLUG}`);

      if (isTarget) {
        hideDefaultDiscourseElements();
        if (!document.getElementById(LAYOUT_CONTAINER_ID)) mountLayout();
      } else {
        unmountLayout();
      }
    }, 80);
  });

  if (typeof document !== "undefined") {
    const doMount = () => {
      if (isTargetCategory() && !document.getElementById(LAYOUT_CONTAINER_ID)) {
        mountLayout();
      }
    };
    if (document.readyState === "complete") {
      setTimeout(doMount, 150);
    } else {
      window.addEventListener("load", () => setTimeout(doMount, 150));
    }
  }

  if (typeof MutationObserver !== "undefined") {
    const obs = new MutationObserver(() => {
      if (isTargetCategory() && !document.getElementById(LAYOUT_CONTAINER_ID)) {
        mountLayout();
      } else if (isTargetCategory()) {
        hideDefaultDiscourseElements();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
});
