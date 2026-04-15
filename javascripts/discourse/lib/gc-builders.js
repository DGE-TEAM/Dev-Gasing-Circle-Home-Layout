// ─────────────────────────────────────────────────────────────
// gc-builders.js — HTML builders: hero, action bar, topic card,
//                  filter popup, date popup, load-more button
// ─────────────────────────────────────────────────────────────

import moment from "moment";
import { STATE } from "./gc-state";
import { SVG } from "./gc-icons";
import { renderTag, getTopicTag } from "./gc-tags";
import { buildCalendarHTML } from "./gc-calendar";

export function buildHeroBanner() {
  /* eslint-disable no-undef */
  const title =
    (typeof settings !== "undefined" && settings.gc_hero_title?.trim()) ||
    "Gasing Academy News 📢";
  const subtitle =
    (typeof settings !== "undefined" && settings.gc_hero_subtitle?.trim()) ||
    "Ikuti berita dan perkembangan terkini!";
  /* eslint-enable no-undef */
  return `<div id="gc-hero-banner">
    <h1 class="gc-hero-title">${title}</h1>
    <p class="gc-hero-subtitle">${subtitle}</p>
  </div>`;
}

export function buildActionBar() {
  return `<div id="gc-action-bar"><div class="gc-action-bar-inner">
    <div class="gc-bar-left">
      <div class="gc-pills">
        <button class="gc-pill active" data-pill="latest">Latest <span class="gc-pill-badge" id="gc-badge-latest">—</span></button>
        <button class="gc-pill" data-pill="trending">Trending <span class="gc-pill-badge" id="gc-badge-trending">—</span></button>
      </div>
      <div class="gc-bar-divider"></div>
      <div class="gc-icon-buttons">
        <button class="gc-icon-btn gc-filter-btn-label" id="gc-filter-btn">${SVG.filter} Filter</button>
        <button class="gc-icon-btn" id="gc-date-btn">${SVG.calendar}</button>
      </div>
    </div>
    <div class="gc-search-wrapper">
      <span class="gc-search-icon">${SVG.search}</span>
      <input class="gc-search-input" type="text" id="gc-search-input" placeholder="Cari topik..." />
    </div>
  </div></div>`;
}

export function buildFilterPopup() {
  const tags = STATE.availableTags;
  if (!tags.length) {
    return `<div id="gc-filter-popup"><p class="gc-filter-empty" style="padding:8px 12px;font-size:0.82rem;color:var(--gc-text-muted)">Tidak ada tag tersedia.</p></div>`;
  }
  return `<div id="gc-filter-popup">${tags
    .map((tag) => {
      const val = tag.toLowerCase();
      const id = `gc-filter-${val.replace(/[\s/]+/g, "-")}`;
      const label = tag.charAt(0).toUpperCase() + tag.slice(1);
      return `<div class="gc-filter-item">
        <input type="checkbox" id="${id}" data-filter="${val}" ${STATE.selectedFilters.includes(val) ? "checked" : ""} />
        <label for="${id}">${label}</label>
      </div>`;
    })
    .join("")}</div>`;
}

export function buildDatePopup() {
  const now = new Date();
  if (!STATE.calendarMonth.left) {
    STATE.calendarMonth.left = {
      year: now.getFullYear(),
      month: now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1,
    };
    STATE.calendarMonth.right = {
      year: now.getFullYear(),
      month: now.getMonth(),
    };
  }
  const { left, right } = STATE.calendarMonth;
  const hasRange = STATE.dateRange.start || STATE.dateRange.end;
  return `<div id="gc-date-popup">
    <div class="gc-date-header">
      <button id="gc-date-prev">${SVG.chevronLeft}</button>
      <span></span>
      <button id="gc-date-next">${SVG.chevronRight}</button>
    </div>
    <div class="gc-calendars">
      ${buildCalendarHTML(left.year, left.month, STATE.dateRange.start, STATE.dateRange.end)}
      ${buildCalendarHTML(right.year, right.month, STATE.dateRange.start, STATE.dateRange.end)}
    </div>
    ${hasRange ? `<div class="gc-date-actions"><button id="gc-date-clear" class="gc-date-clear-btn">Hapus Filter</button></div>` : ""}
  </div>`;
}

export function buildLoadMoreButton() {
  return `<div id="gc-load-more-wrap">
    <button id="gc-load-more-btn" class="gc-load-more-btn">Muat Lebih Banyak</button>
  </div>`;
}

export function buildTopicCard(topic) {
  if (!topic) return "";
  const tag = getTopicTag(topic);
  const tagHtml = tag ? renderTag(tag) : "";
  const img = topic.image_url
    ? `<div class="gc-card-thumbnail"><img src="${topic.image_url}" alt="" loading="lazy" /></div>`
    : "";
  const excerpt = topic.excerpt
    ? `<p class="gc-card-excerpt">${topic.excerpt.replace(/<[^>]*>/g, "").substring(0, 100)}...</p>`
    : "";
  const avatar = topic.posters?.[0]?.user?.avatar_template
    ? `<img class="gc-avatar" src="${topic.posters[0].user.avatar_template.replace("{size}", "24")}" alt="" />`
    : "";
  return `
    <div class="gc-topic-card" data-topic-id="${topic.id}" data-topic-slug="${topic.slug}" data-created-at="${topic.created_at}">
      ${img}
      <div class="gc-card-body">
        ${tagHtml}
        <p class="gc-card-title">${topic.title}</p>
        ${excerpt}
        <div class="gc-card-meta">
          ${avatar}
          <span class="gc-meta-item">${SVG.heart} ${topic.like_count || 0}</span>
          <span class="gc-meta-item">${SVG.chat} ${topic.posts_count ? topic.posts_count - 1 : 0}</span>
          <span class="gc-meta-item">${SVG.eye} ${topic.views || 0}</span>
          <span class="gc-meta-item" style="margin-left:auto">${moment(topic.created_at).format("D MMM YYYY")}</span>
        </div>
      </div>
    </div>`;
}
